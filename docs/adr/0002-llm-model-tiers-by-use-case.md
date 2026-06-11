# LLM model tiers by use case

v1 uses a fixed server-side model per tier via OpenRouter — no User-facing model picker. Tasks are grouped by what they need from a model, not by brand.

## Tier 1 — Long-form narrative generation

**Use cases:** Chapter scene writing (Ghostwriter), full chapter regeneration.

**Criteria:**
- Strong long-form prose quality (voice, pacing, sensory detail)
- Reliable adherence to supplied canon (Declared canon, Derived canon, Prior chapter text, Chapter outline)
- Large effective context window — macro context plus full prior chapter plus rolling scene text adds up fast
- Stable continuation over multi-step generation (Scene 1 → 2 → 3 without drift)
- Streaming support with low time-to-first-token

**Why a premium tier:** This is the product surface. Weak prose or canon drift here defeats the purpose of the platform.

## Tier 2 — Constrained narrative editing

**Use cases:** Partial rewrite (selected passage + User feedback), Blurb generation.

**Criteria:**
- Good prose, but shorter output than Tier 1
- Strong style matching — partial rewrite must blend with surrounding Chapter text the User did not select
- Instruction following — User feedback is explicit and local ("make this tenser", "less dialogue")
- For Blurb: hook-writing, minimal spoilers, marketing tone without inventing plot

**Why separate from Tier 1:** Shorter I/O and a tighter instruction-following task. Can use a slightly cheaper model if it matches voice well; quality still matters for partial rewrite.

## Tier 3 — Structural planning

**Use cases:** Scene-by-scene planning (3–4 beats per Chapter), plot checkpoint proposals.

**Criteria:**
- Strong reasoning and plot logic — decompose Chapter outline into paced beats with word targets
- Structured output — scene plans are machine-consumed, not shown to the User
- Judgment about irreversible beats (death, betrayal, revelation) when plot checkpoints are enabled
- Does not need literary flourish — clarity and structure over prose style

**Why its own tier:** Planning is a reasoning task, not a writing task. Models strong at prose are not always best at beat sheets; structured output reliability matters more than voice.

## Tier 4 — Compression and extraction

**Use cases:** Chapter summary (post-generation and Story memory sync), Derived canon / entity updates (Mem0).

**Criteria:**
- Factual fidelity — no invented events, characters, or states
- Reliable condensation — Chapter summary as 3–5 accurate plot points
- Entity and state tracking — who changed, what was lost, relationship shifts
- Cost-efficient — runs after every Chapter completion and every sync; high call volume, relatively short I/O

**Why the cheapest adequate tier:** Errors here poison all future Chapters (wrong summary in context window, wrong Derived canon). Accuracy matters more than creativity; hallucination is the main failure mode.

## Routing summary

| Tier | Use cases | Optimize for | v1 model |
|------|-----------|--------------|----------|
| 1 | Ghostwriter, full chapter regen | Prose quality, long context, canon adherence | `gemini-2.5-flash` |
| 2 | Partial rewrite | Voice matching, boundary constraints | `gemini-2.5-flash` |
| 2 | Blurb | Short creative output, low rule density | `gemini-2.5-flash-lite` |
| 3 | Scene planning, plot checkpoints | Reasoning, structured JSON beats | `gemini-2.5-flash` |
| 4 | Chapter summary | Fidelity, compression | `gemini-2.5-flash-lite` |
| 4 | Derived canon / Mem0 extraction | Entity tracking, negative constraints | `gemini-2.5-flash` |

Split Flash vs Flash-lite by **instruction pressure**, not prose quality alone. Flash-lite prose can match Flash on simple prompts, but drops rules under dense system prompts and multi-step constraints — which describes Tier 1, partial rewrite, scene planning, and Mem0 extraction.

## Context window sizing (estimates)

Rough token math (~1.3 tokens/word). Default chapter ≈ 1,500–2,000 words. Chapter summary ≈ 200–400 tokens each.

### What goes in the prompt (by tier)

