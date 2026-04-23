/**
 * Phone numbers explicitly whitelisted regardless of country code.
 * Stored without + prefix.
 */
const WHITELISTED_PHONES = new Set([
  "6282143403501", // owner test number
]);

/**
 * Returns true if the phone number/JID belongs to a JVTO customer
 * (i.e. non-Indonesian, non-group, non-LID).
 *
 * Skip rules:
 *  - WhatsApp groups  (@g.us)
 *  - LID format       (@lid) — random internal Meta ID, not a real phone number
 *  - Indonesian numbers: 62xxx / +62xxx / 08xxx
 *    (unless in WHITELISTED_PHONES)
 */
export function isJvtoPhone(phoneOrJid: string): boolean {
  if (phoneOrJid.includes("@g.us")) return false;
  if (phoneOrJid.includes("@lid")) return false;

  // Strip everything after @ and leading +
  const phone = phoneOrJid.split("@")[0].replace(/^\+/, "");

  // Whitelist overrides country-code filter
  if (WHITELISTED_PHONES.has(phone)) return true;

  if (phone.startsWith("62")) return false;
  if (phone.startsWith("08")) return false;

  return true;
}

/** Normalize JID / phone to a plain phone number string (digits only, no + no @). */
export function normalizePhone(phoneOrJid: string): string {
  return phoneOrJid.split("@")[0].replace(/^\+/, "").trim();
}
