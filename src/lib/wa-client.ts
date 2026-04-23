import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} from "@whiskeysockets/baileys";
import { isJvtoPhone, normalizePhone } from "./jvto-utils";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import pino from "pino";

declare global {
  var __waClients: Map<string, WhatsAppClient> | undefined;
}

/** On Vercel the deployment package is read-only; /tmp is the only writable dir. */
function getAuthPath(authDirRelative: string): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", authDirRelative);
  }
  return path.join(process.cwd(), authDirRelative);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMessagePayload(key: any, timestamp: unknown, msgType: string, msgObj: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = (msgObj[msgType] ?? {}) as Record<string, any>;

  let text: string | null = null;
  let media: Record<string, unknown> | null = null;
  let location: Record<string, unknown> | null = null;
  let contact: Record<string, unknown> | null = null;

  switch (msgType) {
    case "conversation":
      text = msgObj.conversation as string;
      break;
    case "extendedTextMessage":
      text = m.text ?? null;
      break;
    case "imageMessage":
    case "videoMessage":
    case "stickerMessage":
      text = m.caption ?? null;
      media = {
        url: m.url ?? null,
        mimetype: m.mimetype ?? null,
        fileSize: m.fileLength ? Number(m.fileLength) : null,
        mediaKey: m.mediaKey ? Buffer.from(m.mediaKey).toString("base64") : null,
        directPath: m.directPath ?? null,
        ...(msgType === "videoMessage" && { seconds: m.seconds ?? null }),
        ...(msgType === "stickerMessage" && { isAnimated: m.isAnimated ?? false }),
      };
      break;
    case "audioMessage":
      media = {
        url: m.url ?? null,
        mimetype: m.mimetype ?? null,
        seconds: m.seconds ?? null,
        ptt: m.ptt ?? false,
        mediaKey: m.mediaKey ? Buffer.from(m.mediaKey).toString("base64") : null,
        directPath: m.directPath ?? null,
      };
      break;
    case "documentMessage":
      text = m.caption ?? null;
      media = {
        url: m.url ?? null,
        mimetype: m.mimetype ?? null,
        fileSize: m.fileLength ? Number(m.fileLength) : null,
        filename: m.fileName ?? null,
        title: m.title ?? null,
        mediaKey: m.mediaKey ? Buffer.from(m.mediaKey).toString("base64") : null,
        directPath: m.directPath ?? null,
      };
      break;
    case "locationMessage":
    case "liveLocationMessage":
      location = {
        latitude: m.degreesLatitude ?? null,
        longitude: m.degreesLongitude ?? null,
        name: m.name ?? null,
        address: m.address ?? null,
        isLive: msgType === "liveLocationMessage",
      };
      break;
    case "contactMessage":
      contact = {
        displayName: m.displayName ?? null,
        vcard: m.vcard ?? null,
      };
      break;
    case "contactsArrayMessage":
      contact = {
        contacts: (m.contacts as { displayName?: string; vcard?: string }[] | undefined)?.map((c) => ({
          displayName: c.displayName ?? null,
          vcard: c.vcard ?? null,
        })) ?? [],
      };
      break;
  }

  return {
    from: key.remoteJid,
    fromMe: key.fromMe,
    id: key.id,
    timestamp,
    type: msgType,
    text,
    ...(media && { media }),
    ...(location && { location }),
    ...(contact && { contact }),
  };
}

type Listener = (data: { event: string; [key: string]: unknown }) => void;
export type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface WaStats {
  sent: number;
  received: number;
  startTime: number;
}

// How long without a heartbeat before another instance may take over (1.5× interval).
const HEARTBEAT_INTERVAL_MS = 30_000;
export const HEARTBEAT_STALE_MS = 45_000;

export class WhatsAppClient {
  numberId: string;
  authDirRelative: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sock: any = null;
  status: ConnectionStatus = "disconnected";
  qrDataUrl: string | null = null;
  user: { id: string; name: string } | null = null;
  stats: WaStats = { sent: 0, received: 0, startTime: Date.now() };
  webhookUrl: string | null = null;
  listeners: Set<Listener> = new Set();
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  /** Debounce timer — delays emitting "disconnected" to UI to hide brief Baileys reconnects */
  private _disconnectDebounce: ReturnType<typeof setTimeout> | null = null;