| Input block | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|-------------|--------|--------|--------|--------|
| Synopsis | ✓ | Blurb only | ✓ | — |
| Chapter outline | ✓ | Partial rewrite | ✓ | ✓ (summary only) |
| Character / location profiles | ✓ | Snippet | ✓ (relevant) | — |
| Prior chapter **full text** | ✓ | — | ending beat only | — |
| Rolling scene text (in-chapter) | ✓ (scenes 2–4) | — | — | — |
| Chapter summaries (history) | ✓ | Blurb | ✓ (subset) | — |
| Derived canon / Mem0 state | ✓ | — | ✓ | ✓ (extraction) |
| Qdrant RAG chunks | ✓ | — | ✓ | — |
| Selected passage + feedback | — | ✓ | — | — |
| Full chapter text (current) | — | surrounding ctx | — | ✓ |

### Estimated input size by novel progress

**Tier 4 — Summary extraction**
- Input: current Chapter text (2–5k) + outline (~500)
- **Total: ~3–6k** → **8k window is enough**; 16k is comfortable

**Tier 4 — Derived canon / Mem0 update**
- Input: Chapter text (2–5k) + existing entity state (2–8k, grows slowly)
- **Total: ~5–15k** → **16k window minimum**

**Tier 2 — Partial rewrite**
- Input: selection (0.5–2k) + surrounding paragraphs (1–3k) + feedback (~200) + light canon (~1–2k)
- **Total: ~3–8k** → **16k window is enough**

**Tier 2 — Blurb**
- Input: synopsis (1–3k) + chapter summaries (grows with novel: 5k @ ch20 → 25k @ ch100)
- **Total: ~6–30k** → **32k** early novel; **64k** if pulling many summaries at ch100+

**Tier 3 — Scene planning**
- Input: synopsis + outline + profiles + Mem0 + RAG + recent summaries (no full prior chapter required — ending beat from summary or last ~500 words is enough)
- **Total: ~12–25k** early → **~25–40k** at ch50–100
- **32k** works early; **64k** safer for mid-length novels

**Tier 1 — Ghostwriter (heaviest)**
- Fixed macro: synopsis (1–3k) + profiles (0–8k) + Mem0 (2–8k) + RAG (2–6k) + outline (~1k) ≈ **10–25k**
- Prior chapter full text: **+2–5k** (always)
- All prior summaries (N−1 chapters × ~300 tokens):
  - ch10: ~3k | ch30: ~9k | ch50: ~15k | ch100: ~30k | ch200: ~60k | ch500: ~150k
- Rolling scenes within chapter: **+0.5–2k** (scene 4 of 4)
- Output per scene call: ~500–800 tokens

| Novel progress | Tier 1 input (naive: all summaries) | Recommended model window |
|----------------|-------------------------------------|--------------------------|
| ch1–10 | ~18–30k | 32k |
| ch11–50 | ~30–50k | 64k |
| ch51–120 | ~50–80k | 128k |
| ch120+ | 80k+ (all summaries alone can exceed 100k) | 128k + **summary retrieval** |

### Summary accumulation problem

The brief's Phase 1 pulls all `ai_summary` rows from prior chapters. That works until ~chapter 100–150 on a 128k model, then breaks without a retrieval strategy.

**Recommended context policy (not all-summaries-forever):**
1. **Always include:** synopsis, profiles, Mem0 state, RAG top-k, current chapter outline, **full prior chapter text**, rolling scene text
2. **Recent window:** last 20 chapter summaries (always)
3. **Deep history:** RAG over embedded chapter summaries in pgvector (top 10 by relevance to current outline)
4. **Never in prompt:** raw text of chapters older than N−1 (summaries + RAG replace them)

This keeps Tier 1 input roughly **30–50k tokens flat** regardless of chapter 50 or 500.

### Minimum model window by tier

