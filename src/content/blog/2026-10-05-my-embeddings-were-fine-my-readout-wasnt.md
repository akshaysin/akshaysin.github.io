---
title: "My Embeddings Were Fine. My Readout Wasn't. Then That Was Wrong Too."
pubDate: "2026-10-05"
description: "Frozen word embeddings failed a relation-extraction test, a supervised probe blamed the readout, and an order-aware probe then showed the probe had most likely been reading topic, not relations."
category: "Machine Learning"
heroImage: "../../assets/my-embeddings-were-fine-my-readout-wasnt-hero.webp"
heroImageAlt: "Two glass tubes hold the same five colored beads in opposite order; both feed one dark prism that emits a single identical teal beam."
draft: false
---

*Post 6 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/).*

I tried to pull relation structure out of frozen word embeddings: who works
for whom, what's located where, who owns what. The system failed its
preregistered gates on all five relation families I tested.

So I ran a diagnostic, and it gave me a comforting answer. A small supervised
probe, reading the same frozen features, cleared the transfer bar on 5/5
families. Even under a conservative statistical adjustment, the result was
`0.93` to `0.94`, against a bar of `0.65`. The
embeddings were fine, it said. The part reading them was broken.

Two diagnostics later, that answer was gone too. An order-aware probe that
*could* tell "A employs B" from "B employs A" scored direction accuracy of
exactly `0.0` on 4 of 5 families, across all 8 seeds. The first probe had most
likely been reading topic words. It had never been reading relations.

And one of the headline numbers in the original failure turned out to be a
measurement that no system could have passed. This post goes through all of
it, in the order it happened.

## A few terms first

An **embedding** is a list of numbers that stands in for a word. I used a
public FastText table: 300 numbers per word, trained by someone else on a lot
of English text, and **frozen**, meaning I never changed it. Words that show up
in similar contexts end up with similar vectors. That's the whole appeal: you
get a lot of knowledge about words for free.

A **relation family** is a type of relation between two things in a sentence.
I tested five: authorship, containment, employment, location and ownership.
Each test sentence had its two entities wrapped in marker tokens, `<m>` and
`</m>`, so the system knew *where* the two things were. Its job was to say
*which* relation connected them, or to abstain.

A **readout** is whatever turns a representation into an answer. This project
started out forbidding labels, so the readout was **unsupervised**: k-means
clustering grouped the sentence vectors into five clusters, and a small
held-out selection set was used only to decide which cluster meant which
relation. No training labels touched the representation.

A **probe** is a small model trained, *with* labels, on top of frozen
features. If a probe can pull a signal out, the signal is at least present in
the features. That's why people use them as diagnostics. As you'll see, "a
probe can find it" and "it's what you think it is" are different claims.

Two tests carried most of the weight:

- **Direction.** "The firm employs Alice" and "Alice employs the firm" use the
  same words and mean different things. A system that understands a relation
  has to care about which entity is which.
- **Distractors.** Some sentences mention two entities with no relation
  between them. The right answer is to abstain. Accepting one as a relation is
  a **false acceptance**.

Every gate had to pass on at least 7 of 8 seeds (a **seed** fixes the
randomness, so 8 seeds means 8 independent runs). Where five families were
tested at once, the bounds were **Holm-corrected**, a standard adjustment so
that testing five things doesn't give you five chances to get lucky.

## What I tried

The design was called ESCI Stage 1. The idea: take the frozen FastText vectors,
average them within each region of the sentence (before the first mention,
the first mention, between, the second mention, after), bind each region to
its role with **holographic reduced representations** (HRR, a way of attaching
a role vector to a content vector so the combination still fits in one
vector), and sum the result. If relation structure lived in those vectors,
sentences expressing the same relation should cluster together even when they
were worded differently.

The test that mattered most was **transfer**: a whole sentence template was
held back from everything except the final scoring. Recognizing a relation in
a phrasing you've never seen is the difference between understanding and
memorizing phrasing.

It looked reasonable because pieces of it had worked elsewhere. The binding
idea had passed a sealed confirmation on structured graphs (the subject of
*The One Mechanism Claim That Passed*). The open question was whether frozen
text embeddings could supply that structure from real sentences.

## Two runs I had to throw away first

The full evaluation was 400 jobs: 10 systems (the HRR candidate plus nine
controls), 5 families, 8 seeds. Before it produced a result I could read, it
was consumed twice as invalid.

**The first run** filtered every step down to a single relation. The readout
was supposed to fit five clusters across all five relations. Each job only saw
one, so a five-way mapping was being learned from one relation's data. That
can't mean anything, and the run was classified
`INVALID_ESCI_STAGE1_READOUT_CONFIGURATION`. The same review found six more
implementation defects, including a decision gate that was hard-coded to
`True`. Those were all repaired before the next run.

