# Engineer (Full-Stack, AI-Assisted) — Build Test

**Time:** ~6 hours of focused work. Take it across a few days if you like, but keep it to roughly six
hours and tell us honestly how long you spent. We'd rather know.

## Context

We build permit and licensing systems for public-sector clients. Every one of them is the same shapes
repeated — apply, review, approve, pay, renew, withdraw — across dozens of journeys and several
products.

A journey doesn't go from requirements to code in one leap. It goes through a chain:

> **raw requirements → business flowchart → technical flowchart → functional document → technical
> document → code**

Each artifact has a different reader. The business flowchart is signed off by council officers who
have never seen a database. The functional document is what the client agrees to. The technical
document is what an engineer — or an agent — builds from. If any link in that chain is vague, wrong,
or quietly drops a requirement, everything downstream inherits it, and nobody finds out until the
client does.

We produce that chain with AI agents. They are fast, and they are confidently wrong in ways that are
expensive to catch late.

**So there are two jobs here, and both of them are the role:** walk a journey down that chain
yourself, and then build the agent that walks the next one down it for you.

## What you're given

Two files, in `requirements/`:

- **`stories.md`** — the signed-off user stories and acceptance criteria.
- **`clarifications.md`** — everything that happened *after* sign-off. Emails and chat messages from
  Finance, Ops and the BA, pasted in raw and unedited. Some of it never made it back into the
  stories. Some of it is buried in messages that are mostly about something else. That is how it
  arrives here.

That's all. No schema, no API spec, no scaffold, no starter repo. You design the data model, you
choose the endpoints, you stand it up. That's deliberate — deciding what the system *is*, from
requirements written by four people who don't entirely agree with each other, is the job.

**Read both files properly before you write anything.** They do not agree. That is not an accident,
and it is not a typo you should quietly fix.

---

## Part 1 — Walk the chain (the journey: search, view, renew)

For **RC-1, RC-2 and RC-3** (search the register, view a permit, renew it), produce the four
artifacts. Use AI to produce them — that's how we work — but you own what they say.

**Do not do this for RC-4 (withdraw). You'll need it for Part 4.**

### 1a. Business flowchart

The journey as a **non-technical council officer** would understand it. Their world: screens,
decisions, actions, outcomes.

We will judge this by handing it to someone non-technical. If it contains an HTTP verb, an endpoint
path, a table name or a JSON field, it has failed — that is the *technical* flowchart's job, and
conflating the two is the single most common mistake we see.

### 1b. Technical flowchart

The same journey, for an engineer. Which system does what, which endpoint is called, what it reads
and writes, where the decisions actually get made, what happens on the unhappy paths.

### 1c. Functional document

What the system does, written for the client to sign off. Every acceptance criterion accounted for —
**including the ones that aren't in `stories.md`.** If a requirement is in scope, it's in here. If
you've decided it's out of scope, say so explicitly rather than letting it vanish.

### 1d. Technical document

What an engineer builds from with no other context: the data model, the endpoints and their
contracts, the business rules stated precisely enough to implement without guessing, the statuses and
what moves a permit between them.

**Format is up to you.** Mermaid, draw.io, plain markdown, hand-drawn and photographed — we don't
care, as long as the intended reader can read it. We care about whether the artifact does its job for
its audience, not what tool made it.

## Part 2 — Build the slice

Now build it: **React** staff portal, **Spring Boot** REST API, a database you designed. In-memory is
fine. Seed enough data to demonstrate the journey — and to demonstrate the rules, which is not the
same thing.

**Build from your own technical document, not from the requirements.** That is the point of the
exercise. If something isn't in your technical document, it shouldn't appear in your code. When you
find a gap in your own document while coding — and you will — go back and fix the document, then tell
us where the gaps were. **The gaps you found in your own artifacts are one of the most interesting
things you can report**, because that is exactly what an agent would have hit, silently, and not told
you about.

Utility over beauty. A plain screen that genuinely works beats a beautiful one that doesn't. If your
Spring Boot is rustier than your React, or the reverse, use AI to close the gap — that isn't cheating,
that's the job.

## Part 3 — Decide what is true (`ASSUMPTIONS.md`)

The stories and the clarifications contradict each other. Some requirements exist in only one place.
At least one question genuinely has no answer available to you.

Write `ASSUMPTIONS.md`:

