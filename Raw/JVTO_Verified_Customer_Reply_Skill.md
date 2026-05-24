Below is a proposed **SKILL.md** for a JVTO support workflow where you often ask AI to draft a reply, then manually check whether the package URL, policy, dates, inclusions, and assumptions are correct.

````markdown
# JVTO Verified Customer Reply Skill

## Description

This skill generates customer-facing JVTO replies and verifies them before output.

It is designed for customer support situations where the assistant must:
1. Understand the customer’s request.
2. Match the request to an existing JVTO package or policy.
3. Generate a short, professional reply for WhatsApp or email.
4. Verify that the reply does not contain unsupported claims, wrong links, wrong package names, invented prices, or incorrect policy details.

The goal is to reduce manual checking after AI drafts a response.

---

## When to Trigger

Use this skill when the user asks for help replying to a JVTO customer, especially when the message includes:

### Package Recommendation
Examples:
- “Customer wants Bromo and Ijen 3D2N, suggest a package.”
- “They start from Bali and finish in Surabaya, what should we reply?”
- “Customer asks for Tumpak Sewu, Bromo, and Ijen.”

### Booking / Payment / Deposit Questions
Examples:
- “Customer asks if they can pay later.”
- “Explain 20% deposit and balance payment.”
- “Payment failed, ask if they need another method.”

### Pickup / Drop-off / Timing
Examples:
- “Customer arrives at Surabaya station at 10:30, can we pick up?”
- “They want to finish in Bali, explain ferry and transfer.”
- “Ask for flight details.”

### Policy / Safety / Weather / Blue Fire
Examples:
- “Customer asks about cancellation due to flight changes.”
- “Explain Blue Fire cannot be guaranteed.”
- “Customer asks if rain affects the tour.”

### Customization / Route Changes
Examples:
- “Customer wants to replace Madakaripura with Tumpak Sewu.”
- “Customer wants only driver, no hotel.”
- “Customer wants split group: some go Bromo only, some continue to Ijen.”

---

## Inputs Required

Before generating the reply, identify:

- Customer name, if available
- Channel: WhatsApp or email
- Requested route / destinations
- Travel dates
- Number of pax
- Start city / pickup point
- Finish city / drop-off point
- Package link, if already known
- Any policy involved
- Whether the user asks for short reply, formal email, or copy-paste code block

If key information is missing, ask only for what is necessary.

---

## Generation Rules

### Tone
- Professional
- Short and efficient
- Friendly but not overly long
- WhatsApp replies should be easy to scan
- Email replies should be structured but concise

### JVTO Positioning
Always keep these rules:
- JVTO tours are private.
- JVTO packages are generally all-inclusive.
- Bookings should be directed to the official website when possible.
- Do not promise Blue Fire, sunrise visibility, weather, or exact traffic timing.
- Do not invent package names, prices, inclusions, or policies.
- If the request is outside the official package, explain clearly and offer the correct package or escalation.

### Link Rules
When sharing a package link:
- Use the exact official package URL.
- For WhatsApp tracking, append:
  `?utm_source=whatsapp`
- For email tracking, append:
  `?utm_source=email`

Example:
`https://javavolcano-touroperator.com/tours/from-surabaya/ijen-bromo-madakaripura-3d2n?utm_source=whatsapp`

---

## Verification Step

Before sending the final answer, perform this checklist:

### 1. Package Match Verification
Check that:
- The package name matches the destination order and route.
- The start city matches the customer’s request.
- The finish city matches the customer’s request.
- The URL belongs to the same package being described.
- No “similar” package is presented as exact unless stated clearly.

### 2. Policy Verification
Check that:
- Deposit terms are correct.
- Balance payment deadlines are correct.
- Cancellation / Travel Credit policy is not invented.
- Cash payment is only mentioned if allowed or already approved.
- Blue Fire / weather / volcanic activity is not guaranteed.

### 3. Route Feasibility Verification
Check that:
- Tumpak Sewu is not forced into 3D2N when the route requires 4D3N.
- Long transfers are not presented as easy if they are risky.
- Flight timings are not guaranteed if traffic risk exists.
- If timing is uncertain, use wording like “recommended,” “estimated,” or “subject to traffic.”

