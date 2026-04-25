---
name: ui-review-cursor-handoff
description: Use this skill when the user wants a critical UX/UI review of an existing screen, section, or landing and needs a precise implementation handoff for Cursor. Focus on hierarchy, clarity, branding alignment, conversion, trust, and MVP-safe improvements. Do not implement changes.
---

# UI Review + Cursor Handoff

## Goal
Review an existing UI critically, identify the most important improvements, and return a precise prompt ready for Cursor.

## Use this skill when
- the user shares a screen, landing, section, or visual flow
- the task is about UX, hierarchy, branding, trust, or conversion
- the user wants critique plus an implementation handoff
- the requested change should stay MVP-safe and low-risk

## Do not use this skill when
- the task is primarily backend or data-flow related
- the user wants direct implementation
- the task is a tiny visual tweak with no product/UX decision involved
- the product requirements are still undefined

## Required process
1. Evaluate the current UI with a critical product/UX lens.
2. Separate what is already working from what is weakening clarity, trust, or conversion.
3. Keep the product context in mind:
   - institutional vs commercial tone
   - MVP vs final product
   - actual business goal of the page
4. Recommend only the highest-value improvements first.
5. Avoid broad redesigns unless explicitly requested.
6. Produce a prompt that Cursor can execute safely and precisely.
7. If the UI change is broad, split it into small sequential Cursor prompts instead of one large prompt.

## What to look for
- clarity of the main user action
- hierarchy of message and CTA
- branding consistency
- perception of quality and trust
- unnecessary friction before key actions
- sections competing for attention
- placeholders or incomplete signals visible in UI
- whether the proposed change should stay inline or be extracted into a small focused component/helper

## Output format
Return:
1. what is working
2. what is weakening the screen
3. the highest-priority improvement
4. execution decision: one UI prompt or multiple smaller prompts
5. a short plan (V1/V2 only if useful)
6. a precise Cursor prompt

## Rules
- do not implement changes
- do not edit files
- do not redesign the whole page unless explicitly requested
- keep the recommendation aligned with the current product and brand context
- prefer MVP-safe, high-impact, low-risk improvements
- avoid `any` in implementation guidance
- if suggesting extraction, keep it small and justified
- the Cursor prompt must be small, scoped, and executable
- do not ask Cursor to make product or architecture decisions
- if the UI improvement touches multiple sections, split it into separate prompts