- **Every conflict you found.** What each side says, and where.
- **What you decided was true, and why.** Not just the answer — the *rule* you used to get there.
- **What you assumed** where nothing told you the answer, and how you made that assumption visible in
  the artifacts and the code rather than burying it.
- **What you'd ask, and who you'd ask.** Some of this is not yours to decide.
- **What you suspect is wrong but couldn't confirm.**

We ship to clients who audit us. An engineer who silently resolves a contradiction in a *fee* rule in
favour of the wrong side has cost real money, and nobody finds out for a quarter. How you decide what
is true is the most transferable thing you can show us — more than any code in Part 2.

## Part 4 — Build the thing that builds it

You've now walked one journey down the chain by hand. We need fifty more.

**Build the AI agent (or agents) that does it.** Raw requirements in — the messy ones, as they
actually arrive — artifacts and code out.

How you design it is genuinely up to you, and **the design is what we're assessing.** One agent or
several? Does it produce every artifact in the chain, or do you think some of them are waste — and if
so, say which and why. Where does a human get to review, and where can they say no? What happens when
it hits a contradiction in the requirements — does it decide, or does it stop and ask?

And then the part that matters most:

**Build the check that catches it when the agent is wrong.** Two failure modes, and the second is the
dangerous one:

- It **invents** — a table, a column, an endpoint, a business rule nobody asked for. Plausible in
  review, wrong in production.
- It **silently drops** — an acceptance criterion goes missing somewhere down the chain, and every
  artifact after it looks perfectly coherent, because the requirement simply isn't there any more.
  Nothing looks broken. Nothing is flagged. This is how requirements die quietly at scale.

Ship something that **runs**, and that can say **no**, before a human reads a line of it.

**Prove it.** Point the whole thing at **RC-4 (withdraw a permit)** — the journey you did *not* walk
by hand. Show us the artifacts it produced, the code it produced, and what your check said about them.

We are not expecting a production-grade generator in six hours. We're expecting to see how you think
about making an AI-driven build **trustworthy at scale**, and enough of it actually running that we
believe you rather than take your word for it.

**If you think this whole approach is wrong** — that the chain is bureaucracy, that generating from
requirements is the wrong bet, that the checks belong somewhere else entirely — say so, and back it
with what you saw when you tried. We would rather hire someone who tells us we're wrong and is right
than someone who politely improves a bad idea. This is a genuine invitation and not a trap.

---

## Deliverables

1. **Repo** — GitHub link, full commit history (please don't squash).
2. **The four artifacts** from Part 1, committed.
3. **The running slice** from Part 2, with instructions. Deployed is a bonus, not a requirement.
4. **`ASSUMPTIONS.md`** — Part 3.
5. **Part 4** — the agent, the check, and everything it produced for RC-4. Committed, not described.
6. **`CLAUDE.md` / `AGENTS.md` / Cursor rules** — whatever you actually used to steer your AI tools.
7. **`DECISIONS.md`** covering:
   - What you built, what you deliberately skipped, and why.
   - Which artifacts in the chain earned their keep, and which you'd cut.
   - Where your own documents turned out to be wrong or incomplete once you started coding.
   - **How you stop an AI agent inventing things — and how you catch it silently dropping a
     requirement.** This is a real failure mode that costs us real money. We want your real answer,
     not a paragraph about careful prompting.
   - Where AI helped most, and where it got in your way.
   - What you'd do with another six hours.
   - One thing that surprised you.
8. **One AI conversation export** — paste or screenshot a session showing how you actually work.
   Planning, debugging, arguing with it. We're not looking for a clean one.

## What we are NOT testing

- **Volume.** Six hours is short on purpose. We'd rather read the reasoning behind your tradeoffs than
  skim more code.
- **Visual polish.** Nobody is scoring your CSS, or your diagram's colour scheme.
- **Diagramming tools.** Use whatever you like. We're reading the flowchart, not admiring it.
- **Stack knowledge.** Gaps are expected. Closing them fast, with AI, is the skill.
- **Whether you "finish."** Most candidates won't. An honest half-built thing with a clear-eyed
  `DECISIONS.md` beats a fake-complete one every time. If you ran out of time, say where, and say what
  you'd have done next.

## How we'll read it

The way a reviewer on our team would. We care less about clever code than about whether what you built
is **trustworthy** — and whether the way you built it would still hold on the fiftieth journey, built
by someone who isn't you, with an AI doing most of the typing.

**Submission:** send everything to [EMAIL]. We'll come back to you within 5 working days.
