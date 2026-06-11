# Novyl

A SaaS platform where authors collaborate with AI agents to write long-form novels chapter by chapter, with consistency maintained across hundreds of chapters.

## Language

**User**:
A person with an account who writes novels on the platform.
_Avoid_: Author (as account type), account holder

**Early access User**:
Any User on the platform during v1; open signup, no payment or usage limits apply.
_Avoid_: Beta user, tester, invite-only user

**Display name**:
The name a User provides at signup; shown in the UI.
_Avoid_: Username, full name, author name

**Account credentials**:
A User's email address and password used to sign in.
_Avoid_: Login, auth credentials

**Account deletion**:
Permanent removal of a User and all their data after the User confirms by typing their email address.
_Avoid_: Delete account, close account, deactivate

**Novel**:
One complete book — a single ordered manuscript from opening to ending.
_Avoid_: Project, book series, manuscript (when meaning the whole Novel entity)

**Archived novel**:
A Novel the User has removed from their main list; all data is kept and the Novel can be restored.
_Avoid_: Deleted novel, trashed novel, hidden novel

**Completed novel**:
A Novel the User has manually marked as finished; a reversible label that does not block adding Chapters or editing.
_Avoid_: Finished novel, novel complete, done writing

**Novel title**:
The name of the Novel; required at creation.
_Avoid_: Project name, working title

**Genre**:
The Novel's story genre; required at creation; chosen from presets or entered as custom text when **Other** is selected.
_Avoid_: Category, tag

**Genre preset**:
A predefined genre option in the creation UI (e.g. Fantasy, Science Fiction, Romance).
_Avoid_: Genre dropdown value, genre list item

**Writing language**:
The language the AI uses for **Chapter text**, **Chapter summaries**, and **Blurb** on a Novel; required at creation, chosen per Novel.
_Avoid_: Output language, novel language, locale

**Premise**:
The User's core story hook — setup, central conflict, and what the Novel is about at a glance; required at creation and always User-authored — AI never generates or rewrites it. Included in macro context for every generation alongside **Synopsis**.
_Avoid_: Premis (in English docs), logline only (premise may be longer than one line), pitch

**Synopsis**:
The User's full plot overview from beginning to end; required at creation and always User-authored — AI never generates or rewrites it.
_Avoid_: summary, pitch, back-cover copy (use **Blurb**)

**Blurb**:
Short marketing copy for the Novel (~100–150 words, minimal spoilers); optional, generated on User request, manually editable.
_Avoid_: Synopsis, back-cover copy (prefer Blurb)

**Character profile**:
A User-defined description of a story character (name, appearance, personality, secrets, relationships).
_Avoid_: Cast entry, persona

**Location profile**:
A User-defined description of a story setting or place.
_Avoid_: Worldbuilding doc, latar (in English docs)

**Chapter word count target**:
The intended word-count range for a Chapter; optional, User-authored, used as a soft guide for generation.
_Avoid_: Target word count, word limit, length setting

**Writing style notes**:
Optional free-text guidance per Novel for how the AI should write (tone, POV, pacing, things to avoid); User-authored; included in generation prompts, not stored in vector RAG.
_Avoid_: Writer preferences, style preset, learned preferences

**Chapter**:
One ordered section of a Novel's manuscript, written and completed sequentially.
_Avoid_: Bab (in code/docs use English), scene, episode

**Chapter outline**:
The planned beats and events for a Chapter before text is generated.
_Avoid_: Synopsis (novel-level), scene plan

**Chapter text**:
The full narrative story text of a Chapter — what the User reads and edits in the rich text editor.
_Avoid_: Chapter prose, draft, content, body, isi bab

**Chapter summary**:
A short distilled record of what happened in a Chapter, used for long-range story context.
_Avoid_: ai_summary, recap, abstract

**Prior chapter text**:
The entire **Chapter text** of the immediately preceding completed Chapter, used as a transition bridge when starting the next Chapter.
_Avoid_: Prior chapter prose, last N words, excerpt, tail context

**Recent chapter summaries**:
The **Chapter summaries** of the last 20 completed Chapters before the one being written; always included in full when gathering story context.
_Avoid_: Summary window, rolling summaries