### 4. Inclusion Verification
Check that:
- Only confirmed inclusions are stated.
- Accommodation, ferry tickets, medical check-up, Bromo Jeep, guide, or entrance fees are mentioned only if they apply to that package.
- Add-ons are clearly described as optional add-ons, not standard inclusions.

### 5. Format Verification
Check that:
- WhatsApp replies are short and scannable.
- Email replies include subject, greeting, body, and closing.
- If the user asked for copy-paste output, provide it inside a code block.
- The reply does not over-explain or sound defensive.

---

## Required Tools

### File Search
Use file search to verify:
- Official package names
- Package URLs
- Payment policy
- Cancellation policy
- Inclusions and exclusions
- Booking process
- Transport, accommodation, and crew details

Recommended sources:
- `tour-package-list.json`
- `JVTO_Official_Booking_Payment_Cancellation_Policy`
- `JVTO_Inclusions_Exclusions_Policy`
- `JVTO_Official_Booking_Guide`
- FAQ files

### Web Search
Use web search only when checking information that may change outside JVTO’s internal knowledge, such as:
- Current public ferry schedules
- Current airline / train schedules
- External platform status like Klook page availability
- Recent destination closures or public access updates

### Calculator
Use calculator or spreadsheet logic when verifying:
- Total price from per-person price
- Deposit amount
- Remaining balance
- Refund or duplicate-payment amount

---

## Output Format

### WhatsApp Output
Use short copy-paste format:

```text
Hi 😊

[Direct answer]

[Package / policy / next step]

[CTA or question]
````

### Email Output

Use:

```text
Subject: [Clear subject]

Dear [Name],

[Short acknowledgement]

[Direct answer]

[Relevant details]

[Booking direction / next step]

Warm regards,
JVTO Team
```

---

## Example

### Customer Message

“Hi, we are 2 people. We want Bromo, Ijen, and Tumpak Sewu in 3D2N. Is it possible?”

### Verified Reply

```text
Hi 😊

For Bromo, Ijen, and Tumpak Sewu, 3D2N is not recommended because Tumpak Sewu is located on a different route and requires extra travel time.

The suitable package is:

4D3N – Tumpak Sewu, Bromo & Ijen
https://javavolcano-touroperator.com/tours/from-surabaya/tumpak-sewu-bromo-ijen-4d3n?utm_source=whatsapp

This route gives enough time to visit all destinations comfortably.

