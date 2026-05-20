# SKILL.md

# Skill Name
JVTO_Verified_Package_Response_Generator

# Description
Generate a customer-ready JVTO reply AND verify it before sending.

This skill is designed for JVTO Customer Support when responding to tour inquiries, package matching, booking guidance, inclusions, vehicle allocation, hotel/room questions, pricing direction, add-ons, and route feasibility.

The skill prevents common CS errors such as:
- Sending the wrong package URL
- Offering a route that does not match the official package
- Mentioning inclusions that are not verified
- Forgetting to direct customers to the website checkout
- Giving manual pricing when the website should be used
- Overpromising flexibility, hotel upgrades, or availability
- Incorrect vehicle / crew explanation based on pax count

---

# When To Trigger

Trigger this skill when a customer asks about:

- Bromo, Ijen, Tumpak Sewu, Madakaripura, Papuma, Safari, or Bali transfer packages
- Private tour options
- Package price
- Start / finish city
- Pick-up / drop-off change
- Skip destination
- Add-on transfer
- Vehicle type
- Hotel or room arrangement
- Inclusions / exclusions
- How to book
- Whether a route is possible
- Family, elderly, or Ijen safety concerns

---

# Trigger Examples

## Example 1
Customer:
"Hi JVTO, I want Bromo & Ijen from Surabaya to Bali. How much?"

Skill must:
- Match official Surabaya to Bali package
- Provide correct URL
- Direct customer to check pricing on website
- Include booking direction

## Example 2
Customer:
"We are 4 people. What vehicle do we get?"

Skill must:
- Verify group size
- Use vehicle allocation rule
- Mention Toyota Hiace if applicable
- Avoid guessing luxury upgrade unless requested

## Example 3
Customer:
"Can we skip Madakaripura?"

Skill must:
- Confirm Madakaripura is in the package
- Explain skip handling only if verified
- Avoid inventing refund unless value exists in approved internal data

## Example 4
Customer:
"We want pickup from Yogyakarta."

Skill must:
- Avoid offering full Jogja overland if not official JVTO scope
- Recommend train to Surabaya
- Offer Surabaya station pickup if package supports Surabaya start

## Example 5
Customer:
"Is the Ijen guide private or shared?"

Skill must:
- Confirm based on private package structure
- Mention Ijen trekking guide only if included/verified
- Avoid guaranteeing blue fire access

---

# Data Sources Required

The skill must check the following JVTO sources before generating the answer:

1. Official package database
   - Package name
   - Duration
   - Start city
   - Finish city
   - Official URL
   - Price group logic if available

2. Inclusions & Exclusions Policy
   - Transport
   - Accommodation
   - Jeep
   - Entrance tickets
   - Safety gear
   - Meals
   - Exclusions

3. Booking Guide
   - Website checkout requirement
   - Deposit rule
   - Booking confirmation rule
   - Official channel rule

4. Accommodation / Vehicle / Crew Allocation
   - Room allocation
   - Vehicle type by pax
   - Crew allocation by pax

5. Ijen Health Screening Rules
   - Medical check requirement
   - Safety limitations
   - No guarantee language

---

# Response Generation Rules

## Step 1 — Identify Customer Intent
Classify the inquiry as one of:

- New package inquiry
- Existing booking support
- Add-on request
- Route feasibility
- Hotel / vehicle question
- Ijen safety question
- Pricing question
- OTA booking question
- Refund / adjustment question

## Step 2 — Match Package
Match only packages that satisfy:

- Start city
- Finish city
- Duration
- Destinations requested
- Customer group size
- Known date constraints

If no package matches:
- Do not force a match
- Ask clarification or offer human-agent escalation

## Step 3 — Generate Customer Reply
Use JVTO style:

- Short greeting
- Direct answer
- Correct package name
- Correct URL
- Key verified inclusions only
- Booking direction
- Clear CTA

For pricing:
- Do not manually negotiate
- Direct customer to the package page
- Explain price is system-generated based on date, pax, and room selection

---

# Verification Step

Before sending, run this checklist:

## Package Verification
- [ ] Package name exists in official package database
- [ ] URL matches the package
- [ ] Start city is correct
- [ ] Finish city is correct
- [ ] Duration is correct
- [ ] Destinations mentioned are actually in the package