**Retrieved chapter summaries**:
The top 10 older **Chapter summaries** pulled by relevance to the current **Chapter outline**; supplements **Recent chapter summaries** for deep history.
_Avoid_: RAG summaries, vector summaries, top-k

**Manual edit**:
A direct change the User makes by typing in the rich text editor, without AI involvement.
_Avoid_: Hand edit, direct edit

**Story memory sync**:
An explicit User action that refreshes a Chapter's **Chapter summary**, **Derived canon**, and **Chapter context snapshot** after **Chapter text** has changed.
_Avoid_: Update canon, sync canon, refresh memory

**Novel metadata**:
The Novel's declared global story bible — title, genre, premise, synopsis, optional character and location profiles, and blurb.
_Avoid_: Lorebook (use Declared canon), novel_metadata table

**Declared canon**:
Story facts the User intentionally sets via Novel metadata edits.
_Avoid_: Author intent, manual lore

**Derived canon**:
Story facts automatically extracted from written **Chapter text**.
_Avoid_: Inferred lore, Mem0 facts

**Chapter context snapshot**:
A frozen record of character and world state at the moment a Chapter was written or last finalized.
_Avoid_: Point-in-time state, snapshot row

**Scene**:
An internal generation unit that splits one Chapter's outline into a few sequential beats during writing; not a User-facing entity.
_Avoid_: Beat, segment, section (in UI)

**Scene plan**:
The Planner's internal breakdown of a Chapter into Scenes with word targets; not shown in the UI in v1.
_Avoid_: Scene outline, micro-outline

**Partial rewrite**:
An AI rewrite of a User-selected passage within **Chapter text**, guided by User feedback; the rest of the Chapter is left unchanged.
_Avoid_: Regenerate with feedback, paragraph edit, patch

**Full chapter regeneration**:
A complete AI rewrite of an entire **COMPLETED** Chapter from its **Chapter outline**, replacing all **Chapter text**.
_Avoid_: Regenerate chapter, rewrite chapter, redo chapter

**Chapter deletion**:
Removing a Chapter from a Novel; rules depend on Chapter status.
_Avoid_: Remove chapter, delete bab

**Stale chapter**:
A Chapter marked inconsistent because an earlier Chapter's text or **Chapter summary** changed after it was written.
_Avoid_: Out of sync, invalidated, dirty

**Outline drift**:
A **COMPLETED** Chapter whose **Chapter outline** was edited but whose **Chapter text** has not been updated to match.
_Avoid_: Outline mismatch, plan drift, out of sync outline

**Dismissed stale chapter**:
A **Stale chapter** the User has acknowledged and cleared from the active warning list until the upstream Chapter changes again.
_Avoid_: Ignored stale, accepted inconsistency

**Plot checkpoint**:
A paused moment during Chapter generation where the User approves, rejects, or redirects an irreversible story beat before text generation continues.
_Avoid_: HITL, human-in-the-loop, cliffhanger prompt

### Chapter lifecycle

**DRAFT**: Chapter slot exists (title optional); no outline yet.
**OUTLINED**: Chapter has an outline; ready to generate but not started.
**QUEUED**: Chapter generation is waiting for an available worker; queue position is shown in the UI.
**WRITING**: Chapter generation is in progress.
**COMPLETED**: Chapter text is saved and Chapter summary is written.

## Relationships

