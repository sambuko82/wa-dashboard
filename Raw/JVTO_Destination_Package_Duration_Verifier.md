# SKILL.md

# Skill Name
JVTO_Destination_Package_Duration_Verifier

# Description
Generates a customer-ready JVTO reply AND verifies whether the customer's requested destinations, route, duration, and timing match an official JVTO package.

This skill is used when customers bring their own itinerary, agency reference, Google-based route, or self-made travel plan.

The main goal is to prevent AI from saying:
"Yes, we can arrange that"

before checking:
- Official JVTO package match
- Correct package duration
- Start and finish city
- Destination combination
- Safety and access logic
- Whether the itinerary is actually relaxed or rushed
- Whether the customer is asking for transport-only service

This skill must always prioritize official JVTO package structure over customer-created itinerary logic.

---

# Core Principle

Destination match comes first.

Before answering, check the customer’s requested destinations against the official JVTO package database.

If the requested destination combination exists only as a 4D3N package, do not validate it as a 3D2N relaxed itinerary.

Example:

Customer request:
Surabaya → Bromo → Tumpak Sewu → Ijen → Surabaya  
Duration requested: 3 days

Official JVTO match:
4 Day Ijen, Papuma Beach, Tumpak Sewu & Bromo Journey from Surabaya  
Duration: 4D3N  
Start: Surabaya  
Finish: Surabaya  
URL: https://javavolcano-touroperator.com/tours/from-surabaya/ijen-papuma-tumpak-sewu-bromo-4d3n

Correct conclusion:
The requested destinations match the 4D3N route, not a relaxed 3D2N itinerary.

---

# When To Trigger

Trigger this skill when a customer says or implies:

- "We made our own itinerary"
- "Can you arrange this route?"
- "Private car + driver only"
- "No sunrise tour"
- "No blue fire tour"
- "Relaxed itinerary"
- "Flexible timing"
- "Bromo afternoon"
- "Tumpak Sewu late afternoon"
- "Ijen morning hike"
- "We only have 3 days"
- "Estimated price for this route"
- "Accommodation suggestions"
- "Can we avoid crowds?"

Also trigger when customer requests multiple East Java destinations in a short duration, especially:

- Bromo + Ijen + Tumpak Sewu
- Bromo + Ijen + Tumpak Sewu + return Surabaya
- Bromo + Tumpak Sewu + Ijen + Bali
- Ijen + Papuma + Tumpak Sewu + Bromo
- Any route involving Tumpak Sewu late afternoon

---

# Examples That Should Trigger This Skill

## Example 1
Customer:
"We want Bromo, Tumpak Sewu, and Ijen in 3 days, relaxed itinerary, no sunrise."

Skill action:
- Match destinations to official packages
- Detect that full destination combination belongs to 4D3N
- Explain that 3 days is not relaxed
- Recommend official 4D3N package
- If they only have 3 days, suggest reducing destinations or escalate to human CS

## Example 2
Customer:
"We only need private car and driver, no guide."

Skill action:
- Do not offer transport-only
- Explain JVTO operates private tour packages, not standalone driver-only service
- Mention private vehicle is included within official package
- Do not quote car rental price

## Example 3
Customer:
"We want Tumpak Sewu late afternoon."

Skill action:
- Reject as not recommended
- Explain daylight, access, trekking path, wet/steep terrain, and safety concerns
- Do not build itinerary around late-afternoon Tumpak Sewu

## Example 4
Customer:
"We want to avoid the biggest crowd, so we want Bromo afternoon and Ijen morning after sunrise."

Skill action:
- Acknowledge crowd-avoidance preference
- Verify whether this removes core itinerary structure
- Explain that changing sunrise/blue-fire structure may reduce the experience but does not automatically make the route relaxed
- Check if package duration still fits

## Example 5
Customer:
"We are arriving June 15 and leaving June 19, but tour dates are June 16–18."