  constructor(
    numberId: string,
    authDirRelative: string,
    webhookUrl?: string | null
  ) {
    this.numberId = numberId;
    this.authDirRelative = authDirRelative;
    this.webhookUrl = webhookUrl ?? null;
  }

  emit(event: string, data: Record<string, unknown> = {}) {
    const payload = { event, ...data };
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch {
        // ignore
      }
    });
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
  }

  unsubscribe(fn: Listener) {
    this.listeners.delete(fn);
  }

  /** Start periodic heartbeat so other Lambda instances know this one is alive. */
  private _startHeartbeat(): void {
    this._stopHeartbeat();
    const tick = async () => {
      if (this.status !== "connected" || this.numberId === "legacy") return;
      try {
        const { db } = await import("./db");
        await db.waNumber.update({
          where: { id: this.numberId },
          data: { connectionActiveAt: new Date() },
        });
      } catch { /* non-fatal */ }
    };
    void tick(); // immediate first write
    this._heartbeatTimer = setInterval(tick, HEARTBEAT_INTERVAL_MS);
  }

  /** Stop heartbeat and clear the DB flag so other instances can take over. */
  private _stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    if (this.numberId === "legacy") return;
    import("./db")
      .then(({ db }) =>
        db.waNumber.update({
          where: { id: this.numberId },
          data: { connectionActiveAt: null },
        })
      )
      .catch(() => {});
  }

  /** Persist auth files to DB so any Lambda instance can restore the session. */
  private async _backupAuthStateToDb(): Promise<void> {
    if (this.numberId === "legacy") return;
    try {
      const authPath = getAuthPath(this.authDirRelative);
      if (!fs.existsSync(authPath)) return;
      const files = fs.readdirSync(authPath).filter((f) => f.endsWith(".json"));
      if (files.length === 0) return;
      const authData: Record<string, string> = {};
      for (const file of files) {
        try {
          authData[file] = fs.readFileSync(path.join(authPath, file), "utf-8");
        } catch { /* skip */ }
      }
      const { db } = await import("./db");
      await db.waNumber.update({
        where: { id: this.numberId },
        data: { authState: authData },
      });
    } catch {
      // non-fatal — backup failure must not break the connection
    }
  }

  async connect() {
    if (this.status === "connecting" || this.status === "connected") return;
    this.status = "connecting";
    this.emit("status", { status: "connecting" });

    const logger = pino({ level: "silent" });
    const authPath = getAuthPath(this.authDirRelative);
    fs.mkdirSync(authPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
      logger,
      browser: ["WA Dashboard", "Chrome", "1.0.0"],
    });

    this.sock = sock;
    sock.ev.on("creds.update", async () => {
      await saveCreds();
      void this._backupAuthStateToDb();
    });

    sock.ev.on(
      "connection.update",
      async (update: {
        connection?: string;
        lastDisconnect?: { error?: unknown };
        qr?: string;
      }) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, {
              width: 300,
              margin: 2,
              color: { dark: "#000000", light: "#ffffff" },
            });
            this.emit("qr", { qr: this.qrDataUrl });
          } catch (err) {
            console.error("QR generation error:", err);
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output
            ?.statusCode;
          const shouldReconnect =
            statusCode !== DisconnectReason.loggedOut &&
            statusCode !== DisconnectReason.forbidden;

          this._stopHeartbeat();
          this.status = "disconnected";
          this.qrDataUrl = null;
          this.user = null;
          this.sock = null;

          if (shouldReconnect) {
            // Brief disconnect during auto-reconnect — delay the UI update by 6s.
            // If connection comes back within 6s, the UI never sees "disconnected".
            this._disconnectDebounce = setTimeout(() => {
              this._disconnectDebounce = null;
              if (this.status === "disconnected") {
                this.emit("status", { status: "disconnected" });
              }
            }, 6000);
            setTimeout(() => this.connect(), 3000);
          } else {
            // Permanent disconnect (loggedOut / forbidden) — notify UI immediately.
            if (this._disconnectDebounce) {
              clearTimeout(this._disconnectDebounce);
              this._disconnectDebounce = null;
            }
            this.emit("status", { status: "disconnected" });
          }
        }

        if (connection === "open") {
          // Cancel any pending "disconnected" UI notification — reconnect succeeded.
          if (this._disconnectDebounce) {
            clearTimeout(this._disconnectDebounce);
            this._disconnectDebounce = null;
          }
          this._startHeartbeat();
          this.status = "connected";
          this.qrDataUrl = null;
          const me = sock.user;
          this.user = me ? { id: me.id, name: me.name ?? me.id } : null;

          // Persist phone number to DB
          if (this.user && this.numberId !== "legacy") {
            try {
              const { db } = await import("./db");
              const phoneNumber =
                this.user.id.split(":")[0]?.split("@")[0] ?? null;
              await db.waNumber.update({
                where: { id: this.numberId },
                data: { phoneNumber },
              });
            } catch {
              // non-fatal
            }
          }

          this.emit("connected", { user: this.user });
          this.emit("status", { status: "connected", user: this.user });
        }
      }
    );

    sock.ev.on(
      "messages.upsert",
      async ({ messages, type }: { messages: unknown[]; type: string }) => {
        if (type !== "notify") return;
        for (const msg of messages as {
          message?: unknown;
          key: {
            remoteJid?: string | null;
            fromMe?: boolean;
            id?: string;
          };
          messageTimestamp?: unknown;
        }[]) {
          if (!msg.message) continue;
          if (isJidBroadcast(msg.key.remoteJid ?? "")) continue;

          this.stats.received++;

          const msgObj = msg.message as Record<string, unknown>;
          const msgType = Object.keys(msgObj)[0];
          const payload = extractMessagePayload(msg.key, msg.messageTimestamp, msgType, msgObj);

          this.emit("message", { message: payload });
          this.emit("stats", { stats: this.stats });

          if (this.webhookUrl) {
            this._sendWebhook(payload).catch(() => {});
          }

          // Save to MessageLog only for JVTO customers (non-Indonesian, non-group)
          const remoteJid = msg.key.remoteJid ?? "";

          // Resolve @lid to real phone via Baileys key.remoteJidAlt
          let resolvedPhone: string | null = null;
          if (remoteJid.includes("@lid")) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const remoteJidAlt = (msg.key as any).remoteJidAlt ?? null;
            if (remoteJidAlt && !remoteJidAlt.includes("@lid")) {
              const altPhone = normalizePhone(remoteJidAlt);
              if (isJvtoPhone(altPhone)) {
                resolvedPhone = altPhone;
              }
            }
          } else if (isJvtoPhone(remoteJid)) {
            resolvedPhone = normalizePhone(remoteJid);
          }

          if (resolvedPhone && this.numberId !== "legacy") {
            const textContent = (payload.text as string | null) ?? null;
            const mediaData = (payload.media ?? payload.location ?? payload.contact) as Record<string, unknown> | null ?? null;
            const mediaKind = payload.media
              ? msgType
              : payload.location
              ? msgType
              : payload.contact
              ? msgType
              : null;

            import("./db").then(({ db }) =>
              db.messageLog.create({
                data: {
                  numberId: this.numberId,
                  direction: msg.key.fromMe ? "OUT" : "IN",
                  toFrom: resolvedPhone!,
                  content: textContent,
                  mediaType: mediaKind,
                  mediaData: mediaData ?? undefined,
                },
              })
            ).catch(() => {});
          }
        }
      }
    );
  }

  private async _sendWebhook(payload: unknown) {
    if (!this.webhookUrl) return;
    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "message", data: payload }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // silently fail
    }
  }

  async disconnect() {
    this._stopHeartbeat();
    if (this.sock) {
      await this.sock.logout().catch(() => {});
      this.sock = null;
    }
    this.status = "disconnected";
    this.qrDataUrl = null;
    this.user = null;

    // Remove auth files
    const authPath = getAuthPath(this.authDirRelative);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }

    // Clear phone number in DB
    if (this.numberId !== "legacy") {
      try {
        const { db } = await import("./db");
        await db.waNumber.update({
          where: { id: this.numberId },
          data: { phoneNumber: null },
        });
      } catch {
        // non-fatal
      }
    }

    this.emit("status", { status: "disconnected" });
  }

  async sendText(to: string, text: string) {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp is not connected");
    }
    const jid = this._normalizeJid(to);
    await this.sock.sendMessage(jid, { text });
    this.stats.sent++;
    this.emit("stats", { stats: this.stats });
    return { success: true, to: jid };
  }

  async sendMedia(
    to: string,
    url: string,
    mediaType: "image" | "video" | "document",
    caption?: string,
    filename?: string
  ) {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp is not connected");
    }
    const jid = this._normalizeJid(to);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let content: any;
    if (mediaType === "image") {
      content = { image: { url }, caption: caption ?? "" };
    } else if (mediaType === "video") {
      content = { video: { url }, caption: caption ?? "" };
    } else {
      content = {
        document: { url },
        mimetype: "application/octet-stream",
        fileName: filename ?? "document",
        caption: caption ?? "",
      };
    }

    await this.sock.sendMessage(jid, content);
    this.stats.sent++;
    this.emit("stats", { stats: this.stats });
    return { success: true, to: jid };
  }

  async isOnWhatsApp(phoneNo: string): Promise<boolean> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp is not connected");
    }
    const cleaned = phoneNo.replace(/[^0-9]/g, "");
    const results = await this.sock.onWhatsApp(cleaned);
    return results?.[0]?.exists ?? false;
  }

  async getGroups(): Promise<{ id: string; name: string; participantCount: number; description: string | null }[]> {
    if (!this.sock || this.status !== "connected") {
      throw new Error("WhatsApp is not connected");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = await (this.sock as any).groupFetchAllParticipating() as Record<string, any>;
    return Object.values(groups).map((g) => ({
      id: g.id as string,
      name: (g.subject as string) ?? g.id,
      participantCount: (g.participants as unknown[])?.length ?? 0,
      description: (g.desc as string) ?? null,
    }));
  }

  private _normalizeJid(to: string): string {
    // Already a full JID (group @g.us or contact @s.whatsapp.net)
    if (to.includes("@")) return to;
    // Plain phone number → personal JID
    const cleaned = to.replace(/[^0-9]/g, "");
    return `${cleaned}@s.whatsapp.net`;
  }

  getStatus() {
    return {
      status: this.status,
      user: this.user,
      stats: this.stats,
      uptime: Math.floor((Date.now() - this.stats.startTime) / 1000),
      webhookUrl: this.webhookUrl,
      hasQr: !!this.qrDataUrl,
      qr: this.qrDataUrl,
    };
  }
}