**The second run** failed in a way I still think about. The fixture renderer
glued the markers onto the neighbouring word, so a whitespace tokenizer saw
`<m>Name` as one token instead of `<m>` followed by `Name`. The composer, doing
exactly what the protocol said, looked for a standalone `<m>`, never found one,
and stayed in the "before the first mention" region for the whole sentence.
That happened on 728 of 728 records. Every mention region was empty.

With empty regions, binding a role to them does nothing. So the HRR candidate
and its entity-swap control became *the same computation*, and three other
controls collapsed into one as well. Gates that were supposed to test role
binding were comparing a thing with itself. The run completed cleanly, and my
Stage-0 checks for causality and determinism all passed, because a degenerate
decomposition is perfectly causal and perfectly deterministic. No check asked
whether a mention region was ever non-empty.

The fix was a leading and trailing space around each marker, a regenerated
fixture, and a new validator gate that fails if any mention region is empty.
After that, 0 of 728 records had an empty mention region, and the per-family
numbers finally started to differ from each other.

## Act 1: the embeddings look fine

The third, valid run still failed. The decision gate was `false` on every
family. Precision (how often an accepted answer was right) passed only for
employment, where the HRR candidate's mean was `0.773`. Ownership was `0.0`.
Direction accuracy was `0.0` for the candidate on every family. The candidate
didn't clearly beat its best control anywhere either: the mean gain in macro-F1
ranged from `-0.0697` to `+0.0006` across families.

The transfer gate also read `0.0` on every family. For a while that was the
headline number in my notes. It shouldn't have been, and I'll come back to it
in a moment.

So I asked a narrower question. Was the relation signal missing from the
embeddings, or was the unsupervised readout failing to find it? The diagnostic
drew a fresh set of records and compared four approaches on the same transfer
test:

| Approach | What it is | Families clearing `0.65` |
| --- | --- | ---: |
| B | Stage 1's own path: regional composition, HRR, k-means readout | 0/5 |
| A1 | Plain average of the frozen word vectors, then a trained linear layer | 5/5 |
| A2 | Stage 1's regional composition, then a small trained network | 5/5 |
| A3 | A tiny encoder trained end to end, no frozen table | 3/5 |

A1 is almost insultingly simple. It had `1,505` parameters and took about
`1.2` seconds to train across all 8 seeds. Its Holm-adjusted lower bounds were
`0.941` on four families and `0.930` on location. Because it scored identically
on every seed, those lower bounds equal its means.

The unsupervised path B was all over the place. On authorship it ranged from
`0.000` to `0.950` across seeds. Ownership was `0.000` everywhere.

The reading at the time was clean and it felt good: the embeddings carry
transferable relation information, and the k-means readout is picking up
topical variance instead of the relation signal. My embeddings were fine. My
readout wasn't.

### The gate that no system could pass

This diagnostic also caught something about Stage 1 itself.

Before scoring anything, it ran a hand-built **oracle**: a fake predictor that
simply returns the correct answer, built from the evaluator's own labels. A
perfect oracle should score `1.0`. Under Stage 1's scoring, it scored exactly
`0.200` on every family.

Two separate things caused that. Stage 1 scored each family on its own records,
then averaged F1 over all five relations. With only one relation present, the
other four contribute zero, so the best possible average is one fifth. And the
transfer filter checked for a template ID of `"t4"`, while every record was
tagged with its family name as well, like `"employment:t4"`. That comparison
never matched any of the 262 held-out-template records, so transfer F1 was `0.0`
by construction.

Please note what that means. Two of Stage 1's preregistered gates, macro-F1 of
at least `0.70` and transfer of at least `0.65`, could not have been passed by
*any* system, including a perfect one. The highest macro-F1 in all 400 jobs was
`0.190`, just under the ceiling. Stage 1's `0.0` transfer tells you nothing
about transfer.

The negative verdict still stands, because it doesn't rest on those two gates.
Direction was `0.0`, distractor rejection failed on every family, and
precision passed on one. Those were all reachable. But I'd been quoting the
wrong number as the headline, and the diagnostic fixed both scoring problems
before comparing anything.

## Act 2: fixing the input doesn't rescue the readout

If the readout was the bottleneck, maybe the cheap fix was to hand it a
cleaner input. Keep everything unsupervised, and change what goes into the
clusters so that relation signal dominates the variance.