- A **User** owns one or more **Novels**
- A **Novel** contains an ordered sequence of **Chapters**
- A sequel or spin-off is a new **Novel** (not a volume inside an existing one)
- Restarting from scratch with the same premise creates a new **Novel**; archiving the previous one is optional
- A User may **archive** a Novel (hidden from main list, fully restorable) or **hard delete** it permanently
- **Hard delete** requires explicit confirmation by typing the **Novel title**; removes the Novel and all associated data (Chapters, story memory, vectors)
- **Archived novels** cannot be written to until restored; AI generation is blocked while archived
- A User may mark a Novel as a **Completed novel** at any time; marking is reversible and does not block new Chapters or edits
- Marking a Novel complete may prompt the User to generate a **Blurb** if one does not exist yet
- **Chapter** N may only enter **WRITING** when Chapter N−1 is **COMPLETED** (or N is the first Chapter)
- Required Novel inputs at creation: **Novel title**, **Genre**, **Writing language**, **Premise**, **Synopsis**
- **Genre** is chosen from **Genre presets** or custom text when the User selects Other; stored as a single string
- Required per Chapter before generation: chapter title and **Chapter outline** (User-authored)
- **Premise** and **Synopsis** are never AI-generated or AI-edited
- **Chapter text**, **Chapter summaries**, and **Blurb** are generated in the Novel's **Writing language**
- **Premise**, **Synopsis**, **Chapter outlines**, and profiles may be written in any language the User chooses; **Writing language** governs AI output only
- **Blurb** is generated on demand after at least one **COMPLETED** Chapter, using genre, synopsis, and **Chapter summaries**; User may edit the result manually
- **Character profiles** and **Location profiles** are optional and incremental; never required to start Chapter 1
- When provided, **Character profiles** and **Location profiles** are User-authored only — AI never auto-generates them
- **Chapter word count target** is optional: a Novel may have a default range; each Chapter may override it; if unset, the Planner infers length from the **Chapter outline**
- **Writing style notes** are optional per Novel, User-authored only, and included in AI generation prompts; no automatic learned preferences in v1
- Word count targets are User-authored only and are a soft guide (roughly ±20% is acceptable); generation does not fail if slightly off
- When generating Chapter N, Scene 1 uses **Prior chapter text** (full text of Chapter N−1), not a truncated excerpt
- Deep story history for generation uses **Recent chapter summaries** (last 20) plus **Retrieved chapter summaries** (top 10 by relevance) — not all summaries from Chapter 1 onward
- **Declared canon** (Novel metadata) takes priority over **Derived canon** when they conflict during new Chapter generation
- **Derived canon** fills gaps that Novel metadata does not cover
- Regenerating Chapter M uses only Chapter M's **Chapter context snapshot** — not current metadata or Derived canon
- User edits to Novel metadata may flag downstream Chapters as stale but do not auto-rewrite them
- **Premise** and **Synopsis** may be edited at any time; the User sees a warning before saving; all **COMPLETED** Chapters are flagged **Stale** afterward; no auto-rewrite
- **Chapter outline** may be edited on any Chapter except while **WRITING**; editing a **COMPLETED** Chapter's outline does not change its **Chapter text**
- A **COMPLETED** Chapter with an edited outline shows **Outline drift** until the User runs **Full chapter regeneration** or reverts the outline
- Editing outline alone does not flag later Chapters as **Stale**; stale flags apply after **Chapter text** or **Chapter summary** actually changes
- **Stale chapters** are warnings, not blockers — the User may generate the next Chapter while stale Chapters exist
- The User may **dismiss** a **Stale chapter** with confirmation; it becomes a **Dismissed stale chapter** until the upstream Chapter that caused the flag changes again
- The Novel shows a count of undismissed **Stale chapters**
- **Scenes** are ephemeral — merged into **Chapter text** on completion; not stored as separate User-visible entities
- The User sees one continuous text stream per Chapter, not per-Scene blocks
- Feedback and partial rewrites apply to selected text within **Chapter text**, not to individual Scenes
- If generation fails mid-Chapter, resume from the last completed Scene's text rather than restarting the Chapter
- **Manual edits** auto-save **Chapter text** but do not automatically refresh story memory
- The User triggers **Story memory sync** explicitly when manual edits are done; that re-summarizes the Chapter, refreshes **Derived canon**, updates the **Chapter context snapshot**, and flags later Chapters as **Stale** if any exist
- After a **Partial rewrite** on a COMPLETED Chapter: save text and automatically run the same refresh as **Story memory sync**
- If the edited Chapter has later Chapters, flag those as **Stale chapters**; do not auto-rewrite or delete them
- **Partial rewrites** are never blocked by the existence of later Chapters in v1
- **Full chapter regeneration** is available on any **COMPLETED** Chapter; blocked while that Chapter is **WRITING**
- **Full chapter regeneration** uses the current **Chapter outline** and that Chapter's **Chapter context snapshot**; on success it replaces **Chapter text** entirely (no version history in v1) and automatically runs **Story memory sync**, flagging later Chapters as **Stale**
- **DRAFT** and **OUTLINED** Chapters may be deleted freely
- A **COMPLETED** Chapter may be deleted only if it is the latest **COMPLETED** Chapter (the manuscript tail); its **Chapter text**, **Chapter summary**, **Derived canon** entries, and **Chapter context snapshot** are removed
- A **COMPLETED** Chapter with later **COMPLETED** Chapters cannot be deleted; the User must edit or regenerate instead
- **Plot checkpoints** are opt-in per Novel; default off
- When enabled, the Planner may flag at most one **Plot checkpoint** per Chapter, only for irreversible beats (death, revelation, relationship shift, major defeat or victory)
- At a checkpoint the User may **Approve**, **Reject** (AI replans), or **Edit** (free-text direction)
- **Reject** or **Edit** updates the **Chapter outline** before text generation continues; the choice becomes part of **Declared canon** for that Chapter
- Generation stays in **WRITING** until the User responds; no timeout in v1
- v1 has no payments, credits, or token quotas — **Early access Users** may use all AI features without restriction
- Signup is open: **Display name**, email, and password are required to create an account
- Sign-in uses **Account credentials** (email and password); no social or OAuth login in v1
- After signup the User can use the app immediately; no email verification or password reset in v1
- A User may request **Account deletion** by confirming their email address; this permanently removes all their Novels and associated data with no grace period in v1
- Re-registering with the same email after **Account deletion** creates a new empty account
- Operational guards (e.g. blocking duplicate generation while a Chapter is **WRITING**) still apply; they protect the system, not billing
- When all generation workers are busy, **OUTLINED** → **QUEUED** (with queue position shown) → **WRITING** → **COMPLETED**
- A Chapter in **QUEUED** or **WRITING** cannot be triggered again; a User may have at most one **QUEUED** and one **WRITING** Chapter at a time
- If a queued job fails, the Chapter returns to **OUTLINED** with an error message