// ─── Multi-instance manager ────────────────────────────────────────────────

/**
 * Timestamp of when this process (module) was first loaded.
 * Any heartbeat written BEFORE this time belongs to a now-dead previous
 * process (e.g., the process PM2 just killed). We treat those as stale and
 * allow this fresh process to take over the connection immediately.
 */
const PROCESS_START_TIME = Date.now();

const waClients: Map<string, WhatsAppClient> =
  global.__waClients ?? (global.__waClients = new Map());

/**
 * Get or create a WA client for the given numberId.
 * On first creation, loads the number from DB and auto-reconnects if auth
 * files already exist (e.g., after a server restart).
 */
export async function getOrCreateWaClient(
  numberId: string
): Promise<WhatsAppClient> {
  if (waClients.has(numberId)) return waClients.get(numberId)!;

  const { db } = await import("./db");
  const number = await db.waNumber.findUnique({ where: { id: numberId } });
  if (!number) throw new Error("WA number not found");

  const client = new WhatsAppClient(
    numberId,
    number.authDir,
    number.webhookUrl
  );
  waClients.set(numberId, client);

  const authPath = getAuthPath(number.authDir);

  // Check if auth files already existed BEFORE any DB restore.
  // Only auto-connect from pre-existing local files (e.g. same process restart).
  const hadLocalAuth =
    fs.existsSync(authPath) &&
    fs.readdirSync(authPath).some((f) => f.endsWith(".json"));

  if (!hadLocalAuth && number.authState) {
    // Cold Lambda: restore from DB so the files are ready for when SSE or
    // /connect explicitly triggers connect(). Do NOT connect here — doing so
    // would create a competing Baileys socket against another warm Lambda.
    try {
      fs.mkdirSync(authPath, { recursive: true });
      const stored = number.authState as Record<string, string>;
      for (const [filename, content] of Object.entries(stored)) {
        if (filename.endsWith(".json")) {
          fs.writeFileSync(path.join(authPath, filename), content, "utf-8");
        }
      }
    } catch {
      // non-fatal
    }
  }

  // Auto-connect only from pre-existing local files AND only if no other
  // instance is actively holding the connection (heartbeat check).
  // IMPORTANT: A heartbeat written BEFORE this process started belongs to the
  // previous (now-dead) process — treat it as stale so we reconnect immediately
  // instead of waiting 45 s for it to expire. This fixes the "always disconnects
  // after build/pm2 restart" issue where the old process's heartbeat looks fresh
  // but the process is already dead.
  const STALE_MS = HEARTBEAT_STALE_MS;
  const heartbeatTime = number.connectionActiveAt
    ? new Date(number.connectionActiveAt).getTime()
    : 0;
  const isActiveElsewhere =
    heartbeatTime > PROCESS_START_TIME && // written after THIS process started → another live instance
    Date.now() - heartbeatTime < STALE_MS;

  if (hadLocalAuth && !isActiveElsewhere) {
    client.connect().catch(console.error);
  }

  return client;
}

