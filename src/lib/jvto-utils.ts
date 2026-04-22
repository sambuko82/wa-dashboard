/**
 * Returns true if the phone number/JID belongs to a JVTO customer
 * (i.e. non-Indonesian, non-group).
 *
 * Skip rules:
 *  - WhatsApp groups  (@g.us)
 *  - Indonesian numbers: 62xxx / +62xxx / 08xxx
 */
export function isJvtoPhone(phoneOrJid: string): boolean {
  if (phoneOrJid.includes("@g.us")) return false;

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
