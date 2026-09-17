# Source notes for Kjemilab

## Periodic practice extension, version 1.1

The new `Prosjekt om kjemisk bindinger.docx` is source F6. It permits a periodic-table topic and asks students to connect chemical bonds with properties, explain theory, use terminology correctly and answer follow-up questions. It does not list elements to memorize and does not supply the 12 oral questions used by this website.

`periodic.json` contains 210 newly authored practice items and 12 oral practice prompts with illustrative answers. Their source references indicate factual grounding, not copied questions. The 20-element selection, five practice tracks, 10/20-question rounds, participant rotation and repetition intervals are product decisions, not teacher requirements.

Element facts reuse the already documented `elements.json`. The table is visibly labelled as a first-20 excerpt, with groups 3–12 omitted and period 4 continuing beyond the excerpt. It is not labelled as the complete 118-element table. Choosing the first 20 follows the manageable range used in the linked NDLA shell model, but does not impose an assessment scope.

The extension retains the original explicit clarifications below. In particular, group/period terminology follows C01, neutral atoms and the first shell follow C03, main-group patterns and H/He exceptions follow C04, first-20 shell scope follows C14, and proton-number ordering follows C15. Qualitative atomic-size and electronegativity trends are not converted into numerical size ratios. The charge exercises deliberately use the course's specified simple ions, not a universal ion rule for every member of a group.

Oral model answers connect the atom model, groups, electron transfer and examples of ionic bonding and conductivity. Those added examples are cited to the existing chemistry references; the project assignment itself supplies the assessment framing, not those answers. Model answers are optional and manual self-assessment is kept separate from automatically checked recall.

The original content-preparation notes are preserved below as historical source notes. They are not a record of the current implementation tests; those are in `docs/VERIFICATION.md`.

---

Prepared on 17 September 2026. This is a content and implementation brief, not a claim that a website has already been built or tested.

## What was inspected

The complete supplied text of all five uploaded files was read. Images embedded in the three slide decks were inspected, including the rounded electronegativity table on slide 7 of Atommodellen og periodesystemet, the two different presentations of water in Sterke og svake bindinger, and the alcohol, fatty-acid and triglyceride structures in Hydrokarboner Alkoholer Fettsyrer. The illustrated first page of the molecule-building worksheet was also available. The new application should draw its own diagrams, not redistribute these embedded images.

All eight linked NDLA public pages were opened. The public descriptions and relevant explanatory text informed the plan. The H5P payloads behind the summary questions and the polarity exercise could not be retrieved. Their actual question banks are therefore not reproduced or claimed as reviewed. The externally embedded molecular simulations were not executed. The app has its own authored practice items and native interactions, with optional links back to the originals.

OpenStax chapters listed in sources.json supply explicitly marked clarification and additional context. They are not permission to expand the course into advanced chemistry. No attempt is made to reproduce full chapters, source diagrams, or the NDLA exercise interface. The questions and short explanations in this pack are newly written for this course.

## Scope and source hierarchy

The uploads determine what the learner is expected to study and preserve the familiar Norwegian terminology. NDLA is the main Norwegian reference. A concrete conflict or missing explanation is handled in the records below, using the listed corroborating sources. The originals are never silently edited. In the app, a small “Faglig presisering” disclosure can explain a relevant difference. Do not put a large warning in front of every question.

The content is an authored school-level learning resource, not an official NDLA product and not a teacher-issued assessment. Source references show conceptual grounding, not that a source contained the exact new question. Do not imply that the graph of 30 skills or the repetition intervals came from NDLA. Those are product-design choices.

## C01 · Grupper og perioder er byttet om i to setninger

Source location: F1, slide 4.

Issue: Presentasjonen beskriver først retningene riktig, men bytter deretter ordene grupper og perioder.

Teaching decision: Grupper er loddrette kolonner og perioder vannrette rader. Nedover en gruppe får atomene flere skall.

Source IDs: F1, N1, O2. Resolve titles and locations in sources.json.

## C02 · Klor sammenlignes med klor i NaCl-eksemplet

Source location: F2, slide 12.

Issue: Teksten sier at klor har høyere elektronegativitet enn klor.

Teaching decision: I dette eksemplet er sammenligningen klor mot natrium. Elektronet overføres fra natrium til klor.

Source IDs: F2, N3. Resolve titles and locations in sources.json.

## C03 · Nøytralitet og åtteregelen trenger avgrensing

Source location: F1, slide 1; F2, slide 8.

