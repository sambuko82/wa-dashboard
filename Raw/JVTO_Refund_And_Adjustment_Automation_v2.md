# Skill Name
JVTO_Refund_And_Adjustment_Automation_v2

# Purpose
Generate refund/upgrade calculations AND enforce pre-release validation gates 
to eliminate misalignment, deposit confusion, and margin leakage.

---

# NEW: 3-LAYER SAFETY MODEL

Layer 1 – Component Verification  
Layer 2 – Financial Integrity Check  
Layer 3 – Communication Risk Control  

The answer is NOT released until all 3 layers pass.

---

# LAYER 1 – Component Verification

Before calculating anything, the system must confirm:

□ Is this booking direct website / Klook / Viator?
□ Is hotel inside package OR already self-booked?
□ Is destination truly part of this package?
□ Is refund policy different for OTA bookings?
□ Is this upgrade replacing or adding?

If any ambiguity → ASK BEFORE CALCULATING.

This prevents wrong refund quoting.

---

# LAYER 2 – Financial Integrity Check

Before output, auto-run:

1. Refund Ceiling Rule  
   Refund cannot exceed allocated component value.

2. Deposit Protection Rule  
   Deposit is NOT recalculated unless:
   - Full cancellation
   - Within policy window

3. Net Adjustment Display Rule  
   Always show:
   + Upgrade
   - Refund
   = Net Difference

4. Timing Disclosure Rule  
   If refund given during trip:
   → Must explicitly state "Refund processed during trip."

5. Margin Safety Flag  
   If adjustment reduces margin beyond threshold → internal flag.

---

# LAYER 3 – Communication Risk Control

Before sending:

□ Is refund explained as allocation-based, not arbitrary?
□ Is it clear deposit remains valid?
□ Is final balance recalculated clearly?
□ Is it professional (no emotional tone)?
□ Is customer expectation aligned?

---

# NEW: Mandatory Output Structure

## Section 1 – Adjustment Breakdown

Original Allocation:
Refund:
Upgrade:
Add-On:
Net Adjustment:

## Section 2 – Updated Financial Summary

Original Total:
Deposit Paid:
New Total:
Remaining Balance:

## Section 3 – Policy Clarification (1 line max)

Example:
"Deposit remains unchanged as per booking policy."

---

# NEW: Error Prevention Additions

## A. OTA Booking Guard

If booking via:
- Klook
- Viator
- GetYourGuide

System must:

→ Prevent modification of base price
→ Allow only add-on invoice
→ Avoid refund promise before OTA confirms

---

## B. Sequence Control

Never:

1. Promise refund
2. Then check ops
3. Then retract

Instead:

1. Confirm eligibility
2. Validate allocation
3. THEN confirm refund

---

## C. Adjustment Trigger Pause

If:
- Multiple changes in same message
- Hotel removal + upgrade + split vehicle
- Peak season date

System inserts:

"Allow us to validate internally. We will revert shortly."

Prevents rushed miscalculation.

---

# Example Improvement

OLD STYLE (risky):
Refund 680,000  
Upgrade 3,600,000  

NEW STYLE (safe):

Refund (Hotel Bondowoso Allocation): 680,000  
Upgrade (Manis Ae 2 rooms): 3,600,000  

Net Adjustment: +2,920,000  

Deposit: unchanged  
Balance updated accordingly.

---

# What This Upgrade Fixes

• No more refund promise without allocation check  
• No more deposit confusion  
• No more unclear net math  
• No more OTA violation  
• No more under-quoting upgrades  
• No more emotional explanation  

---

# Optional Enhancement (If You Want Next Level)

Add:

Pre-Response Risk Scoring

LOW → Send immediately  
MEDIUM → Add confirmation line  
HIGH → Force internal verification message  

---

# Result

Before:
Answer → customer questions → clarify → adjust → apologize

After:
Single clean financial breakdown  
No contradiction  
No recalculation  
Authority preserved