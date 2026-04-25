

---
name: phase-scope-guard
description: Review whether a task or prompt respects the current project stage, scope, and minimum necessary depth before execution. Focus on preventing over-scoped prompts and ensuring Cursor receives small, bounded, executable tasks.
---

# Phase Scope Guard - Campings

## Context

This project is developed in clearly defined stages.

Workflow:
- ChatGPT defines business logic, priorities, and stages
- Codex translates decisions into technical direction
- Cursor executes concrete changes

Main risk:
- jumping stages
- mixing goals (setup + feature + UI + integration)
- overengineering
- giving Cursor ambiguous or overly large tasks

---

## Goal

Review a task or implementation prompt BEFORE execution and ensure:

- it respects the current project stage
- it has a clear, minimal scope
- it does not mix multiple layers of work
- it is small and executable by Cursor
- it does not require Cursor to make architectural decisions

---

## Use this skill when

- a prompt is about to be sent to Cursor
- the task touches multiple areas
- the scope is not obviously small
- there is risk of "this will expand too much"
- the prompt feels open-ended or ambiguous

---

## Do not use this skill when

- the task is trivial (copy, spacing, minor UI)
- the change is clearly isolated to a single line or file
- no meaningful risk of scope expansion exists

---

## What to check

- current project stage
- real objective of the task
- whether the prompt mixes:
  - base setup
  - domain logic
  - UI
  - integrations
- if the scope is too large or vague
- if Cursor would need to "figure out what to do"
- if unnecessary layers/components are being introduced
- if the task can be solved with a smaller surface

Also check:
- if the prompt for Cursor is too large or open
- if the task should be split into multiple smaller steps
- if target files or execution boundaries are missing

---

## Rules

- Do NOT expand the scope of the current stage
- Do NOT allow multiple stages in one execution
- Do NOT push premature architecture
- Do NOT allow ambiguous prompts
- Always prefer the minimum change needed

Execution rules:
- If the prompt is large → split it
- If the prompt is ambiguous → tighten it
- If Cursor would need to think → the prompt is wrong

---

## Output

Return:

1. Current stage identified
2. What part of the request belongs to this stage
3. What part is overreaching or mixing concerns
4. Scope risks
5. Decision: execute as-is OR split into multiple prompts
6. Corrected scope
7. Adjusted or validated prompt for Cursor

---

## Warning signals

- "while we’re here" → WARNING
- "let’s prepare this for later" → WARNING
- placeholders without immediate use → WARNING
- creating structure just for cleanliness → WARNING
- setup + feature + integration in one prompt → WARNING
- Cursor needing to interpret architecture → WARNING

---

## Decision criteria

A prompt is GOOD if:
- it matches the current stage
- it has a clear boundary
- it does not allow expansion
- it produces a small, concrete result

A prompt is BAD if:
- it mixes concerns
- it is open-ended
- it allows Cursor to make decisions
- it can grow beyond the intended scope