Issue: Formuleringer om like mange protoner og elektroner og åtte ytterelektroner er for generelle.

Teaching decision: Like mange protoner og elektroner gjelder nøytrale atomer. Hydrogen og helium har et fullt første skall med to.

Source IDs: F1, F2, O1, N1. Resolve titles and locations in sources.json.

## C04 · Grupperegler er ikke universelle ioneregler

Source location: F1, slide 5; N1, hovedgrupper.

Issue: Formuleringen om at andre grupper i liten grad danner ioner er for bred.

Teaching decision: Lær de spesifiserte vanlige mønstrene for gruppe 1, 2, 16 og 17. Ikke si at andre grupper aldri danner ioner. Avgrens ytterelektronregelen til hovedgruppene, med helium som unntak.

Source IDs: F1, N1, N3. Resolve titles and locations in sources.json.

## C05 · Elektronegativitetsgrenser og avrunding

Source location: F1, slide 7, bilde; F2, slide 10, bilde; N2.

Issue: F1 bruker en avrundet EN-tabell, mens vannbildet i F2 har mer presise tall. Grensene er skolemodeller.

Teaching decision: Bruk konsekvent F1-tabellen i elements.json. Oppgi alltid tallene i regneoppgaven. Bruk under 0,5; fra 0,5 til og med 1,7; over 1,7 som merket skolemodell, ikke som universell fasit for alle forbindelser.

Source IDs: F1, F2, N2, O3. Resolve titles and locations in sources.json.

## C06 · NOx skal ikke være en generell upolar eksempelgruppe

Source location: F2, slide 8.

Issue: NOx er oppført sammen med sikre eksempler på upolar elektronparbinding.

Teaching decision: Ikke lag en regel eller fasit om at alle NOx-forbindelser er upolare. Bruk H₂, N₂, O₂ og Cl₂ som enkle likeatomige eksempler. Molekylpolaritet må vurderes separat.

Source IDs: F2, N2, O5. Resolve titles and locations in sources.json.

## C07 · Metallioner står ikke bokstavelig helt i ro

Source location: F2, slide 15.

Issue: Den enkle modellen sier at positive metallioner står i ro.

Teaching decision: Si at metallionene vibrerer rundt plasser i fast metall, mens delokaliserte elektroner kan bevege seg gjennom stoffet.

Source IDs: F2, N4. Resolve titles and locations in sources.json.

## C08 · OH er ikke alltid en alkohol eller et hydroksidion

Source location: F3, slide 4; F5, funksjonelle grupper.

Issue: En regel som bare søker etter bokstavene OH vil feilklassifisere karboksylsyrer.

Teaching decision: Gjenkjenn funksjonell gruppe ut fra bindingene. Alkoholens OH er kovalent bundet. COOH er en syregruppe. Vannløselighet gjelder ikke likt for alle kjedelengder.

Source IDs: F3, F5, O7, O8. Resolve titles and locations in sources.json.

## C09 · Fettsyre, triglyserid og metning må skilles

Source location: F3, slides 5–6, inkludert bildene.

Issue: Slide 5 viser et triglyserid. Slide 6 sier bare enkeltbindinger om mettede fettsyrer. Hydrokarboneksemplene kan også gjøre olje og stearin uklare.

Teaching decision: Mettet gjelder bindinger mellom karbon i kjeden, ikke C=O i COOH. Fett og matolje består hovedsakelig av triglyserider, ikke frie fettsyrer eller bare hydrokarboner. Cis-knekk og pakking er en presiserende forklaring. Bruk ofte, ikke alltid, om fast eller flytende fett. Ikke bruk stearin som et sikkert eksempel på et rent hydrokarbon.

Source IDs: F3, F4, O9, O6. Resolve titles and locations in sources.json.

## C10 · To oppføringer er samme molekyl

Source location: F5, side 2, struktur og variasjon.

Issue: Isobutan og 2-metylpropan står som separate navn i byggearket.

Teaching decision: Bevar begge navn, men pek dem til samme målmolekyl. Det er 13 navneoppføringer og 12 unike byggeoppgaver.

Source IDs: F5, O6. Resolve titles and locations in sources.json.

## C11 · Propanol og korte syrer trenger presisering

Source location: F3, slide 4, bilde; F5, side 2.

Issue: Propanol er ikke spesifisert med plasseringen til OH. Metansyre og etansyre er korte syrer, ikke kursets lange fettsyreeksempler.

