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
