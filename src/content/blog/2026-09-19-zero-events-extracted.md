---
title: "Zero Events Extracted"
pubDate: "2026-09-19"
description: "Two instrumented language pipelines completed normally while their routing front ends produced no useful events or almost no route coverage."
category: "Machine Learning"
heroImage: "../../assets/zero-events-extracted-hero.webp"
heroImageAlt: "A transparent pipeline shows green operating lights but feeds an empty vessel, while a magnifying glass reveals one amber particle."
draft: false
---

*Post 5 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/).*

Twice, I built a pipeline where the components passed their controlled tests,
the process finished normally, and the useful signal vanished right at the
front door.

In the first experiment, an autonomous router read real text and extracted
exactly zero semantic events. The downstream memory could answer both semantic
opportunities when an evaluator handed it the correct events, but the
autonomous system answered neither. In the later Phase-4A run, route discovery
had zero coverage in `23/24` jobs, and only `0.0214` coverage in the one job
left over.

Please note that the later execution was formally invalid, because a
persistence check failed. Its coverage numbers are diagnostic, not a scientific
verdict. A separate postmortem closed the mechanism family, because the same
collapse showed up on the corpora whose persistence checks were valid.

The lesson was an operational one: "the program ran" is not evidence that the
mechanism you care about took part.

## The difference between a component and a pipeline

A component test starts with the input the mechanism needs. Give a semantic
memory a clean fact, ask a matching question, and check whether it helps. That
can show the memory is capable of useful behavior.

A pipeline has a harder job. Raw text first has to be turned into the clean
event or route the component expects. If that upstream step emits nothing, a
perfect downstream mechanism might as well not be there.

Think of a water-treatment plant with excellent filters and a closed intake
valve. Every pump can be healthy. Every status light can be green. You still
end up with an empty tank.

This failure is especially easy to miss in machine learning, because a lot of
systems are allowed to **abstain** when they're uncertain. For a single
example, abstaining can be the safe choice. But a router that safely abstains
on everything has excellent caution and zero utility.

## The first empty intake

The first test used independently authored natural text. The model processed a
frozen prefix, then predicted a short continuation without changing its state.
Inside that continuation were two evaluator-identified opportunities where the
right semantic event could help.

The protocol itself passed all of its checks. Model state, baselines, router
and memories all stayed frozen during evaluation. Nothing crashed, and nothing
leaked from the answers into the model.

But the autonomous structural router extracted no events. None.

| Path | Overall accuracy | Semantic-opportunity accuracy |
| --- | ---: | ---: |
| Ordinary predictive paths | `0/6` | `0/2` |
| Autonomous semantic path | `0/6` | `0/2` |
| Evaluator-supplied event upper bound | `2/6` | `2/2` |

The upper bound is the row that matters. When the evaluator supplied the
correct events, the semantic memory used them successfully, and shuffling event
membership removed the gain. So the memory wasn't decorative, and the result
wasn't just a lucky answer pattern.

Keep in mind that this was a tiny causal diagnostic, not a corpus-scale
accuracy estimate. There were six continuation targets and two semantic
opportunities. Its job was to find the broken link, not to estimate how the
system would do in deployment.

And the broken link was upstream. Correct events were useful, but the
autonomous front end didn't expose any of them.

## A larger pipeline, the same silence

The later system tried to discover reusable relation routes in three real-text
corpora. Each corpus ran across eight seeds, so `24` jobs in total. The route
inducer was supposed to turn surface text into the structured paths used by the
one mechanism that had passed confirmation (the subject of the previous post).

It almost never did.

On `23/24` jobs, route coverage was exactly zero. One job reached `0.0214`,
which means the router covered only a tiny fraction of the opportunities it was
supposed to handle. The confirmed downstream mechanism got no meaningful
traffic.

This is where experimental bookkeeping matters. The run also checked whether
the same small set of controls came through a save-and-load cycle exactly. On
one corpus, those controls did not come back byte-for-byte unchanged after
persistence. So the execution was classified `INVALID_PHASE4A_EXECUTION` before
its scientific gates were interpreted. The run was consumed, and rerunning it
was forbidden.

What that means is `23/24` is not the formal result of Phase-4A. It's a
diagnostic observation inside an invalid execution. Calling it anything more
would turn an instrumentation clue into stronger evidence than the protocol
allows.

## Why the family still closed

Invalid doesn't mean uninformative. It means that execution can't carry the
planned verdict.

The postmortem separated the persistence defect from the routing failure. The
defect showed up on one corpus. Route discovery also collapsed on the two
corpora where persistence was valid. The candidate and its binding controls
ended up effectively identical, because almost no routes were discovered for
any of them.

That evidence couldn't rescue Phase-4A or formally rerun it. What it could
answer was a different decision: was there a plausible repair that justified
continuing this mechanism family? The answer was no. The persistence bug
couldn't explain away the empty routing on the unaffected corpora, so the
family closed by a separate postmortem decision.

That distinction is worth keeping sharp:

- The execution verdict was **invalid**.
- The coverage collapse was **diagnostic**.
- The decision to stop came from a **separate causal postmortem**.

Those are three different statements, even though they all point the same way
in practice.

## Why a clean run can do nothing

My monitoring was originally much better at catching broken computation than
absent computation. It could tell me that arrays had the right shape, values
were finite, resources stayed bounded, and the run completed. Those are all
useful checks. None of them asks whether the central mechanism fired often
enough to matter.

Aggregate prediction metrics can hide the problem too. A fallback predictor can
keep producing outputs while the specialist route abstains. From the outside,
the system looks busy. On the inside, the experiment may have quietly reduced
itself to the fallback baseline.

The fix is to treat mechanism participation as a measurement in its own right:

- How many eligible inputs were seen?
- How many events or routes were emitted?
- How often did the specialist abstain?
- How much of the final score came from the fallback?
- Did controls receive the same opportunities?

These aren't debugging curiosities. If the research claim depends on a route,
coverage is part of the claim.

## What I'd do differently

I'd add a minimum-activity gate before any expensive downstream evaluation. If
a router emits nothing on a representative development stream, stop right
there. Don't spend seeds proving that a component nobody uses has no
system-level effect.

I'd log the path of every prediction at a useful aggregate level: specialist,
fallback or abstention. A single final accuracy number should never be able to
hide an empty mechanism.

I'd also test serialization as an operational preflight, before consuming a
one-shot experiment. Exact persistence was part of the contract. Finding that
failure inside the scored execution made the whole run invalid, even though the
more interesting diagnostic was somewhere else.

Finally, I'd keep upper bounds close to autonomous tests. The
evaluator-supplied events answered the question the zero count couldn't: was
the downstream idea broken, or just starved? That one comparison turned
"nothing happened" into a specific diagnosis.

A pipeline isn't the sum of components that work in isolation. It's the chain
of handoffs between them. Measure the handoffs, or you risk building a spotless
machine around an empty pipe.

---

*Next: **My Embeddings Were Fine. My Readout Wasn't. Then That Was Wrong
Too.** A supervised readout briefly made the embeddings look fine, until the
next diagnostic took that conclusion away.*