Teaching decision: Appens navngitte byggemål er propan-1-ol, i tråd med terminal OH i illustrasjonen. Vis at arket bare skriver propanol. Ikke hevde at en alternativ propanol-isomer er kjemisk umulig. Metansyre og etansyre brukes til å lære COOH-gruppen.

Source IDs: F3, F5, O7, O8. Resolve titles and locations in sources.json.

## C12 · Polaritet er ikke nettoladning og krever form

Source location: F1, slide 8; F2, slide 10; N7, introduksjonen til polaritet.

Issue: Formuleringer om ladning utad og lik deling i alle upolare molekyler kan misforstås.

Teaching decision: Bruk delvise ladninger og samlet dipol. Et polart nøytralt molekyl har null nettoladning. Upolare molekyler kan ha polare bindinger som opphever hverandre, som i CO₂.

Source IDs: F1, F2, N7, N8, O5. Resolve titles and locations in sources.json.

## C13 · Svake bindinger og kokepunkter trenger presise ord

Source location: F2, slide 16; F3, slide 7; N6–N7.

Issue: Van der Waals brukes ulikt, og generelle påstander om sterkeste kraft eller kokepunkt kan bli for absolutte.

Teaching decision: Dispersjonskrefter finnes mellom alle molekyler. Polare molekyler har flere bidrag. Hydrogenbinding er ikke enhver binding til hydrogen eller alltid den største totale tiltrekningen i enhver sammenligning. Ved vanlig koking av molekylstoffer bevares molekylene. Sammenlign størrelse og form når det er relevant.

Source IDs: F2, F3, N6, N7, O4. Resolve titles and locations in sources.json.

## C14 · Skallmodellen er avgrenset

Source location: F1, atommodellen; N1, illustrasjon med 20 grunnstoffer.

Issue: 2, 8, 8, 2 kan feiltolkes som en universell skallkapasitet.

Teaching decision: Bruk bare første 20 grunnstoffer i denne modellen. Ikke si at tredje skall alltid har maksimal kapasitet åtte. Ikke legg til tilfeldig nøytronantall eller runde atommasse for å finne det.

Source IDs: F1, N1, O1. Resolve titles and locations in sources.json.

## C15 · NDLAs ingress og hovedtekst bruker ulik sortering

Source location: N1, ingress og første hovedavsnitt.

Issue: Ingressen omtaler økende masse, mens hovedteksten korrekt forklarer atomnummer.

Teaching decision: Lær at dagens periodesystem er ordnet etter økende atomnummer. Vis en diskret kildemerknad, ikke to motstridende quizfasiter.

Source IDs: N1, O2. Resolve titles and locations in sources.json.

## C16 · Såpespørsmålet trenger tillegg om såpehoder

Source location: F4, avsluttende refleksjon.

Issue: Oppgaven nevner hydrogenbinding, men gir ikke en full forklaring på miceller eller såpens ioniske hode.

Teaching decision: Suppler med en tydelig merket forklaring: upolar hale, ladet COO−-hode og miceller. Skill hydrogenbinding mellom vannmolekyler fra særlig ion–dipol-samvirke ved såpehodet. Ikke tegn et nøytralt COOH-hode på den valgte såpemodellen.

Source IDs: F4, O10, N3, N6. Resolve titles and locations in sources.json.

## Deliberately outside the core course

Do not add orbital configurations, hybridization calculations, isotopic abundance calculations, reaction balancing, pH calculations, thermodynamic equations, aromatic nomenclature, a complete 118-element memorization course, diet or health advice, or practical chemical experiments. Naming “cis” once to explain packing does not authorize a stereochemistry unit. Knowing that a triglyceride has three fatty-acid residues does not require an esterification mechanism. Soap chemistry is included only because the final uploaded question asks for it.

## Numerical data

The first-20-elements dataset includes only the fields actually needed. It intentionally omits atomic mass, neutron counts, precise atomic radii and exact boiling points. Electronegativity calculations use the rounded course table from F1 slide 7 and print the values in the question. Noble-gas EN entries are null, not zero. The app may not combine these with the more precise values visible in the other slide deck. Comparisons about room-temperature phases assume ordinary room conditions and approximately atmospheric pressure; no precise temperature table is needed.

## Quality boundary

The pack’s machine checks validate internal references, counts, question structures, graph connectivity, valences and molecular formulas. They do not prove all pedagogical decisions effective or all future rendering and grading code correct. Codex must test the implemented site separately. Any unresolved content disagreement discovered during implementation must be reported and the affected question disabled or revised with a documented source, not guessed.