export function getWaClient(numberId: string): WhatsAppClient | null {
  return waClients.get(numberId) ?? null;
}

export function removeWaClient(numberId: string): void {
  waClients.delete(numberId);
}

/**
 * WatZap-compatible auth: validates api_key (User) + number_key (WaNumber)
 * and ensures the number belongs to the user.
 */
export async function getClientByKeys(apiKey: string, numberKey: string) {
  const { db } = await import("./db");

  // Validate api_key → find User
  const user = await db.user.findUnique({ where: { apiKey } });
  if (!user) return null;

  // Validate number_key → find WaNumber owned by that user
  const number = await db.waNumber.findUnique({
    where: { apiKey: numberKey },
    select: {
      id: true, userId: true, apiKey: true, label: true,
      phoneNumber: true, webhookUrl: true,
    },
  });
  if (!number || number.userId !== user.id) return null;

  const client = await getOrCreateWaClient(number.id);
  return { client, number, user };
}

/**
 * Find a WA client by its API key (for v1 external API calls).
 * Returns both the client and the WaNumber record.
 */
export async function getClientByApiKey(apiKey: string) {
  const { db } = await import("./db");
  const number = await db.waNumber.findUnique({ where: { apiKey } });
  if (!number) return null;

  const client = await getOrCreateWaClient(number.id);
  return { client, number };
}

/**
 * Wait up to `timeoutMs` for a client to reach "connected" status.
 * Returns true if connected, false if still disconnected or timed out.
 * Useful on cold Lambdas where getOrCreateWaClient kicks off a reconnect
 * from the DB-backed auth state but the socket isn't open yet.
 */
export function waitForConnected(
  client: WhatsAppClient,
  timeoutMs = 15_000
): Promise<boolean> {
  if (client.status === "connected") return Promise.resolve(true);
  if (client.status === "disconnected") return Promise.resolve(false);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      client.unsubscribe(listener);
      resolve(false);
    }, timeoutMs);

    const listener = (data: Record<string, unknown>) => {
      if (data.event !== "status") return;
      if (data.status === "connected") {
        clearTimeout(timer);
        client.unsubscribe(listener);
        resolve(true);
      } else if (data.status === "disconnected") {
        clearTimeout(timer);
        client.unsubscribe(listener);
        resolve(false);
      }
    };

    client.subscribe(listener);
  });
}
