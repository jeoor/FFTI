# AGENT.md

## Behavioral Guidelines (from CLAUDE.md)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Context (SBTI)

### Project Positioning
- This repo is a `Vite + Vanilla JS` front-end quiz app (SBTI).
- Core flow: render questions -> collect answers -> compute 15-dimension L/M/H -> match personality type -> render result page.
- Data-driven design: questions, dimensions, types, and thresholds are in `data/*.json`.

### Quick Start
- Install dependencies: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`

### Code Structure
- `src/main.js`: entry point; loads JSON, wires page flow, connects quiz/engine/result.
- `src/quiz.js`: question queue and answer state logic.
- `src/engine.js`: pure scoring and matching logic (no DOM dependency).
- `src/result.js`: result rendering, Top5 list, share button logic.
- `src/chart.js`: radar chart rendering.
- `src/share.js`: share image generation.
- `data/questions.json`: main questions + special drink gate questions.
- `data/dimensions.json`: 15-dimension order and text definitions.
- `data/types.json`: standard types + special types (`HHHH`, `DRUNK`).
- `data/config.json`: thresholds, fallback settings, display text, drink gate config.

### Critical Business Rules
- 30 main questions total, 2 questions per dimension, option score is `1/2/3`.
- Each dimension score range is `2~6`.
- Level thresholds from `config.scoring.levelThresholds`:
  - `<=3 -> L`
  - `==4 -> M`
  - `>=5 -> H`
- Type matching:
  - Map `L/M/H` to `1/2/3`
  - 15-dim Manhattan distance: `distance = sum(abs(user - type))`
  - `similarity = max(0, round((1 - distance/30) * 100))`
  - Sort priority: `distance ASC` -> `exact DESC` -> `similarity DESC`
- Special branches:
  - If `drink_gate_q1` hits trigger, insert `drink_gate_q2` after it
  - If `drink_gate_q2` hits `drunkTriggerValue`, force result to `DRUNK`
  - If best normal match `similarity < 60`, switch to `HHHH`

### Change Rules
- Keep data-driven behavior: add/adjust types, questions, thresholds in JSON first.
- For scoring changes, edit `src/engine.js` first and align `data/config.json`.
- For quiz flow changes, edit `src/quiz.js` and ensure progress/total count remains correct.
- For result UI changes, edit `src/result.js` / `src/style.css` and preserve `mode` branches (`normal`/`drunk`/`fallback`).

### Pre-Commit Minimal Checklist
- Runs locally: `npm run dev`
- Build passes: `npm run build`
- Manual validation on 3 paths:
  - Normal path: standard type + Top5
  - Drunk path: `DRUNK` appears with secondary
  - Fallback path: low similarity triggers `HHHH`
- Verify insert-question behavior: `drink_gate_q2` appears only when condition is met.

### Common Task Entry Points
- Add/adjust questions: `data/questions.json`
- Adjust dimension copy: `data/dimensions.json`
- Add standard types: `data/types.json` -> `standard`
- Adjust thresholds: `data/config.json` -> `scoring`
- Adjust matching algorithm: `src/engine.js`

### Risk Notes
- `dimensions.order`, question `dim`, and type `pattern` must stay in the same 15-dim order.
- Each `pattern` must be 15 `L/M/H` values (hyphen grouping allowed).
- Keep `engine.js` as pure logic; do not couple it to DOM.
