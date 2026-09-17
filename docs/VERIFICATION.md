# Verification record: release 1.1

The delivered release builds with TypeScript 5.8.3 in strict mode. There are no runtime package dependencies.

## Automated checks run

`npm run check`: strict TypeScript build succeeded; 246 tests passed, zero failed. The original `tests/core.test.cjs` contains 220 tests and the new `tests/periodic.test.cjs` contains 26. The original suite covers the following behavior: This includes every supplied grading acceptance case, keyed responses for all 120 questions, all 12 valid molecule targets, graph renaming, incorrect isomers, missing/excess hydrogens, duplicate edges, self-loops, disconnected fragments, strict formula and number parsing, evidence/repetition rules, delayed recall thresholds, review intervals, duplicate awards, import validation and storage backup recovery.

`python tests/browser_smoke.py`: 184 checks passed, with no collected JavaScript errors. This exercised all 120 questions through their actual controls, 21 screens at 1440, 768 and 375 pixel widths, and a regression test for preserving multiple categorisation selections. The width checks found no document-level horizontal overflow in those screens. The periodic table intentionally scrolls inside its own container.

`python tests/browser_flows.py`: 46 interaction flows passed, with no collected JavaScript errors. These included wrong answers and explicit hints/reveals for all six renderers, an entire 12-slot adaptive session, a complete 20-question test with three unknown responses and an exact 17/20 result after submission, switching a test to assisted practice, draft serialization/restoration, all 12 molecule targets assembled through atom/bond controls, keyboard atom movement, undo/redo, six checked ion targets, five polarity cases, both mixture predictions, soap orientation, teacher self-assessment, literal script-like input text, theme/motion changes, invalid/confirmed-valid imports, and storage-denied operation.

During the original 1.0 release, a separate pass rendered all 120 question layouts at 375 pixels and an expanded, populated molecule workbench without document-level horizontal overflow. The current 1.1 regression pass is the suite described above; this historical check is not counted as a new test run.

The complete built HTML was rendered again after embedding the CSS and JavaScript in the release file. Core navigation, practice, lessons and models run without network requests after the content has loaded.

## Periodesystemet extension

`python tests/browser_periodic.py`: 574 assertions passed, no collected JavaScript errors. All 210 new question keys were entered using the actual on-screen controls, including 20 unlabelled placement grids. Tests checked independent/assisted/revealed results, hidden answers after mistakes, hints, finite repair queues, a completed short round, saved-state validation after each question, all 12 oral checklists/example answers, group participant rotation, optional notes, separate self-assessment and restoration through the app boot path.

Responsive checks rendered exploration, practice setup and oral practice at 360, 390, 768, 1280 and 1440 CSS pixels in both dark and light themes. No document-level horizontal overflow or render-error panel was found. The periodic table intentionally scrolls inside a labelled, focusable container on narrow screens. Desktop, mobile, blank/answered placement and light-theme screenshots were inspected for typography, row/column alignment, contrast, native controls, spacing and continuity with the existing design.

`python tests/browser_periodic_edges.py` passed. It reproduces and verifies the fixes for checking a later rubric checkbox first, hiding a custom element selection and keeping notes after a source dialog. It also exercises confirmed import of both old and extended progress through the real file-input controls, preservation of horizontal table scrolling after selection, keyboard scrolling and new routes with the network disabled.

The sparse-checkbox defect was observed as `[null,null,null,true]` after JSON serialization. The fix creates a full boolean array, which passes the same import validator. A narrow-screen reproduction also observed table scroll reset from 223 to 0 pixels after selecting chlorine; the fixed view retains 223 pixels. These were actual observed regressions, not inferred test passes.

The original 184-check browser smoke suite and 46-flow interaction suite were rerun after the extension. All 120 original questions and all 12 molecule targets remained functional. The original and periodic banks together contain 330 automatically checked questions; the separate oral prompts are manually assessed, not automatically graded.

## Browser method and limits

The environment supplies Chromium and Python Playwright, but browser policy rejects both `file://` and localhost navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. No policy settings were changed. Tests rendered the exact built HTML using Playwright `set_content` in an isolated page instead. This exercises the real DOM, CSS, SVG, event handlers, grading and application state without requesting a blocked URL.

Because that page has an opaque origin, successful persistence tests used an explicitly injected Storage-compatible in-memory adapter. Persistence failure was also tested using the browser's actual denied storage state. Pure tests exercised backup and malformed-storage handling independently.

A real file double-click, native file-origin localStorage persistence, Safari, Firefox and a physical touch device were not tested. The release uses classic inline JavaScript, inline CSS, embedded course data and native SVG rather than module imports or fetch requests, so it does not require a web server. A managed browser can still forbid local HTML; the app cannot change that policy. There is no service-worker claim or promise of offline reload for a remotely hosted copy.

## Visual review

Rendered desktop and mobile home pages, the molecule workbench, collection, atom workbench, mini-test results, soap lab and light theme were captured. Review checked typography and formula subscripts, layout hierarchy, contrast between controls and surfaces, molecule/bond labels, current versus historical progress, and responsive scrolling. All visible interactive controls are native DOM or SVG, not screenshots of an interface. No remote images or fonts are required.

The earlier prose design was retained: dark laboratory workspace, muted green accents, one primary study action, open curriculum path, optional helpers, no compulsory timer, no lives and no mascot. The runtime was changed from the proposed React/Vite setup to plain typed browser components to produce a self-contained local HTML file.

Important defects found and fixed during these checks included a TypeScript DOM append error, stale categorisation selections, inaccessible select labels, builder panel collapse after changes, keyboard focus loss, inappropriate reuse of help flags from preparatory reading, randomly starting in a later foundational skill and failure to retain a malformed storage record when no good backup existed.

Tests and source are supplied so future edits can be checked against the same behavior. Passing these tests is not a guarantee of cross-browser compatibility or a scientifically validated measure of learning.