| Tier | Minimum | Comfortable | Notes |
|------|---------|-------------|-------|
| 4 | 8k | 16k | Cheapest models usually fine |
| 2 (rewrite) | 16k | 16k | Small fixed window |
| 2 (blurb) | 32k | 64k | Grows with novel length |
| 3 | 32k | 64k | No full prior chapter needed |
| 1 | 64k | 128k | With summary retrieval policy; naive all-summaries needs 128k+ and still breaks at ch200+ |

## Model routing — Gemini 2.5 Flash family (v1 default)

Pricing via OpenRouter:

| Model | Input | Output |
|-------|-------|--------|
| `google/gemini-2.5-flash` | $0.30/M | $2.50/M |
| `google/gemini-2.5-flash-lite` | $0.10/M | $0.40/M |

### Why Flash and Flash-lite split

Early-access prose tests showed near-parity on **simple creative prompts**. Under production load, Flash-lite degrades on:

- Long, dense rule sets (canon priority, writing language, word targets, negative constraints)
- Structured JSON output (scene plans)
- Entity extraction with "do not invent facts" guardrails

Flash is assigned wherever instruction adherence failure would break the product. Flash-lite is assigned where the task is short, low-constraint, and high-volume.

### Per use case

| Use case | Model | Rationale |
|----------|-------|-----------|
| **Ghostwriter** (4 scene calls) | **Flash** | Heaviest rule stack: Declared > Derived canon, prior chapter text, outline, writing language, word targets, voice continuity across rolling scenes |
| **Full chapter regeneration** | **Flash** | Same rule stack as ghostwriter |
| **Partial rewrite** | **Flash** | Negative constraints: rewrite selection only, preserve surrounding voice, follow User feedback literally |
| **Scene planning** | **Flash** | Structured JSON beats + word targets; plot checkpoint judgment |
| **Plot checkpoint proposal** | **Flash** | Conditional logic on irreversible beats |
| **Derived canon / Mem0 extraction** | **Flash** | Entity/state diffing with strict no-hallucination rules |
| **Chapter summary** | **Flash-lite** | Single-shot compression; few constraints; runs every chapter — cost-sensitive |
| **Blurb** | **Flash-lite** | Short creative output; on-demand; lower instruction pressure |
| **Story memory sync** (re-summarize) | **Flash-lite** | Same as chapter summary |

Sonnet-class models are not v1 defaults. Reserve for manual A/B or post-v1 premium tier.

### Estimated tokens per Chapter (with summary retrieval policy)

| Step | Model | Calls | Input | Output |
|------|-------|-------|-------|--------|
| Tier 3 — scene planning | Flash | 1 | ~25k | ~1k |
| Tier 1 — ghostwriter | Flash | 4 | ~35k each ≈ **140k** | ~2.8k |
| Tier 4 — chapter summary | Flash-lite | 1 | ~4k | ~0.4k |
| Tier 4 — derived canon / Mem0 | Flash | 1 | ~8k | ~0.5k |
| **Total per Chapter** | | 7 | **~177k** | **~4.7k** |

### Cost scenarios (USD per Chapter)

| Routing | Input | Output | **Total** |
|---------|-------|--------|-----------|
| **Hybrid (v1)** — Flash on T1/T3/Mem0, Lite on summary | $0.045 | $0.011 | **~$0.056** |
| All Flash-lite | $0.018 | $0.002 | ~$0.02 |
| All Flash | $0.053 | $0.012 | ~$0.065 |
| All Sonnet ($3 / $15 per M) | $0.53 | $0.07 | ~$0.60 |

Hybrid saves ~15% vs all-Flash while keeping rule-heavy steps on Flash. All-Lite is cheapest but risks canon drift, broken JSON plans, and invented entities in Mem0.

Early-access burn (hybrid, ~$0.056/chapter):
- 1 user × 20 chapters ≈ **$1.12**
- 10 users × 15 chapters each ≈ **$8.40**
- 1 heavy user × 100 chapters ≈ **$5.60**

Enable **prompt caching** on the stable macro prefix across the 4 ghostwriter scene calls when the provider supports it — Tier 1 dominates cost.

**Validate before ship:** multi-chapter canon adherence test on Flash with full production system prompt, not single-prompt prose comparison.