Skill action:
- Treat available tour duration as 3D2N
- Compare it against official package duration
- If official matching package is 4D3N, clearly state mismatch

---

# Verification Workflow

## Step 1 — Extract Customer Request

Identify:

- Number of travelers
- Travel dates
- Actual available tour dates
- Start city
- Finish city
- Requested destinations
- Requested style
- Timing restrictions
- Transport-only language
- Safety-sensitive requests

Example extraction:

Travelers: 2  
Available tour dates: June 16–18  
Start: Surabaya  
Finish: Surabaya  
Destinations: Bromo, Tumpak Sewu, Ijen  
Style: relaxed, avoid crowds  
Requests: private car + driver only, no sunrise, no blue fire  
Risk request: Tumpak Sewu late afternoon  

---

## Step 2 — Destination-to-Package Match

Search official JVTO package database.

Check:

- Does this destination combination exist?
- What is the official duration?
- What is the official route?
- What is the official start city?
- What is the official finish city?
- What is the official package URL?

If official duration is longer than customer duration:
- Do not force it
- Do not say it can be customized
- Explain that the official duration already considers distance, access, safety, and pacing

---

## Step 3 — Duration Mismatch Gate

If customer wants 3D2N but official matched package is 4D3N:

Mark:

Risk Level: HIGH  
Reason: duration mismatch

Required answer:

- Acknowledge their available dates
- Explain the requested destination combination matches a 4D3N route
- Explain that compressing into 3 days is not relaxed
- Mention long drives, limited daylight, Tumpak Sewu access, and rest time
- Recommend official 4D3N package
- If customer cannot extend, advise reducing destinations or human CS review

Never say:
"Yes, we can definitely arrange that."

---

## Step 4 — Transport-Only Guard

If customer asks:

- private car + driver only
- driver only
- transport only
- no guide
- no tour

Then verify JVTO policy.

Correct response:

"JVTO does not operate standalone transport-only service. However, our official packages are private and include private vehicle, driver, accommodation, tickets, and required local/site arrangements according to the package."

Do not:
- Quote driver-only price
- Promise car rental
- Remove required local/site guide
- Present package as transport-only

---

## Step 5 — Tumpak Sewu Safety Gate

If customer asks for Tumpak Sewu late afternoon:

Mark:

Risk Level: HIGH

Reason:
Tumpak Sewu requires enough daylight due to access, trekking, wet/steep paths, and safety.

Required wording:

"We do not recommend visiting Tumpak Sewu late afternoon because the access and trekking require sufficient daylight for safety."

Do not:
- Schedule Tumpak Sewu near sunset
- Say it is flexible without safety warning
- Use "relaxed" for this timing

---

## Step 6 — Relaxed-Itinerary Contradiction Gate

If customer says "relaxed" but requests too many destinations in too short a time:

Mark:

Risk Level: HIGH

Required wording:

"With these destinations in only 3 days, the trip would not be relaxed. It would become rushed due to long transfers, limited daylight, and reduced rest time."

---

## Step 7 — Generate Customer Answer

The answer must include:

- Polite greeting
- Acknowledge customer dates/duration
- State package match
- Explain why requested duration does not fit
- Mention safety and access considerations
- Provide official package URL
- Suggest reducing destinations if they only have 3 days
- Avoid manual price unless package pricing is available and appropriate
- Direct customer to website for full details and booking

---

# Verification Checklist Before Sending

## Package Match Verification
- [ ] Requested destinations were extracted correctly
- [ ] Official package database was checked
- [ ] Package duration matches the destination combination
- [ ] Start city matches
- [ ] Finish city matches
- [ ] Correct official URL included
- [ ] No invented package created

## Duration Verification
- [ ] Customer available dates converted into actual tour duration
- [ ] Duration mismatch identified
- [ ] 4D3N package not presented as 3D2N
- [ ] No "yes, possible" before verification

