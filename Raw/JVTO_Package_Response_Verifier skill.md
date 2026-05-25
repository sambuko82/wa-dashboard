# SKILL.md

## Name

JVTO Package Response Verifier

## Description

This skill generates customer-facing JVTO tour replies and verifies the reply before final output. It is designed for cases where the assistant previously produced a package recommendation, WhatsApp reply, email draft, or itinerary suggestion, and the user then had to manually check whether the package link, route, origin, destinations, duration, exclusions, and operational claims were correct.

The skill must not only write the answer. It must also perform a verification pass against available source data before presenting the final message.

Primary objective:

* Generate a usable customer or partner response.
* Verify that the recommended JVTO package, route, link, destination set, origin, drop-off, hotel logic, and operational notes match the user’s instruction.
* Surface uncertainty clearly instead of inventing package details.

## Core Problem This Skill Solves

The user often asks the assistant to respond to customer inquiries such as:

* “Find a suitable package.”
* “Offer this package.”
* “Cari paket yang dari Bali.”
* “Tambahkan satu opsi lagi.”
* “Tidak usah masukkan Madakaripura karena tidak ada di paket.”
* “Kita tidak memberikan hotel di Banyuwangi, namun di Bondowoso kota.”
* “Tambahkan opsi kalau tamu mau booking sendiri hotel di Licin.”

The manual checking usually happens after the assistant generates an output, because the user still has to verify:

1. Whether the package link actually matches the customer’s requested route.
2. Whether the package starts from the correct origin, such as Surabaya or Bali.
3. Whether the package includes only the destinations the user wants to offer.
4. Whether the assistant accidentally adds destinations that are not in the package.
5. Whether hotel/accommodation statements match JVTO’s actual operation.
6. Whether important caveats are included, such as Ijen access, Blue Fire visibility, health check, or drone policy.
7. Whether the final message is ready to send without further manual correction.

## When to Trigger

Trigger this skill whenever the user asks for any output involving JVTO package recommendations, customer replies, partner emails, or tour option matching.

### Trigger Examples

Use this skill when the user says:

* “Carikan paket yang cocok.”
* “Cari paket yang dari Bali.”
* “Tawarkan paket ini.”
* “Tambahkan juga paket ini.”
* “Buatkan balasan WhatsApp untuk customer ini.”
* “Buatkan email ke customer tentang opsi tour.”
* “Analisa paket yang JVTO tawarkan.”
* “Jangan masukkan Madakaripura karena tidak ada di paket.”
* “Pastikan link dan paketnya benar.”
* “Review back and forth ini agar kesalahan tidak terulang.”
* “Generate jawaban dan sekalian verifikasi.”

Also trigger when the inquiry contains any of these package-related entities:

* Mount Bromo
* Mount Ijen
* Ijen Crater
* Blue Fire
* Tumpak Sewu Waterfall
* Madakaripura Waterfall
* Papuma Beach
* Baluran
* Surabaya
* Malang
* Bali
* Ubud
* Licin
* Bondowoso
* Banyuwangi
* Klook
* JVTO package link

## Do Not Trigger

Do not trigger this skill when:

* The user only asks for grammar correction unrelated to package accuracy.
* The user asks for a general creative rewrite without factual package details.
* The user provides a police/intelligence report format unrelated to JVTO tour package verification.
* The task is purely visual design, image editing, or blueprint generation.

## Required Inputs

Extract these from the user’s message or conversation context:

1. Customer inquiry text.
2. Requested destinations.
3. Starting point.
4. Ending point or drop-off location.
5. Travel date, if available.
6. Pax count, if available.
7. Duration preference, if available.
8. Must-include destinations.
9. Must-exclude destinations.
10. User’s explicit package links, if provided.
11. Operational constraints mentioned by the user.
12. Tone and channel: WhatsApp, email, Klook message, internal note, or website copy.

If critical information is missing, do not invent it. Either:

* Use only the verified package link provided by the user; or
* State that exact pricing or confirmation depends on date, pax, and availability; or
* Ask for the missing detail only if necessary to avoid a wrong answer.

## Source Priority

Use the most reliable available source first.

1. User’s explicit instruction in the current message.
2. User-provided package URL in the current message.
3. JVTO internal SSOT or uploaded package data.
4. JVTO official website package page.
5. Recent conversation context.
6. General knowledge only for non-critical wording.

Never override a current explicit user instruction with older context.

## Verification Workflow

Before producing the final answer, run this verification checklist.

### Step 1 — Parse the Customer Request

Identify:

* Origin.
* Drop-off.
* Destinations requested.
* Travel dates.
* Pax count.
* Pace preference.
* Hotel preference.
* Special constraints, such as drone use, private family trip, avoiding crowds, or scenic route.

Create an internal request map:

```yaml
origin: ""
drop_off: ""
destinations_requested: []
destinations_excluded: []
dates: ""
pax: ""
duration: ""
special_constraints: []
channel: "WhatsApp | Email | Klook | Internal"
```

### Step 2 — Candidate Package Matching

Only recommend packages that pass all mandatory filters:

1. Correct origin category:

   * `/tours/from-surabaya/` for Surabaya-origin packages.
   * `/tours/from-bali/` for Bali-origin packages.

2. Correct destination coverage:

   * Package must include all core destinations requested, unless clearly presented as a partial alternative.
   * Package must not include an unwanted destination unless user approved it.

3. Correct direction:

   * Surabaya to Bali is not the same as Bali to Surabaya.
   * Ubud to Malang requires special handling and may not match standard JVTO packages directly.

4. Correct duration:

   * 3D2N, 4D3N, 5D4N, etc. must match the package link and customer expectation.

5. Correct accommodation logic:

   * Do not state hotel in Banyuwangi or Licin unless verified.
   * If JVTO normally uses Bondowoso city for that route, say so.
   * If the customer wants Licin specifically, offer the option for the customer to book their own hotel and explain that JVTO can adjust/refund the included accommodation only if the user has confirmed this policy.

### Step 3 — Link Verification

For each link included in the final answer, verify:

* The URL is complete.
* The URL path matches the stated origin.
* The slug matches the package described.
* The package title does not contradict the written recommendation.
* The destination list in the reply does not add destinations absent from the URL/package.

Example checks:

```text
URL: /tours/from-bali/ijen-papuma-tumpak-sewu-bromo-4d3n
Origin stated: Bali
Destinations stated: Ijen, Papuma, Tumpak Sewu, Bromo
Duration stated: 4D3N
Status: PASS
```

```text
URL: /tours/from-surabaya/bromo-madakaripura-ijen-3d2n
Origin stated: Surabaya
Destinations stated: Bromo, Madakaripura, Ijen
Duration stated: 3D2N
Hotel claim: Bondowoso city, not Banyuwangi
Status: PASS if accommodation statement is consistent with JVTO instruction
```

### Step 4 — Content Claim Verification

Check every factual claim before final output.

#### Package Claims

* Package name.
* Duration.
* Route direction.
* Included destinations.
* Pickup city.
* Drop-off city.
* Hotel area.
* Private tour or shared tour.
* Multi-speaking guide, if stated.
* Photographer, if stated.
* Klook activity/package ID, if stated.

#### Operational Claims

* Ijen health certificate requirement.
* Ijen first-Friday closure / Ijen Rijik.
* Blue Fire visibility not guaranteed.
* Drone usage subject to local rules, permits, weather, and site authority approval.
* Sunrise visibility depends on weather.
* Travel time depends on road and traffic conditions.

Do not use absolute claims such as “guaranteed,” “always,” or “will definitely” unless directly supported by the source.

### Step 5 — Contradiction Scan

Before finalizing, scan for these common errors:

* Offering a package from Bali when the customer asked from Surabaya.
* Offering a package from Surabaya when the customer starts in Bali.
* Adding Madakaripura when the user said not to include it.
* Mentioning Banyuwangi/Licin hotel when the user said JVTO uses Bondowoso.
* Saying Blue Fire is guaranteed.
* Saying drone flying is allowed without caveat.
* Providing exact price without pax/date/source confirmation.
* Mixing 4D3N and 5D4N package descriptions.
* Giving too many options when the user asked for one specific package.
* Overexplaining internal team/crew when user asked to keep it simple.

### Step 6 — Final Output Format

The final response should contain two parts:

1. **Ready-to-send message**
2. **Verification summary**

For customer-facing output, keep the verification summary separate and clearly marked as internal.

Example:

```markdown
**Ready-to-send WhatsApp reply:**

Hi [Name],

Yes, we have a private tour option that matches your requested destinations: Mount Ijen, Papuma Beach, Tumpak Sewu Waterfall, and Mount Bromo.

Please review the package details here:
https://javavolcano-touroperator.com/tours/from-bali/ijen-papuma-tumpak-sewu-bromo-4d3n

We also have a longer option here:
https://javavolcano-touroperator.com/tours/from-bali/ijen-papuma-tumpak-sewu-bromo-5d4n

If you have any questions after reviewing the package, you can chat with us directly here.

**Internal verification:**
- Origin checked: Bali.
- Destinations checked: Ijen, Papuma, Tumpak Sewu, Bromo.
- Madakaripura excluded: yes.
- Duration options checked: 4D3N and 5D4N.
- No exact price added because pax/date confirmation is not available.
```

## Output Rules

### Must Do

* Follow the user’s latest instruction exactly.
* Use the package link provided by the user when available.
* Keep customer-facing replies concise and ready to send.
* Separate internal verification from customer-facing message.
* Flag uncertainty instead of filling gaps.
* Use “please review the package details in the link” when exact pricing or detail is better handled by the package page.

### Must Not Do

* Do not invent package names.
* Do not invent prices.
* Do not invent inclusions.
* Do not add destinations not found in the selected package.
* Do not change Surabaya-origin packages into Bali-origin packages.
* Do not claim drone permission is guaranteed.
* Do not claim Blue Fire or sunrise is guaranteed.
* Do not over-add internal operational details unless the user asks.

## Verification Pass Template

