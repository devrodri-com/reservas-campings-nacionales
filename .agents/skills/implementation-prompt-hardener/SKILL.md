---
name: implementation-prompt-hardener
description: Use this skill when the user already has a strong implementation prompt or product-defined task and wants it hardened before sending it to Cursor or another coding agent. Focus on repo-specific blind spots, validators, runtime parsing, backward compatibility, hidden edge cases, and missing technical constraints. Do not redesign the product scope unless necessary.
---

# Implementation Prompt Hardener

## Goal
Take an already-defined implementation task and improve it so execution in the real repo is safer, more complete, and less likely to miss hidden runtime issues.

## Use this skill when
- the feature scope is already defined,
- the prompt is already fairly detailed,
- the main risk is incomplete implementation rather than unclear product intent,
- the repo may contain hidden validators, parsers, duplicated logic, or compatibility constraints.

## Do not use this skill when
- the product requirements are still unclear,
- the user needs architecture from scratch,
- the task is primarily debugging a live bug,
- the task is tiny and isolated.

## Activation rule
Only use this skill when:
- the prompt is complex or multi-file
- there is risk of incomplete implementation
- there are potential runtime or compatibility concerns

Do NOT use this skill for:
- small UI tweaks
- simple isolated changes
- trivial bug fixes

## Required process
1. Read the implementation prompt and preserve its intended scope.
2. Inspect the real repo structure and locate the actual code paths.
3. Identify hidden technical gaps such as:
   - validators
   - Firestore/document parsers
   - repo/repository readers
   - duplicated guards
   - backward compatibility paths
   - date/number semantics
   - local change safety
4. Add only the missing constraints needed to make the implementation safe and complete.
5. Keep the task V1-scoped and avoid overengineering.
6. If the prompt is already close to execution-ready, prioritize identifying hidden breakage risks, legacy data issues, and missing verification steps over broad restructuring.
7. Return an improved prompt ready to hand to Cursor.

## What to look for
- type changes that also require runtime parsing changes
- places where `any` may be introduced unnecessarily and should be avoided
- fields that must be persisted at creation time and never mutated later
- fallback behavior for legacy records
- clamping/range semantics for numeric fields
- date comparison semantics
- repo-local conventions or code moved to helpers/hooks
- files that parse or mirror the same entity shape in multiple places
- risk of overwriting unrelated local changes
- whether the requested change should stay inline or be extracted into a small focused component/helper for clarity
- whether the prompt for Cursor is too large or open-ended
- whether the task should be split into multiple smaller prompts
- whether target files, invariants, or observable expected results are missing
- whether Cursor would need to make architectural decisions

## Output format
Return:
1. brief verdict on the original prompt
2. missing or risky points
3. execution decision: one prompt or multiple sequential prompts
4. improved prompt ready for Cursor
5. what to review after implementation

## Rules
- do not broaden the product scope
- do not add speculative future-proofing
- do not turn V1 into V2
- do not push unnecessary refactors
- prefer precise additions over rewriting everything
- avoid `any` unless there is no reasonable typed alternative
- if suggesting extraction to a new component/helper, keep it small and justified by clarity, reuse, or file growth
- the final Cursor prompt must be small, bounded, and executable
- if the task is large, split it into sequential prompts
- do not delegate architectural decisions to Cursor
- if Cursor has to “figure out what to do”, the prompt is not ready