## Booking Verification
- [ ] Customer is directed to official website checkout
- [ ] No manual booking promise is made
- [ ] Deposit rule is stated only if relevant
- [ ] Pricing is not manually changed unless approved

## Inclusion Verification
- [ ] Only verified inclusions are mentioned
- [ ] No unlisted hotel, meal, activity, or transfer is promised
- [ ] Add-ons are clearly labeled as optional
- [ ] Inclusions are not treated as binding unless written on official page/voucher

## Logistics Verification
- [ ] Route order is geographically logical
- [ ] Pick-up and drop-off are compatible with package
- [ ] Airport/train timing is realistic
- [ ] Bali transfer includes Java–Bali time difference if relevant

## Vehicle / Crew Verification
- [ ] Pax count matches vehicle allocation
- [ ] Crew explanation matches pax count
- [ ] Upgrade vehicle is not promised before availability check

## Safety Verification
- [ ] Ijen medical screening is mentioned when relevant
- [ ] Blue fire is not guaranteed
- [ ] Crater descent is subject to official access and safety clearance
- [ ] Elderly/children/asthma cases are handled with safety-first wording

## Brand Voice Verification
- [ ] Message is concise
- [ ] No overpromising
- [ ] No unsupported customization
- [ ] Clear CTA
- [ ] Professional JVTO tone

If any checklist item fails:
- Do not send final answer
- Correct the answer
- If still uncertain, ask a clarifying question or escalate to human CS

---

# Customer Reply Template

Hi [Name] 👋

Thank you for your message.

For your request, the suitable JVTO package is:

[Package Name]  
[Package URL]

This is a private, all-inclusive package.

You can check the full package details, availability, and pricing directly on the page by selecting:
- Travel date
- Number of participants
- Room option if available

For inclusions and exclusions:
https://javavolcano-touroperator.com/policy/inclusions-exclusions

To book, please proceed directly via the package page.  
If you need assistance during the booking process, feel free to contact us.

Warm regards,  
JVTO Team

---

# Internal Verification Output

After generating the answer, produce an internal note:

Verification:
- Package URL: PASS / FAIL
- Start/finish city: PASS / FAIL
- Inclusions: PASS / FAIL
- Booking direction: PASS / FAIL
- Pricing integrity: PASS / FAIL
- Logistics feasibility: PASS / FAIL
- Risk level: LOW / MEDIUM / HIGH

If risk level is MEDIUM or HIGH:
- Add a note: “Needs human CS / operations confirmation before sending.”

---

# Tools Needed

## Required Tools

1. Package Lookup Tool
Used to verify:
- Package name
- URL
- Duration
- Start/finish city
- Price group

2. Inclusion Policy Lookup Tool
Used to verify:
- Transport
- Hotels
- Jeep
- Tickets
- Ijen gear
- Meals
- Exclusions

3. Booking Policy Lookup Tool
Used to verify:
- Website checkout
- Deposit
- Payment timing
- Official channel requirement

4. Vehicle & Crew Allocation Tool
Used to verify:
- MPV / Hiace / Jeep allocation
- Driver-guide vs driver + escort guide

5. Ijen Safety Rule Tool
Used to verify:
- Medical screening
- Gas mask
- Health conditions
- No guarantee for crater descent / blue fire

## Helpful Optional Tools

6. Route Timing Calculator
Used for:
- Surabaya → Bromo
- Bromo → Bondowoso / Ijen
- Ketapang → Gilimanuk
- Gilimanuk → Ubud / Denpasar / Munduk

7. Timezone Validator
Used for:
- Java time UTC+7
- Bali time UTC+8

8. Website URL Checker
Used to verify the package URL is live before sending.

9. Operations Availability Checker
Used for:
- Hotel availability
- Vehicle upgrade
- Special add-on
- Split transfer

---

# Main Benefit

This skill removes the manual second step where CS has to re-check:
- “Is the package URL correct?”
- “Did AI mention the wrong inclusion?”
- “Is this start/finish city valid?”
- “Should I send booking link or quote manually?”
- “Did we overpromise hotel/vehicle/blue fire?”

The answer is generated and verified in one workflow.