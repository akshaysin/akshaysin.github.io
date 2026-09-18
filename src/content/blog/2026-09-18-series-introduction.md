---
title: "Nine Posts About a Language Model That Didn't Work"
pubDate: "2026-09-18T19:30:00+05:30"
description: "Series introduction: what I set out to build, where it actually stands, and why I am publishing the failures with their numbers."
category: "Machine Learning"
heroImage: "../../assets/series-introduction-hero.webp"
heroImageAlt: "Nine experiment cards form a path across a dark workbench; several are crossed out, one shows a surviving teal signal, and the final card branches into unresolved paths."
draft: false
---

*Post 0 of a series on a language-model research program that didn't work.*

---

I wanted a small language model that keeps learning after you deploy it. Not
fine-tuning, not retraining — a model that reads something new on Tuesday,
remembers it on Friday, and does that forever inside a fixed memory budget.

I did not build it. This series is the record of not building it, in eight posts
plus this one, with the numbers attached.

I'm writing it because the useful part of a research program is rarely the part
that worked. Almost nobody publishes the run that got thrown out, the metric
that couldn't measure its own name, or the moment they discovered their control
condition scored the same as their contribution. Those are the parts I'd have
paid to read three years ago, so those are the parts that are here.

## The problem, in one paragraph

Most deployed foundation models learn in large training runs and then stop.
You can fine-tune them, but continuous updates on a stream tend to overwrite
what the model already knew — catastrophic forgetting, one of the field's
oldest problems. And conventional end-to-end backpropagation is heavy: errors
flow backward through the network, intermediate state must be retained or
recomputed, and adaptation needs training-time machinery. If you want a model
that adapts on a laptop, on a phone, or on a device that never phones home,
none of that is convenient.

So: can something smaller learn continuously, on a bounded memory budget,
without the heavy machinery? That's the north star. Everything in this series is
an attempt at some part of it.

## Two attempts

**Attempt one was forward-only.** No backpropagation at all — only *local*
learning rules, where updates are driven primarily by activity available at
the two ends of a connection, sometimes with a local modulatory signal.
Hebbian learning and its relatives. The appeal is that there's no backward
pass to run, so continuous learning can be cheaper by construction. Posts 1
through 6 cover this, from a
learner that worked for reasons that weren't mine, through a model that lost to
a unigram, through the one mechanism that genuinely passed a sealed test, to two
mechanism families closing.

**Attempt two put backprop back.** If the constraint "no gradients" isn't
buying anything, drop it and keep the constraint that actually matters: a hard
budget on how much state the model may carry. That's bounded continual learning,
built on Pythia-160M, and it's posts 7 and 8. It produced the most rigorous work
in the program and also a clean null result.

## Where this actually stands

**As of 18 September 2026**, which is when I froze the facts for this series:

- The **forward-only** program is closed.
- The **ESCI embedding-supported mechanism family** that followed it is closed.
- **Bounded continual learning is not closed.** It has a locked baseline, a
  disclosed null result on the storage question, and no accepted candidate.
  Whether it continues is an open decision, not a foregone one.

I'm being precise about that because "my research program failed" is a tidier
story than the true one, and the true one is that a specific set of mechanisms
failed while the underlying question is still open. A research record moves;
a published post doesn't. If you find this later, check the dates.

## What's in the eight posts

**1. I Chose a Learning Rule Twice. A Random One Would Have Done.** Building a
backprop-free learner, comparing three local rules, picking a winner on one
seed, watching a ten-seed rerun reverse the result — and then, two phases later,
discovering that a frozen *random* layer scored about the same as the rule I'd
selected. The scorer on top had been doing the work all along.

**2. My Results Were Real. My Claims Weren't.** I audited my own passing
benchmarks adversarially. Test accuracy of `0.800` became `0.150` once
evaluation was genuinely frozen — below the chance floor. Five distinct ways I'd
been overstating my evidence, including a forgetting curve that was structurally
incapable of detecting forgetting. Every number reproduced perfectly, which is
the point: reproducibility is orthogonal to validity.

