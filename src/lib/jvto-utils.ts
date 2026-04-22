/**
 * Returns true if the phone number/JID belongs to a JVTO customer
 * (i.e. non-Indonesian, non-group, non-LID).
 *
 * Skip rules:
 *  - WhatsApp groups  (@g.us)
 *  - LID format       (@lid) — random internal Meta ID, not a real phone number
 *  - Indonesian numbers: 62xxx / +62xxx / 08xxx
 */
export function isJvtoPhone(phoneOrJid: string): boolean {
  if (phoneOrJid.includes("@g.us")) return false;
  if (phoneOrJid.includes("@lid")) return false; // WhatsApp LID — cannot resolve to phone

  // Strip everything after @ and leading +
  const phone = phoneOrJid.split("@")[0].replace(/^\+/, "");

  if (phone.startsWith("62")) return false;
  if (phone.startsWith("08")) return false;

  return true;
}

/** Normalize JID / phone to a plain phone number string (no + no @). */
export function normalizePhone(phoneOrJid: string): string {
  return phoneOrJid.split("@")[0].replace(/^\+/, "");
}
