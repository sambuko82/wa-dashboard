---
name: project-jvto-reply-rules
description: "JVTO operational sub-rules for customer replies — URL/UTM, Payment policy, Crew privacy, Weather guarantees, Vehicle/luggage, Complaint handling, Tumpak Sewu/Madakaripura, Split Group"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5d155bae-90d4-48c3-9fe1-1f8dc7ccb324
---

Operational sub-rules for JVTO customer replies. Apply alongside discipline gate in [[feedback-jvto-reply-discipline]].

**Why:** Locked 2026-05-22 to prevent inventing URLs/policy/specs and to standardize sensitive-topic phrasing.

**How to apply:** When draft touches one of these topics, use the locked phrasing/logic below. Do not paraphrase the policy statements.

### URL Verification

Only use URLs from:
1. Operator-provided URL in the prompt.
2. Verified package list at `D:\wa-dashboard\compiled\jvto-context\packages.index.json`.
3. Previously confirmed JVTO URL in the same conversation.

Never invent. If unsure → drop the URL, don't guess.

### UTM Tagging

- WhatsApp: append `?utm_source=whatsapp`
- Email: append `?utm_source=email`
- If URL already has query params: use `&utm_source=whatsapp`

### Payment Policy (locked wording)

> A 20% deposit is required to secure the booking.
> The remaining balance can be paid closer to the trip:
> - By card
> - By bank transfer / Wise
> - By cash upon arrival, if approved

Deadlines:
> - Card payment: no later than 5 days before Day 1
> - Bank transfer / Wise: no later than 3 days before Day 1

Never say "book first without payment" unless operator explicitly allows.

### Crew Contact Privacy

If customer asks for guide/driver phone:
> For customer privacy and data protection, we do not share personal contact numbers directly.
>
> You can use the "Contact Crew" live message feature in your booking portal from H-1 before departure. This allows direct communication with your assigned crew without exchanging personal phone numbers.

### Weather / Blue Fire / Sunrise

Never guarantee blue fire, sunrise, weather, volcano access, or traffic timing.

Default:
> Blue Fire cannot be guaranteed, as it depends on natural conditions and local authority regulations.

If operator context confirms current closure:
> Based on the latest update, Blue Fire access is currently closed by the authorities. We hope it may reopen by your travel date, but we cannot guarantee it.

### Vehicle / Luggage

For 4 pax + lots of luggage:
> For 4 passengers, APV luggage space is limited and usually fits only around 1 large suitcase comfortably.
>
> Toyota Hiace is recommended if you bring several suitcases, as it provides more luggage space and comfort for long transfers.

Vehicle allocation per package: see `packages.index.json` → `vehicle_allocation` field.

### Sensitive Complaint Structure

1. Acknowledge → 2. Apologize → 3. Explain briefly → 4. Offer current solution → 5. Do not over-defend.

Template:
> We understand your concern, and we sincerely apologize for the inconvenience.
>
> At the time, the situation was still wait-and-see while we followed updates from the local operator/authority.
>
> Based on the latest update, [SOLUTION].
>
> Safety remains our priority, so if conditions are unsafe, we will follow the local authority's guidance.

### Tumpak Sewu Rule

Never insert Tumpak Sewu into a standard 3D2N Bromo + Ijen package. It needs a separate 4D3N route.

Wording:
> Tumpak Sewu requires a different route and extra travel time, so it belongs to a separate 4D3N package.

### Madakaripura vs Tumpak Sewu

Not interchangeable. Different route, different overnight, different cost, different package. Explain when relevant.

### Split Group Rule

If some guests want Bromo only and others continue to Ijen:
- Recommend SEPARATE bookings.
- Fairer because Bromo-only pays the cheaper package.
- Align Bromo sunrise date if needed.

### Source of truth

Full skill spec: `D:\wa-dashboard\Raw\JVTO_Verified_Customer_Reply_Skill.md` (Enhanced Version, 2026-05-22).
Discipline gate: [[feedback-jvto-reply-discipline]].
Architecture: [[project-knowledge-engine]].