## Example dialogue

> **Dev:** "The writer wants Book 2 of their fantasy trilogy — is that a new Novel or a continuation?"
> **Domain expert:** "New Novel. Each Novel is one complete book. We can link them later, but v1 treats them as separate manuscripts with separate memory."

> **Dev:** "Can they hit 'Write' on Chapter 10 while Chapter 8 is still a stub?"
> **Domain expert:** "No — generation is strictly sequential. They can plan ahead with DRAFT slots, but Chapter 9 must be COMPLETED first."

> **Dev:** "For the transition into Chapter 5, do we feed the model the last paragraph of Chapter 4?"
> **Domain expert:** "No — the entire Chapter 4 text. That's the bridge. Summaries handle everything further back."

> **Dev:** "User fixes a typo by hand. Does that re-summarize the chapter?"
> **Domain expert:** "No. Text auto-saves. They hit Story memory sync when they want the AI's memory updated."

> **Dev:** "User changed John's profile at Chapter 50, but Mem0 still says he's hopeful. What does Chapter 51 generation see?"
> **Domain expert:** "Declared canon wins — metadata says cynical, so cynical. Mem0 only fills what metadata doesn't say."

> **Dev:** "User regenerates Chapter 3 after editing characters at Chapter 50. Which character state applies?"
> **Domain expert:** "Chapter 3's snapshot only. Point-in-time, frozen. Current metadata and Mem0 stay out of it."

> **Dev:** "Should the writer approve the four-scene plan before prose streams?"
> **Domain expert:** "No — scenes are internal. They see one chapter stream. They edit prose after, not scene plans before."

> **Dev:** "User rewrites a paragraph in Chapter 12 so John dies, but Chapters 13–30 already exist. Now what?"
> **Domain expert:** "Allow it. Re-summarize Chapter 12, refresh derived canon, update its snapshot. Flag 13–30 as stale. User fixes forward manually."

> **Dev:** "AI wants to kill John in Chapter 40. Does it just do it?"
> **Domain expert:** "Only if plot checkpoints are off. If on, it pauses, asks the writer, and waits. Reject or edit updates the chapter outline first."

> **Dev:** "Can AI write the synopsis to get them started faster?"
> **Domain expert:** "No. Synopsis is always the writer's own. That's the spine of the whole novel."