The second diagnostic tried two changes on another fresh draw of records:
**entity masking** (replace both mentions with one shared placeholder vector,
so the clusters can't group by entity) and **common-component removal**
(subtract the single biggest direction shared by all the sentence vectors,
which often just encodes "this is a sentence"). It tested each one alone and
both together, with the same k-means readout.

No version cleared the bar on any family. Some came close on one family:
both changes together reached a mean of `0.824` on authorship on 7 of 8 seeds,
but its Holm lower bound was `0.550`, still short. Entity masking also did
real damage elsewhere. It pushed distractor false acceptance to `1.00`,
meaning every distractor was accepted as a relation, up from `0.52` for the
unmodified path.

So the second diagnostic agreed with the first. If anything was going to work,
it would be a trained readout, not a cleverer unsupervised input.

## Act 3: the probe was reading topic

This is the part that took the first answer away.

A1 averaged the word vectors before its linear layer. An average doesn't know
about word order. "The firm employs Alice" and "Alice employs the firm" have
exactly the same words, so they get exactly the same average, so A1 has to give
them the same answer. It cannot represent direction at all.

That raised an obvious question I should've asked in Act 1. If A1 can't see
order, what was it using to get `0.94`? The likely answer is topic. Employment
sentences use employment words, location sentences use place words. A probe can
learn "these words mean employment" without knowing anything about who did
what to whom.

The third diagnostic tested that directly with a probe that *can* see order: a
small **GRU** (a recurrent network that reads the sentence one token at a time,
left to right) with `15,301` parameters, fed the same frozen FastText vectors
in order and trained with labels.

I checked the GRU was genuinely order-sensitive before trusting it. Its
hand-written gradients matched numerical gradients to a relative error below
`1e-8`. And on a synthetic task where two classes had identical word averages,
so order was the *only* difference, it reached 100% training accuracy.
An order-blind model can't do that.

Then it failed the real test:

| Family | Direction accuracy (mean) | Distractor false acceptance (mean) |
| --- | ---: | ---: |
| Authorship | `0.000` | `0.580` |
| Containment | `0.125` | `0.674` |
| Employment | `0.000` | `0.594` |
| Location | `0.000` | `0.736` |
| Ownership | `0.000` | `0.580` |

The bars were direction accuracy of at least `0.75` and false acceptance of at
most `0.15`, each on 7 of 8 seeds. Four families scored exactly `0.0` direction
accuracy on every seed. Containment's `0.125` is one seed scoring `1.0` and
seven scoring `0.0`. On the reversed-order sentences, the probe confidently
named a relation instead of abstaining. No family passed either gate.

It was also worse than A1 on transfer, which I scored only for context. Its
means ranged from `0.000` on ownership to `0.651` on location. An order-aware
model had strictly more information available than an average and did worse,
which is what you'd expect if A1's score came from topic cues that ordering
only adds noise to.

## What the three acts add up to

Put together, the story shifted twice:

1. The unsupervised system fails. Two of its gates were unreachable, but
   the reachable ones fail too.
2. A supervised probe on the same features transfers well, so the readout
   looks like the problem.
3. An order-aware probe can't recover direction at all, so the first probe was
   most likely reading topic, not relation structure.

What I'd say now: this frozen embedding table carries topical relation-family
gist that a labelled probe can extract. It doesn't carry direction or
distractor structure that any of the bounded probes I tried could recover. The
family was closed after the third diagnostic, and so was the plan that depended
on it.

I want to be precise about scope. That's one GRU size, one training budget, and
one fixture design. A bigger encoder with hard-negative training on reversed
sentences could score differently. But at that point I'd be building a
standard supervised relation extractor, which is a solved problem and wasn't
the goal. Chasing it would've meant moving the goalposts to keep the project
alive, and my own stop rules forbid exactly that.

## What I'd do differently

**Run an oracle through every gate before scoring anything.** A perfect
predictor scored `0.200` on a `0.65` bar. That simple check would've caught
both scoring problems before three full runs were spent. If
the perfect answer can't pass your gate, the gate is broken.

**Assert that the mechanism actually fires.** The glued-marker run passed
causality and determinism checks with every mention region empty. After that,
every new mechanism family got a standing preflight: mention regions must be
non-empty on at least one record per family, and the candidate must produce a
different vector from its matched control on the same input. It's the same
lesson as *Zero Events Extracted*, from a different angle.

**Ask what a probe is capable of seeing before trusting what it finds.** A1
couldn't represent word order, so it couldn't have been using the thing I
credited it with. I should have asked that when I got the good number, not two
diagnostics later. A probe tells you a signal is present. It doesn't tell you
which signal.

**Treat a diagnostic's conclusion as a hypothesis for the next one.** Act 1's
conclusion was correct as far as it went. It localized the failure to the
readout. What it couldn't do was say the thing the readout was missing was
relation structure. Most of the damage came from me reading more into it than
it could hold.

This was the last mechanism family of the forward-only program. After it
closed, I changed the goal and allowed backpropagation back in, which is where
the next post picks up.

---

*Next: **192 GPU Cells to Learn My Harness Was Lying.** The pivot to bounded
continual learning, a grid that finished every cell and reported the wrong
configuration, and why I kept both runs.*