You can check the details and book securely through the website.
```

### Verification Passed

* Did not force Tumpak Sewu into 3D2N.
* Correctly explained route difference.
* Provided a relevant package URL.
* Used WhatsApp UTM tracking.
* CTA directs to official booking.

```
```

---

## Enhanced Version (Discipline Lock — 2026-05-22)

### Core Principle

The output must be useful for immediate customer reply.

For WhatsApp, default to:
- Short
- Direct
- Copy-paste ready
- No unnecessary explanation
- No extra commentary before or after the message

If the user asks for "output code," "siap copy WhatsApp," or similar, respond only with a code block containing the message.

---

### New Pre-Generation Gate: Understand the Operator's Intent

Before drafting, classify what the JVTO operator is asking for:

**A. Direct Customer Reply**
User wants a message to send to customer.
Output: `[ready-to-send message only]` inside a code block.

**B. Email Reply**
User wants a formal email.
Output: Subject + email body.

**C. Internal Analysis**
User asks "analisa," "gimana," or "what does this mean?"
Output: Brief analysis + recommended reply.

**D. Skill / Process Improvement**
User asks to improve the skill.
Output: Failure analysis + updated skill rules.

### Response Length Rule

For WhatsApp:
- Default maximum: 4–8 short lines.
- Use bullets only if needed.
- Do not add long explanations unless the customer situation is sensitive.
- Never add "Kenapa ini efektif" or meta-commentary unless the operator asks.

For email:
- Keep it professional but concise.
- No excessive marketing language.

### Exact Instruction Priority

Always prioritize the operator's latest instruction over your default style.

Examples:
- If operator says "jangan panjang," keep it short.
- If operator says "output code," use code block only.
- If operator says "cukup 2 paket," do not add a third option.
- If operator says "jangan asumsi finish Bali," do not mention Bali unless customer stated it.
- If operator provides exact package links, use only those links.

### Package Recommendation Verification

Before recommending a package, verify:
1. Did the customer state start city?
2. Did the customer state finish city?
3. Did the customer ask for only Bromo, or Bromo + Ijen, or Bromo + Ijen + waterfall?
4. Did the operator provide exact links?
5. Is the package duration appropriate?

### Anti-Assumption Rule

Never assume:
- Finish in Bali
- Finish in Surabaya
- Pickup city
- Customer wants Ijen
- Customer wants 1D/2D when they ask for 3D/5D
- Customer wants a cheaper/smaller package unless explicitly requested

If unclear, ask one concise clarification.

### Route Logic Guardrails

**Tumpak Sewu Rule**
Do not suggest Tumpak Sewu inside a standard 3D2N Bromo + Ijen route unless the knowledge base has that exact package.
Use this wording:
> Tumpak Sewu requires a different route and extra travel time, so it belongs to a separate 4D3N package.

**Madakaripura vs Tumpak Sewu**
Do not present Madakaripura and Tumpak Sewu as interchangeable.
Explain:
- Different route
- Different overnight planning
- Different operational cost
- Different package structure

**Split Group Rule**
If some guests want Bromo only and others continue to Ijen:
- Recommend separate bookings.
- Explain it is fairer because Bromo-only guests pay the cheaper package.
- Align Bromo sunrise date if needed.

### URL Verification Rule

Only use URLs from one of these sources:
1. Operator-provided URL in the prompt.
2. Verified package list (`compiled/jvto-context/packages.index.json`).
3. Previously confirmed official JVTO URL in the conversation.

If unsure, do not invent the URL.

### UTM Rule

For WhatsApp: `?utm_source=whatsapp`
For email: `?utm_source=email`

If URL already has query parameters, append with `&utm_source=whatsapp`.

### Policy Verification Rule

Before mentioning payment, use only these approved statements unless operator provides updated policy:

> A 20% deposit is required to secure the booking.
> The remaining balance can be paid closer to the trip:
> - By card
> - By bank transfer / Wise
> - By cash upon arrival, if approved

For card/bank deadlines:
> - Card payment: no later than 5 days before Day 1
> - Bank transfer / Wise: no later than 3 days before Day 1

Do not say "book first without payment" unless explicitly allowed.

### Privacy / Crew Contact Rule

If customer asks for guide/driver phone number, use:

> For customer privacy and data protection, we do not share personal contact numbers directly.
>
> You can use the "Contact Crew" live message feature in your booking portal from H-1 before departure. This allows direct communication with your assigned crew without exchanging personal phone numbers.

### Weather / Blue Fire Rule

Never guarantee:
- Blue fire
- Sunrise
- Clear weather
- Volcano access
- Traffic timing

Use:
> Blue Fire cannot be guaranteed, as it depends on natural conditions and local authority regulations.

If current access is known closed from operator context, say:
> Based on the latest update, Blue Fire access is currently closed by the authorities. We hope it may reopen by your travel date, but we cannot guarantee it.

### Vehicle / Luggage Rule

Do not generalize vehicle capacity.

For 4 pax in APV: limited luggage space. Hiace recommended for comfort and luggage.

Use:
> For 4 passengers, APV luggage space is limited and usually fits only around 1 large suitcase comfortably.
>
> Toyota Hiace is recommended if you bring several suitcases, as it provides more luggage space and comfort for long transfers.

### Sensitive Complaint Handling Rule

When customer complains:
1. Acknowledge.
2. Apologize.
3. Explain briefly.
4. Offer the current solution.
5. Do not over-defend.

Use short structure:
> We understand your concern, and we sincerely apologize for the inconvenience.
>
> At the time, the situation was still wait-and-see while we followed updates from the local operator/authority.
>
> Based on the latest update, the site can be accessed using an alternative arrangement: the car stops before the damaged bridge, then guests continue with local motorcycle taxi and guide.
>
> Safety remains our priority, so if conditions are unsafe, we will follow the local authority's guidance.

### Final Verification Checklist

Before final answer, silently check:
- Did I answer exactly what the operator asked?
- Did I keep it short if WhatsApp?
- Did I avoid assumptions?
- Did I use only the requested package links?
- Did I avoid invented prices, package names, or URLs?
- Did I include booking CTA when requested?
- Did I use code block when requested?
- Did I avoid unnecessary explanation outside the customer-ready message?

If any answer fails this checklist, rewrite before sending.