> **Dev:** "Do they need to define every character before Chapter 1?"
> **Domain expert:** "No. Profiles are optional. Add them when you care about consistency; skip them and start writing if you want."

> **Dev:** "They hate all of Chapter 8. Start over?"
> **Domain expert:** "Yes — full chapter regeneration. Same outline, snapshot context, new text. Flag 9+ stale."

> **Dev:** "Can someone sign up with Google?"
> **Domain expert:** "Not in v1. Name, email, password. Open signup, no invite codes."

> **Dev:** "User writes the synopsis in English but wants the novel in Indonesian. Problem?"
> **Domain expert:** "No. Writing language is a separate Novel setting. AI output follows that; the user's inputs can be any language."

> **Dev:** "Can they delete Chapter 15 when Chapters 16–20 exist?"
> **Domain expert:** "No. Only the latest completed chapter, or draft/outlined slots. Otherwise regenerate or edit."

> **Dev:** "They want this novel gone forever."
> **Domain expert:** "Hard delete — type the novel title to confirm. Archive is the reversible option if they're unsure."

> **Dev:** "Do they need to verify email before writing Chapter 1?"
> **Domain expert:** "No. Sign up and go. No verification, no forgot-password flow in v1."

> **Dev:** "They rewrite the synopsis at Chapter 50 to change the ending. What happens to Chapters 1–49?"
> **Domain expert:** "Warn them, save it, flag 1–49 stale. They fix forward manually. Synopsis is never locked."

> **Dev:** "They change Chapter 8's outline but keep the existing text. Are Chapters 9–20 stale?"
> **Domain expert:** "Not yet. Chapter 8 shows outline drift. Stale flags come after they regen or edit the text."

> **Dev:** "Chapters 13–30 are stale. Can they still write Chapter 31?"
> **Domain expert:** "Yes — stale is a warning. They can dismiss individual chapters or fix forward when ready."

> **Dev:** "They marked the novel complete but want an epilogue next month. Blocked?"
> **Domain expert:** "No. Complete is a label they can unmark. They can still add and write chapters."

> **Dev:** "They clicked Write but the server is full. What status is the chapter?"
> **Domain expert:** "QUEUED — they see queue position. It moves to WRITING when a worker picks it up."

> **Dev:** "Can they delete their whole account?"
> **Domain expert:** "Yes — type their email to confirm. Everything goes. Sign up again later starts fresh."

## Flagged ambiguities

- Brief mentions "token quota" — resolved: out of scope for v1; no billing or credit system until post–early access.
- Brief lists "Premis" separately from Synopsis — resolved: v1 has both **Premise** and **Synopsis** as required User-authored core context; see `docs/ui/modals.md`.
- Brief offers AI-generated characters and world if empty — resolved: **Character profiles** and **Location profiles** are optional and User-authored only; no AI auto-draft in v1.
- Brief offers AI-generated target word count if empty — resolved: **Chapter word count target** is optional and User-authored only; Planner infers from outline when unset.
- Brief specifies OAuth via goth — resolved: v1 uses email/password only; see ADR-0001.
- Brief mentions PDF/EPUB export to R2 — resolved: no export feature in v1.
- Email verification and password reset — resolved: out of scope for v1; immediate access after signup.
- LLM model selection — resolved: fixed server-side per use-case tier; see ADR-0002.
- Brief Phase 1 pulls all prior chapter summaries — resolved: **Recent chapter summaries** + **Retrieved chapter summaries**; see ADR-0003.
- Brief stack (Go, FastAPI, Neon, Inngest, Qdrant, local Mem0, VPS) — resolved: TypeScript monolith + Supabase + Mem0 Cloud; see ADR-0004.
- Brief dual-token JWT (ADR-0001) — partially superseded: Supabase Auth sessions in ADR-0004; email/password and open signup unchanged.
- Brief mentions "preferensi penulis" in RAG — resolved: optional **Writing style notes** per Novel in prompts only; no preference RAG in v1.
- UI language — resolved: Indonesian UI in v1, i18n-ready strings; separate from **Writing language** (see brief §7).
- Retrieved summary count (top-k) — resolved: **10**; see ADR-0003.
