# Kjemilab implementation plan

Goal: Deliver a complete local, offline-capable Norwegian study website built from the approved course pack.

Architecture: Plain TypeScript, DOM components and native SVG. All course data is compiled into one local JavaScript file. The website opens from index.html without installation, a server or third-party downloads. The original React/Vite suggestion is adapted because npm is inaccessible in this build environment and the requested ZIP should open directly. This is a packaging/implementation change, not a change to the curriculum or learning contract.

Spec: the approved course pack supplied earlier in the conversation. Source boundaries remain in SOURCE_NOTES.md. No new research claims are introduced by implementation.

Implementation order and verification:
1. Pure graders and graph validation. Test every supplied grading case, all builder targets, malformed numbers/formulas, graph renaming, valence, connectivity and isomers.
2. Pure evidence reducer and selector. Test clean runs, diverse evidence, delayed recall, spacing, assisted resets, early/due review, idempotency and finite session budgets.
3. Validated local storage, backups and imports. Test malformed values, unsupported schemas, missing references and denied writes.
4. App shell, course pages and all six reusable question controls. Exercise reachable content, first-response preservation, retry, reveal, refresh and complete sessions in a real browser.
5. Atom, molecule, polarity and soap workbenches. Test checked targets, history, scaffolds, neutral graph rules, keyboard controls and drafts.
6. Teacher self-assessment, collection, progress, sources and settings. Test export/import and state consistency.
7. Build and render the self-contained HTML at 375, 768 and 1440 pixels. Direct URL navigation was blocked by the test environment; the supported rendering method and limits are recorded in VERIFICATION.md. Package source, the built website, course data, tests and documentation.

Visual system: charcoal background, warm off-white text, muted mint interaction accent, system fonts, a compact navigation rail on desktop and bottom navigation on mobile. No remote fonts or images. Chemistry diagrams are native interactive SVG, not decorative image assets. Use one next action and generous task space rather than many statistics.


## Implemented extension in version 1.1

Added a separate periodic-learning route family without replacing the original course, grader or laboratory. `periodic-types.ts` defines the optional backward-compatible state, `periodic-engine.ts` grades and schedules practice, `periodic.ts` renders exploration/drills/oral self-assessment, and `periodic-data.ts` is generated from `course/periodic.json`. Source F6 identifies the new project assignment. Existing progress keys and schema version are retained; the new optional subtree is validated when present.

The table uses real group/period coordinates while visibly omitting groups 3–12 from the first-20 excerpt. Compact layout coordinates never become answer keys. Mobile tables scroll locally, retain their horizontal position on same-card interaction and have keyboard and visible scrolling instructions. Existing chemistry visuals and design tokens are reused.

The update was implemented with regression tests before the new grading/state engine. Rendered checks then covered all new answer controls and oral prompts. Follow-up failing cases reproduced and corrected sparse checkbox serialization, a custom-selection hide button and stale note writes following a source dialog. A separate mobile reproduction verified and corrected table scroll reset after selection.