Use this before final answer:

```markdown
## Verification Pass

### User Instruction Check
- Latest explicit instruction captured: [yes/no]
- Must-use package link: [link]
- Must-exclude destination: [destination/none]
- Required language/tone: [language/tone]

### Package Check
- Origin path verified: [PASS/FAIL]
- Duration verified: [PASS/FAIL]
- Destination list verified: [PASS/FAIL]
- Direction verified: [PASS/FAIL]
- Hotel/accommodation statement verified: [PASS/FAIL/NOT STATED]
- Price claim verified: [PASS/FAIL/NOT STATED]

### Risk Check
- Added unsupported destination: [yes/no]
- Added unsupported price: [yes/no]
- Added unsupported guarantee: [yes/no]
- Operational caveat needed: [yes/no]

### Final Decision
- Safe to send: [yes/no]
- If no, reason: [reason]
```

## Recommended Tools

This skill provides a better output when connected to the following tools or data sources:

### Required / High Priority

1. **JVTO Package SSOT**

   * A structured source containing package title, slug, origin, destination list, duration, pickup, drop-off, accommodation area, price category, inclusions, exclusions, and status.

2. **Website URL Fetcher / Browser Tool**

   * Used to open JVTO package URLs and verify that the visible page matches the response.

3. **Link Checker**

   * Used to confirm that package links are not broken and that the path matches the intended package.

4. **File Search / Internal Document Search**

   * Used when package data, Klook IDs, itinerary docs, or SOPs are stored in uploaded files or internal knowledge files.

5. **Date Calculator**

   * Used to check if the tour date overlaps with known operational constraints, such as Ijen first-Friday closure.

### Useful / Optional

6. **Google Sheets / Database Connector**

   * Useful if JVTO maintains package pricing, room logic, availability, or route mapping in a spreadsheet or database.

7. **Website Crawler / Sitemap Reader**

   * Useful for building or refreshing the package catalog automatically.

8. **Klook Merchant Data Source**

   * Useful for verifying Klook activity IDs, package IDs, confirmation type, and package names.

9. **Weather / Conditions Tool**

   * Useful only when the response discusses visibility, sunrise, trail access, or safety conditions.

10. **Policy / SOP Knowledge Base**

* Useful for verifying drone policy, health certificate requirements, refund handling, accommodation adjustments, and route exceptions.

## Suggested Data Schema for Package Verification

```json
{
  "package_id": "",
  "title": "",
  "url": "",
  "origin": "Surabaya | Bali | Malang | Custom",
  "drop_off": "",
  "duration": "",
  "destinations": [],
  "excluded_destinations": [],
  "route_direction": "",
  "accommodation_area": [],
  "default_hotel_logic": "",
  "inclusions": [],
  "exclusions": [],
  "price_from": null,
  "price_currency": "IDR",
  "status": "active | inactive | draft",
  "last_verified": "YYYY-MM-DD"
}
```

## Example Use Case

### User Input

```text
Customer asks for Ijen, Papuma, Tumpak Sewu, and Bromo from Bali. Offer the 4D3N and 5D4N package. Do not include Madakaripura.
```

### Skill Behavior

1. Parse requested origin: Bali.
2. Parse requested destinations: Ijen, Papuma, Tumpak Sewu, Bromo.
3. Parse excluded destination: Madakaripura.
4. Verify candidate links:

   * `/tours/from-bali/ijen-papuma-tumpak-sewu-bromo-4d3n`
   * `/tours/from-bali/ijen-papuma-tumpak-sewu-bromo-5d4n`
5. Generate WhatsApp reply.
6. Add internal verification summary.

### Expected Output

```markdown
Hi, thank you for your message.

Yes, we have private tour options from Bali that include Mount Ijen, Papuma Beach, Tumpak Sewu Waterfall, and Mount Bromo.

Please review the package details here:

4D3N option:
https://javavolcano-touroperator.com/tours/from-bali/ijen-papuma-tumpak-sewu-bromo-4d3n

5D4N option:
https://javavolcano-touroperator.com/tours/from-bali/ijen-papuma-tumpak-sewu-bromo-5d4n

If you have any questions after reviewing the package, you can chat with us directly here.
```

Internal verification:

```markdown
- Origin: Bali — PASS
- Destinations: Ijen, Papuma, Tumpak Sewu, Bromo — PASS
- Madakaripura excluded — PASS
- Exact price omitted because pax/date were not confirmed — PASS
- No unsupported guarantee added — PASS
```

## Failure Handling

If verification fails, do not produce the customer-facing answer as final. Instead, report the issue:

```markdown
Verification failed.

Issue:
- The selected package link is from Surabaya, but the customer requested a Bali starting point.

Safer alternative:
- Use a verified from-Bali package link.
- Or present it as a custom route requiring confirmation.
```

## Success Criteria

The skill succeeds when:

* The final reply is ready to send.
* The package link and package description match.
* The route origin is correct.
* The destinations are correct.
* No unsupported price, inclusion, or guarantee is added.
* The user does not need to manually correct basic package mismatch errors after the output.
