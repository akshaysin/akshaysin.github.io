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

I wanted a small language model that keeps learning after you deploy it. I don't
mean fine-tuning or retraining it every few weeks. I mean a model that reads
something new on Tuesday, still remembers it on Friday, and keeps doing that
forever inside a fixed memory budget.

I did not build it. This series is the record of not building it, in eight posts
plus this one, with the numbers attached.

So why write about it? Because in my experience the useful part of a research
program is rarely the part that worked. Almost nobody publishes the run that got
thrown out, the metric that couldn't actually measure the thing it was named after, or the moment they found
out their control condition scored the same as their contribution. Those are the
parts I'd have paid to read three years ago, so those are the parts you'll find
here.

## The problem, in one paragraph

Most deployed foundation models learn in large training runs and then stop.
You can fine-tune them, but if you keep teaching them new material, it can
overwrite what they already knew. Machine-learning folks call this **catastrophic
forgetting**. Think of it as revising a document by writing every new paragraph
over an old one.

The usual way to train a neural network is **backpropagation**. The model makes
a prediction, measures how wrong it was, and sends that error backward through
its layers so each connection can be adjusted. It works extremely well, but it
also needs training-time computation and temporary state. Now if you want a model
that adapts on a laptop, a phone, or a device that never phones home, all that
machinery is not always convenient.

So here's the question: can something smaller learn continuously, on a bounded
memory budget, without the heavy machinery? That was my north star. Everything in
this series is an attempt at some part of it.

## Two attempts

**Attempt one was forward-only.** No error signal travelled backward through
the whole model. Each connection changed using only the information available
near that connection: what arrived, what fired, and sometimes one simple feedback
signal. These are called *local learning rules*. What I liked about them is that
there is no full backward pass to run, so continuous learning can be cheaper by
design. Posts 1 through 6 cover this. It goes from a learner that worked for
reasons that weren't mine, to a model that lost to a unigram, to the one mechanism
that genuinely passed a sealed test, and finally to two mechanism families closing.

**Attempt two put backprop back.** If banning it wasn't buying me anything, I
could drop that restriction and keep the one that actually mattered: the learner
gets a fixed amount of memory, and that allowance can't quietly grow as more data
arrives. That's what I mean by **bounded continual learning**. I tested it on a
small existing language model called Pythia-160M. Posts 7 and 8 cover that work.
It produced the most rigorous experiments of the whole program, and also a clean
null result: the effect I was looking for did not show up.

## Where this actually stands

**As of 18 September 2026**, which is when I froze the facts for this series:

- The **forward-only** program is closed.
- The **ESCI embedding-supported mechanism family** that followed it is closed.
- **Bounded continual learning is not closed.** It has a locked baseline, a
  disclosed null result on the storage question, and no accepted candidate.
  Whether it continues is still an open decision.

I want to be precise about that. "My research program failed" is a tidier story
than the true one. The true one is that a specific set of mechanisms failed, while
the underlying question is still open. Also keep in mind that a research record
moves and a published post doesn't. If you're reading this later, check the dates.

## A few terms first

These terms come up again and again in the series, so let's get them out of the
way:

- A **baseline** is the simpler approach the proposed system must beat. A
  **control** removes or replaces one part of the system to find out whether
  that part caused the result.
- A **seed** is a repeat of the experiment with a different controlled random
  starting point. If a result disappears across seeds, it may have been luck.
- A **gate** is a pass/fail rule written for an experiment. Passing a gate says
  the measured system met that rule. It does not automatically prove every
  component was useful.
- A **readout** or **probe** is a small predictor placed on top of a model's
  internal features. It asks, "is the information present in a form this
  predictor can use?"
- **NLL**, or negative log-likelihood, measures how much probability a language
  model assigned to the correct next token. Lower is better.
- A **unigram** model ignores word order and predicts from how often each word
  appeared. It's simple, but surprisingly hard to beat on some small tests.
- In a **sealed test**, the final test data is kept untouched until the method
  and decision rules are fixed. You get one honest look. After that, it's no
  longer sealed.

## What's in the eight posts

**1. I Chose a Learning Rule Twice. A Random One Would Have Done.** I built a
backprop-free learner, compared three local rules, and picked a winner on one
seed. Then a ten-seed rerun reversed the result. And two phases later, I found
out that a frozen *random* layer scored about the same as the rule I'd selected.
The scorer on top had been doing the work all along.