## Safety Verification
- [ ] Tumpak Sewu late-afternoon request flagged
- [ ] Daylight and access risk mentioned
- [ ] Ijen / Bromo timing not overpromised
- [ ] "Relaxed" contradiction identified if itinerary is too compressed

## Policy Verification
- [ ] Transport-only request handled correctly
- [ ] JVTO package model explained
- [ ] No standalone driver-only quote given
- [ ] No unlisted inclusions promised

## Brand Voice Verification
- [ ] Short and professional
- [ ] No defensive tone
- [ ] No over-explanation
- [ ] Clear recommendation
- [ ] Clear next step

If any item fails:
- Do not send
- Rewrite the answer
- If still unclear, escalate to human JVTO agent

---

# Example Customer-Ready Response

Hi,

Thank you for clarifying your available dates.

Based on your requested destinations:

Surabaya → Bromo → Tumpak Sewu → Ijen → Surabaya

This combination matches our official 4D3N East Java route, not a 3D2N relaxed itinerary.

The reason is that JVTO designs each itinerary based on actual driving distance, access conditions, daylight timing, and safety considerations.

Tumpak Sewu is also not recommended for a late-afternoon visit because the access involves trekking, wet/steep paths, and requires enough daylight for safety.

If we compress Bromo, Tumpak Sewu, Ijen, and return to Surabaya into only 3 days, the trip would not be relaxed. It would become rushed, with long drives and limited rest time.

For this reason, we recommend the official 4D3N package:

4 Day Ijen, Papuma Beach, Tumpak Sewu & Bromo Journey from Surabaya  
https://javavolcano-touroperator.com/tours/from-surabaya/ijen-papuma-tumpak-sewu-bromo-4d3n

If you only have 3 days, we recommend reducing the number of destinations so the trip remains safe and comfortable.

---

# Internal Verification Output

After drafting, generate this internal note:

Verification:
- Destination combination matched: PASS / FAIL
- Official package duration checked: PASS / FAIL
- Customer requested duration checked: PASS / FAIL
- Duration mismatch handled: PASS / FAIL
- Transport-only guard applied: PASS / FAIL
- Tumpak Sewu timing safety checked: PASS / FAIL
- Correct URL included: PASS / FAIL
- No unsupported customization promised: PASS / FAIL

Risk Level:
LOW / MEDIUM / HIGH

If HIGH:
Do not quote price directly.
Recommend official package or reduce destinations.
Escalate to human CS if customer insists.

---

# Tools Needed

## Required Tools

1. Official JVTO Package Lookup
Used to verify:
- Package name
- Duration
- Start city
- Finish city
- Destinations
- Official booking URL
- Price group if needed

2. JVTO Policy Lookup
Used to verify:
- Private all-inclusive model
- No standalone transport-only service
- Booking confirmation rules
- Binding inclusions

3. Inclusions / Exclusions Lookup
Used to verify:
- Private vehicle
- Accommodation
- Bromo Jeep
- Tickets
- Meals
- Conditional add-ons
- What cannot be promised unless written

4. Route Feasibility Validator
Used to check:
- Long-distance route risk
- Same-day compression
- Return-to-Surabaya feasibility
- Whether customer’s “relaxed” claim matches actual route reality

5. Daylight & Access Safety Checker
Used especially for:
- Tumpak Sewu timing
- Waterfall trekking safety
- Late-afternoon access
- Ijen morning or night hike changes

## Optional Tools

6. Google Maps / Route Duration Tool
For operational estimates only.
Do not override official package structure.

7. Operations Availability Checker
For hotel, vehicle, or special adjustment availability.

8. Website URL Checker
To confirm the package link is active before sending.

---

# Main Mistake This Skill Prevents

It prevents AI from validating the customer’s self-made itinerary too quickly.

Wrong:
"Yes, we can arrange that relaxed 3-day trip."

Correct:
"Those destinations match our 4D3N package. In 3 days, this would not be relaxed and is not recommended due to distance, daylight, and safety considerations."