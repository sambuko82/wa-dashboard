---
name: feedback-jvto-reply-discipline
description: "Hard discipline rules for JVTO customer replies — Pre-Generation Gate, Anti-Assumption Rule, Length defaults, operator override priority"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 5d155bae-90d4-48c3-9fe1-1f8dc7ccb324
---

When drafting JVTO customer replies via `/customer-support:draft-response` (or any future skill), enforce these rules absolutely.

**Why:** Dogfood session 2026-05-22 surfaced 6 repeat failures: over-answering WA replies, assuming finish city ("Bali"), wrong package level, inventing/uncertain URLs, ignoring operator overrides ("output code"/"jangan panjang"/"cukup 2 paket"), explaining too much before the usable reply.

**How to apply:** Before generating ANY JVTO customer-facing draft, run this gate:

### Pre-Generation Gate (classify operator intent)

- **A. Direct Customer Reply** → output ONLY the ready-to-send message (code block if requested)
- **B. Email Reply** → subject + body, professional + concise
- **C. Internal Analysis** → brief analysis + recommended reply
- **D. Skill / Process Improvement** → failure analysis + updated rules

### Length defaults

- **WhatsApp:** max 4–8 short lines. No bullets unless needed. NO meta-commentary ("Why this works", "Internal notes") unless operator asks.
- **Email:** professional, concise, no marketing fluff.

### Operator override priority (highest)

Latest operator instruction beats default style. Examples:
- "jangan panjang" → strip everything non-essential
- "output code" / "siap copy" → code block only, nothing outside
- "cukup 2 paket" → exactly 2, never 3
- "jangan asumsi finish Bali" → do not mention Bali
- "pakai link ini" → use only that link

### Anti-Assumption Rule

Never assume:
- Finish city (Bali / Surabaya / Malang)
- Pickup city
- Customer wants Ijen
- Day count (1D/2D vs 3D/5D — match what they said)
- Cheaper/smaller package unless explicit

If ambiguous → ONE concise clarification question, then stop.

### Final Verification Checklist (silent, before sending)

- Answered exactly what operator asked?
- Short if WhatsApp?
- Zero assumptions?
- Only verified/operator-provided URLs?
- No invented prices/package names/URLs?
- Code block when requested?
- Zero explanation outside the customer-ready message (unless analysis mode)?

If any fail → rewrite.

Related: [[project-jvto-reply-rules]] (sub-rules: URL verification, UTM, Policy, Crew, Weather, Vehicle, Complaint), [[project-knowledge-engine]] (Phase 1 architecture).

Full skill spec: `D:\wa-dashboard\Raw\JVTO_Verified_Customer_Reply_Skill.md` (Enhanced Version section, 2026-05-22).