**2. My Results Were Real. My Claims Weren't.** I audited my own passing
benchmarks, this time actively trying to break them. Test accuracy of `0.800`
became `0.150` once evaluation was genuinely frozen, which is below the chance
floor. I found five distinct ways I'd been overstating my evidence, including a
forgetting curve that was structurally incapable of detecting forgetting. Every
number reproduced perfectly, and that's exactly the point: reproducibility and
validity are two different things.

**3. A Unigram Beat My Language Model.** This was the first properly sealed test
on real text. My frozen learned features comfortably beat matched random features
(`5.4996` against `7.2103` NLL), and then lost to simply counting word frequencies
(`5.3582`). Beating random is easy. Beating counting is not. What survived was a
small complementary signal. This post is also about what a sealed test is and why
you only get to run one once.

**4. The One Mechanism Claim That Passed.** Not everything failed. A binding
mechanism cleared a sealed confirmation across four distinct graph structures
and eight seeds, winning every control comparison. This is the post where I'll
be least specific about internals, for reasons I explain below.

**5. Zero Events Extracted.** Two pipelines that looked operational and did
nothing useful. One extracted zero events from real text after passing every
controlled test I'd built. The other run had already been ruled invalid before I
even looked at its coverage, but the coverage numbers were still stark: zero
route coverage in 23 of 24 jobs. This one is about instrumentation that can tell "working" apart
from "silently empty."

**6. My Embeddings Were Fine. My Readout Wasn't. Then That Was Wrong Too.** A
diagnostic in three acts. At first the test blamed the small predictor reading
the features, not the features themselves, since a separately trained probe could
use the same frozen features just fine. Then a follow-up showed that the probe
may simply have memorized which words tend to occur together. Sometimes the
diagnostic that explains your failure is itself wrong.

**7. 192 GPU Cells to Learn My Harness Was Lying.** This is the pivot to bounded
continual learning. Here, a "cell" means one combination of method, data
schedule, memory budget, and random seed. The first full grid completed every
cell and reported that its configuration matched what I'd selected. It hadn't.
It had silently run the wrong number of learning updates in each segment. The
repaired rerun then varied too much across seeds in 18 of 24 comparison groups.
I also talk about why I kept both runs instead of deleting them.

**8. One Learning Rate Fixed the Baseline. Storage Still Came Back Null.** A
calibration screen found the real culprit: one inherited learning rate. Fixing
it gave me a stable, credible baseline that passed every gate. Then the
interesting result never showed up. Extra memory bought no measurable benefit,
and the final precommitted diagnostic returned `NO_RATE`. So I ended up with a
clean baseline and nothing to beat it.

## Ground rules

**On numbers.** Every figure in these posts traces back to a locked result
artifact or an exact line in the project's experiment log. I keep a separate
evidence file per post that maps each one, mostly so that I can't quietly round a
number toward the story I want. If a figure couldn't be traced, I cut it rather
than softened it. One casualty: I originally wrote that the audit cost me
"three months of results," then found out the repository's history doesn't
record when that work started. So the series contains no timelines.

**On what I'm holding back.** The failures are described completely: mechanism,
configuration, exact numbers. Being vague about a failure would make it useless to
you, and unverifiable too. Two things are deliberately described only by
behavior and result: the one mechanism that passed its sealed confirmation, and
the bounded continual-learning candidate that hasn't been scored yet. I'll tell
you what they do and what they measured. I won't give you enough to rebuild
them. I'd rather say that plainly than pretend the gaps aren't there.

**On tone.** These are failure posts, but they're not confessions. Each one
covers what I tried, what I measured, why it broke, and what lesson carries over
to other work. I'm not interested in performing humility. I'd also ask you not
to read the negative results as a claim that the underlying ideas can't work.
Several of them fail in ways that narrow the search rather than closing it.

## If you read nothing else

The invalid results that forced the program's first reset were reproducible.
Same seeds, same container, same outputs, every time. My version pinning and
determinism were excellent, and they protected me from nothing. A deterministic
pipeline with a contaminated evaluation will reproduce its contamination
perfectly, forever.

Reproducibility means your result is stable. It says nothing about whether it's
true. I had spent years believing those two were closer together than they are.

Start with [post 1](/blog/2026-09-18-learning-rule-that-didnt-matter/), or jump
to whichever failure sounds most like one of yours.

---

*Next: [**I Chose a Learning Rule Twice. A Random One Would Have
Done.**](/blog/2026-09-18-learning-rule-that-didnt-matter/)*
