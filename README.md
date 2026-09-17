# Kjemilab 1.1

Open `index.html` in your browser. This is the built website, not a prompt or a project that must be installed first. All runtime code, styles, diagrams and course data are embedded in the HTML. No account, API key, Codex, server or Node installation is required for normal use.

The interface and learning content are Norwegian Bokmål. Begin with **Start en økt**, choose an individual topic under **Øv**, or open **Laboratorium**.

## New: Periodesystemet

Choose **Periodesystemet** in the desktop menu, or **Pugg** in the mobile menu. The three tabs are **Utforsk tabellen**, **Pugg** and **Forklar sammen**. The original chemistry course remains available.

The interactive table is explicitly an excerpt showing the first 20 elements, not all 118. It supports search, group/period highlighting and a selected-element shell diagram. The practice subset can be the first 10, first 20 or any nonempty selection. The first-20 scope is an app design choice, not a teacher requirement. The new project sheet does not prescribe an element memorization list.

The separate bank contains 210 practice questions: 40 about names/symbols, 65 about groups/periods/positions, 63 about atoms/electrons, 20 about ions/charge and 22 about size/electronegativity. Responses include typed recall, numeric values, signed charges, shell sequences, choices and an unlabelled placement table. Chemical symbol case matters, while element names tolerate case and surrounding spaces.

Rounds have 10 or 20 base questions, or fewer for a small pool. Assisted/revealed cards can return after at least two different intervening cards, with at most six added slots. Otherwise they remain due for a later round. A correct retry, hint or lookup never counts as an independent first answer. Delayed recall requires at least 24 elapsed hours; these transparent practice rules are not a calibrated learning metric or school grade.

**Forklar sammen** offers 12 authored oral questions, follow-up prompts, optional saved notes, manual checklists and optional example answers. One to four participants can take turns. These are practice prompts based on the uploaded assignment and chemistry sources, not the teacher's actual oral questions. Oral self-assessment is stored separately and receives no automatic grading.

## What is included

The site contains 10 course modules and 30 skills, 120 original questions with two tailored hints per question, teacher self-assessment for 13 summary questions and seven building reflections, and a 20-question mini-test. Questions use six different interactions rather than only multiple choice.

The laboratory includes a molecule builder for 12 unique targets, a first-20-element shell model with six checked ion-building challenges, polarity and boiling models, and oil/water/ethanol and soap activities. The molecule validator checks atoms, complete valence, connectedness, bond orders and requested structural identity, not drawing coordinates or formula alone. Isobutane and 2-methylpropane are the same target. The worksheets' unspecified propanol is explicitly represented as propan-1-ol.

Molecules can be assembled by adding C, H and O, selecting two atoms to connect them and choosing a bond order. The **Presise kontroller** panel provides labelled selects instead of requiring dragging. An atom with keyboard focus can be moved with arrow keys. Undo, redo, fit and zoom are available. Formula, skeleton, valence-counter and automatic-hydrogen aids mark the attempt as assisted.

Practice distinguishes an independent first response from a retry, a hint-assisted response and an explicitly revealed answer. Mistakes produce retry guidance, not an automatic answer. Repairs use the session's existing question slots. Skill readiness requires diverse clean evidence; delayed recall is separate. These are the app's transparent practice rules, not a scientifically calibrated measurement or a school grade.

All modules remain accessible. There are no lives, forced countdowns, paywalls or mandatory starting tests. Dark, light and system themes, reduced motion, and optional quiet success sounds are included.

## Saving and moving progress

To upgrade, first export progress from the old website, then import the JSON backup through **Innstillinger** in this version. Old version-1 backups without periodic practice data are accepted. A different local file path may not share the old browser storage automatically. Import requires confirmation and replaces the current state rather than merging people or devices.


The app attempts to save progress in this browser's localStorage after changes. It restores unfinished answers, answer order, hint flags, builder drafts and teacher text. It validates imported data and retains a previous valid backup when storage allows. Storage failures produce an on-screen warning and learning can continue in memory.

Use **Innstillinger → Eksporter fremgang** to make a JSON backup. Importing that file in another browser requires an explicit replacement confirmation. Progress is not synced between devices. Moving or renaming a local HTML file, changing its address, private browsing and clearing browser data can affect the storage available to it. Export before moving the file or clearing data. Some managed browsers forbid opening local HTML files entirely.

## Sources and scope

The prepared course data is preserved in `course/`. `course/SOURCE_NOTES.md`, `course/sources.json` and `course/clarifications.json` document source boundaries, corrections and supplements. The website exposes the source links and relevant clarification notes alongside the teaching content. Teacher questions remain separate from the authored practice questions and illustrative answers.

The course is based on the original five supplied teaching files, the subsequently uploaded project assignment and the linked NDLA material. It does not silently treat all wording in the slides as universally correct. The prior course pack already identified simplifications and conflicting wording; those notes remain visible. Added soap explanations and structural distinctions are labelled. The original H5P banks from the two linked exercise pages were not imported. Original teaching files are not modified or redistributed here.

The source links open external pages and need internet. The learning app itself makes no remote requests and does not include analytics, remote fonts, accounts or paid services. Its answer keys are local, so the mini-test is a practice tool, not a secure examination system.

## Source and rebuilding

`src/` contains the TypeScript, separated into grading, chemistry validation/layout, learning state, storage, DOM helpers, diagrams, practice, laboratories and pages. `app.css` is the editable stylesheet. `src/index.template.html` is the editable HTML shell. `app.js` and the self-contained `index.html` are generated release files.

The project deliberately uses a small dependency-free browser runtime instead of the earlier suggested React/Vite stack. This makes the requested double-click HTML delivery possible without module loading, CDN access or an installation step.

To rebuild after editing, install the development dependencies with `npm install`, then run `npm run build`. The only development dependency is TypeScript 5.8.3. A globally installed TypeScript compiler can also be used by `node scripts/build.mjs`. Run `npm run check` to rebuild and run the pure logic suite. Browser regression commands are documented in `docs/VERIFICATION.md`.

The original course data is embedded in `src/content.ts`. The periodic extension is authored in `course/periodic.json`; the build embeds it automatically in `src/periodic-data.ts`. When changing curriculum JSON, update its matching constant in that file before rebuilding. The original JSON is retained for transparent auditing and future tooling, not fetched at runtime.

## Testing and limitations

The verification details are in `docs/VERIFICATION.md`. The built app's native controls were exercised in headless Chromium, including the full question bank and every molecule-building target. The full source passed the strict TypeScript build and the automated logic suite.

The test environment's browser policy blocked both file URLs and localhost navigation. Browser testing therefore rendered the built HTML directly with Playwright `set_content`; it did not test a real double-click launch. Persistence paths were tested against an explicit Storage-compatible adapter, plus a browser context where storage was denied. Native file-origin persistence, Safari, Firefox and physical touch devices were not tested here. No service worker is included or needed for the downloaded self-contained file. Offline reload of a remotely hosted copy is not promised.