**3. A Unigram Beat My Language Model.** The first properly sealed test on real
text. My frozen learned features comfortably beat matched random features —
`5.4996` against `7.2103` NLL — and then lost to counting word frequencies
(`5.3582`). Beating random is easy. Beating counting is not. What survived was a
small complementary signal, and this post is also about what a sealed test is
and why you only get to run one once.

**4. The One Mechanism Claim That Passed.** Not everything failed. A binding
mechanism cleared a sealed confirmation across four distinct graph structures
and eight seeds, winning every control comparison. This is the post where I'll
be least specific about internals, for reasons I explain below.

**5. Zero Events Extracted.** Two pipelines that appeared operational and did
nothing useful. One extracted zero events from real text after passing every
controlled test I'd built. The other execution was formally invalid before its
coverage was read, but its diagnostic was still stark: zero route coverage in
23 of 24 jobs. On instrumentation that can tell "working" from "silently
empty."

**6. My Embeddings Were Fine. My Readout Wasn't. Then That Was Wrong Too.** A
three-act diagnostic. The failure localizes to the readout, not the features —
a supervised probe on the same frozen features clears the bar easily. Then a
follow-up suggests that supervised success was exploiting word co-occurrence
rather than real structure, which un-localizes it again. Sometimes the diagnostic
that explains your failure is itself wrong.

**7. 192 GPU Cells to Learn My Harness Was Lying.** The pivot to bounded
continual learning. The first full grid completed every cell and reported that
its configuration matched what I'd selected. It hadn't — it had silently run the
wrong number of updates per regime. The repaired rerun then failed its stability
gate in 18 of 24 groups. Why I kept both runs instead of deleting them.

**8. One Learning Rate Fixed the Baseline. Storage Still Came Back Null.** A
calibration screen found the real culprit: one inherited learning rate. Fixing
it produced a stable, credible baseline that passed every gate. Then the
interesting result didn't arrive — extra memory bought no measurable benefit,
and the final precommitted diagnostic returned `NO_RATE`. A clean baseline with
nothing to beat it.

## Ground rules

**On numbers.** Every figure in these posts traces back to a locked result
artifact or an exact line in the project's experiment log. I keep a separate
evidence file per post mapping each one, mostly so that I can't quietly round a
number toward the story I want. Where a figure couldn't be traced, it got cut
rather than softened. One casualty: I originally wrote that the audit cost me
"three months of results," then discovered the repository's history doesn't
record when that work started. So the series contains no timelines.

**On what I'm holding back.** The failures are specified completely — mechanism,
configuration, exact numbers. Vagueness about a failure would make it useless to
you and unverifiable besides. Two things are deliberately described only by
behavior and result: the one mechanism that passed its sealed confirmation, and
the bounded continual-learning candidate that hasn't been scored yet. I'll tell
you what they do and what they measured. I won't give you enough to rebuild
them. I'd rather say that plainly than pretend the gaps aren't there.

**On tone.** These are failure posts, but they're not confessional. Each one
states what it tried, what it measured, why it broke, and what the transferable
lesson is. I'm not interested in performing humility, and I'd ask you not to
read the negative results as a claim that the underlying ideas can't work —
several of them fail in ways that narrow the search rather than closing it.

## The one thing, if you read nothing else

The invalid results that forced the program's first reset were reproducible.
Same seeds, same container, same outputs, every time. My version pinning and
determinism were excellent and they protected me from nothing, because a
deterministic pipeline with a contaminated evaluation reproduces its
contamination perfectly, forever.

Reproducibility means your result is stable. It says nothing about whether it's
true. I had spent years believing those were closer together than they are.

Start with [post 1: **I Chose a Learning Rule Twice. A Random One Would Have
Done.**](/blog/2026-09-18-learning-rule-that-didnt-matter/), or jump to
whichever failure sounds most like one of yours.

---

*Next: [**I Chose a Learning Rule Twice. A Random One Would Have
Done.**](/blog/2026-09-18-learning-rule-that-didnt-matter/)*
