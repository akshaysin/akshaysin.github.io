---
title: "I Chose a Learning Rule Twice. A Random One Would Have Done."
pubDate: "2026-09-18T19:25:00+05:30"
description: "Phases 0-2: building a backprop-free learner, picking anti-Hebbian on one seed, and discovering a frozen random layer cleared the same gates."
category: "Machine Learning"
heroImage: "../../assets/learning-rule-that-didnt-matter-hero.webp"
heroImageAlt: "An elaborate glowing neural network and a simpler frozen network feed a shared scorer; their primary output traces look nearly identical."
draft: false
---

*Post 1 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/).*

---

I spent two phases of this project choosing between three local learning rules.
I ran head-to-head comparisons, picked a winner, validated it, carried it
forward, and built a sequence learner on top of it that hit **99.7%** accuracy
on a task where the frequency baseline gets **66.7%**.

Then an audit froze the learned layer, replaced it with a **random** one that
never updated at all, and re-ran the benchmark. It scored **0.9958** and passed
all six decision gates on **7 of 8** seeds.

The layer I'd spent two phases selecting wasn't doing the work. A small output
scorer sitting on top of it was — and that scorer didn't care whether the thing
underneath it had learned anything or was frozen noise.

This post is about how I got there, what the plumbing genuinely proved, and the
one moment in the middle where the project caught itself and I failed to draw
the obvious conclusion.

## Concept: what a local learning rule is, and why bother

Conventional end-to-end backpropagation computes a loss at the output and
propagates gradients backward through the layers. That's a global credit-
assignment operation: an early weight is updated using information derived
from a later loss. It works extremely well and it's why we have the models we
have.

It also implies some things about deployment. Training needs a backward pass
and retains or recomputes intermediate state. Continually updating on a stream
can also wreck what the model already knew.

A **local** learning rule drops the global part. A weight between two neurons
updates using only those two neurons' activity and maybe a broadcast scalar. No
backward pass, no stored graph. The classic is **Hebbian** learning — "fire
together, wire together": if the input neuron and output neuron are active at the
same time, strengthen the connection.

The three variants I tested:

- **Pure Hebbian.** Co-activation strengthens the weight. Simple, and prone to
  unbounded growth with no way to unlearn.
- **Anti-Hebbian / decorrelation.** Add a term that pushes co-active neurons'
  weight vectors *apart*, so they specialize on different patterns instead of
  all collapsing onto the most common one. Mine used an Oja-style
  self-normalizing term plus a lateral repulsion term.
- **Reward-modulated Hebbian.** Multiply the update by a scalar signal — a
  "three-factor" rule. Mine gated on a self-generated novelty score.

The appeal, if any of these work, is a model that keeps learning after
deployment on a fixed memory budget. That's the north star for this whole
program, and posts 7 and 8 are about pursuing it with backprop allowed again.

## What actually worked: the plumbing

Before the learning rules, there was an infrastructure phase, and its narrow
engineering claims held up.

The rules were: no autograd anywhere in the model code, a single isolated
backprop file allowed to exist purely as a comparison baseline, deterministic
config and seeding, checkpoints that round-trip exactly, and instrumentation for
RAM, updates per second, activation sparsity and weight drift.

All of it met its exit criteria. Checkpoints round-tripped through `np.savez`.
Memory stayed flat at about **170 KB** across a multi-thousand-step stream, which
is the thing you actually need if you're claiming bounded continual learning.

Two findings from that phase are worth stealing if you ever build one of these:

**Hebbian rules need zero-mean inputs.** I fed raw 0/1 binary patterns in and
the weights drifted toward the average input direction instead of toward
pattern-specific structure. All familiar-versus-noise separation disappeared.
Switching to bipolar ±1 inputs fixed it. In hindsight it's obvious — with
all-positive inputs every update pushes the same way — but it cost real time.

**Weight-norm caps interact with input dimensionality.** With a norm cap of
`1.0` on 64-dimensional bipolar inputs, the dot products were large enough to
saturate `tanh` for essentially any input, familiar or not. Everything looked
identical because everything was pinned at the ceiling. Dropping the cap to
`0.25` restored a measurable separation.

Neither of these is a research finding. Both are the kind of thing that silently
produces a null result you then misattribute to your hypothesis.

## Round one: picking a rule on one seed

The first task was familiarity detection. Show the learner 8×8 binary patterns
repeatedly among random noise, then check whether familiar patterns produce a
more distinct response than new noise. Not language — just "has the rule
captured recurring structure at all."

I ran all three rules on an identical stream, same seed, same patterns, same
distribution shift:

| Rule | Familiar | Noise | Separation |
| --- | --- | --- | --- |
| Pure Hebbian | 2.012 | 1.867 | 0.145 |
| Anti-Hebbian | 2.037 | 1.869 | **0.168** |
| Reward-modulated | 1.842 | 1.893 | **-0.051** |

Anti-Hebbian wins. Reward-modulated is actively broken — negative separation
means noise scored *higher* than familiar patterns. That one has a clean
explanation: damping updates on strongly-firing familiar patterns also damps the
reinforcement that made them distinguishable in the first place. The gate
suppressed exactly what it should have reinforced.

I noted the margins were small, picked anti-Hebbian, and moved on.

There's a second problem in that table I didn't notice. My "retained" check
marked the reward-modulated rule as retaining patterns, even though its familiar
score of `1.842` is *below* its noise score of `1.893`. The predicate only
required familiar to exceed 90% of noise. A rule that had inverted the thing it
was measuring passed a gate named for retention. Post 2 is full of this genre.

## Round two: the validation that reversed the result

To my credit — and this is the moment that makes the rest of the series
frustrating — I did not trust a single seed. The next phase re-ran the
comparison across 10 seeds.

| Rule | Separation (mean ± SD) | Retained | Learning speed |
| --- | --- | --- | --- |
| Pure Hebbian | 0.069 ± 0.166 | 90% of seeds | 500 steps |
| Anti-Hebbian | 0.042 ± 0.163 | 90% of seeds | 500 steps |

Averaged over seeds, **pure Hebbian slightly outperforms the rule I had just
chosen**, and both standard deviations are larger than their means — 2.4 times
larger for pure Hebbian, 3.9 times for anti-Hebbian. The single-seed result
didn't reverse because anti-Hebbian is worse. It reversed because on this task,
at this scale, the measurement is noise.

The right conclusion was available and I half-took it. I wrote down that the two
rules were statistically indistinguishable and that the Phase 1 pick "was not a
robust finding." Then I carried anti-Hebbian forward anyway, flagged as
*unconfirmed*, with an explicit open question: does this rule produce useful
predictive representations at all, or just decorrelated activity that happens
not to hurt this metric?

That open question was exactly right. It then went unanswered while I kept
building on top of the rule, and the answer, when it finally arrived, was the
second one.

The ablations from that same phase were far more conclusive than the rule
comparison, and they're the part I'd defend today:

- **Normalization is load-bearing.** Disabling it collapsed activation diversity
  from `1.00` to `0.53` and weight drift exploded from `2.75` to `17.97`. What
  keeps this rule usable is the normalization, not the anti-Hebbian term.
- **Top-k competition is a real trade-off.** With no competition, separation
  standard deviation blew up to `2.55` and retention fell to `70%`. With maximum
  competition (`top_k=1`), variance and drift both dropped — and so did
  separation. No free lunch in either direction.
- **Decay barely mattered** at this scale.

Notice what those three have in common: each one removes a component and shows
the result degrades. That's a necessity test, and it's the exact thing I never
ran on the anti-Hebbian term itself.

## Round three: the result that looked like success

Phase 2 moved from static patterns to sequence prediction, and this is where it
finally looked like it was working.

The task: predict the next symbol in `A A B` repeating. That's deliberately
chosen — a predictor that only looks at the previous symbol cannot solve it,
because `A` is followed by `A` in one position and by `B` in another. You need
context. Then shift the distribution to `A B`, and re-check the original
sequence afterward to measure retention.

The architecture was context buffer → hidden layer → next-symbol scores, with
the anti-Hebbian update gated by surprise, so learning concentrates where the
prediction is wrong. Plus a fatigue-based homeostasis mechanism and a small
local output scorer — a single-layer delta rule with no error propagated back
into the hidden layer, keeping the whole thing forward-only.

| Stage | Net accuracy | Frequency baseline |
| --- | --- | --- |
| Primary (AAB) | 99.7% | 66.7% |
| After shift (AB) | 99.6% | 99.9% (trivially solvable) |
| Retention re-check (AAB) | 97.2% | 66.7% |

Six of six decision gates passed. And having learned the ten-seed lesson, I
re-ran it across 8 seeds — where it held: primary `0.9989`, shifted `0.9960`,
retention `0.9796`, 8 of 8 all-pass.

So: multi-seed, beats the frequency baseline by 33 points on a task that
provably requires context, replicates cleanly. I wrote at the time that this
"answers the open research question" — that the anti-Hebbian layer was producing
representations a local scorer could use, and not just decorrelated-but-useless
activity.

It answered nothing, because I never ran the control.

## The control

The audit disabled every hidden-layer operation — updates, normalization, decay,
consolidation — leaving a **frozen random** hidden layer. The output scorer was
unchanged and still learned normally.

| Stage | Learned layer (8 seeds) | Frozen random layer |
| --- | --- | --- |
| Primary | 0.9989 | 0.9958 |
| After shift | 0.9960 | 0.9792 |
| Retention | 0.9796 | 0.8892 |

The frozen random layer passed all six gates on 7 of 8 seeds.

Two phases of rule selection, a surprise gate, homeostasis, normalization,
decay, consolidation — and a random projection with none of it nearly matches
the primary score and still clears the declared gates on 7 of 8 seeds. It is
weaker on shift and retention, so this isn't a claim of equality. It is enough
to show that the benchmark never established the learned layer's necessity. A
single-layer delta rule over a fixed random feature map is enough to fit `A A
B`, which in retrospect is not a surprising fact about `A A B`.

A smaller detail in the same audit: the retention re-check was itself a training
stream, updating both layer and scorer while measuring retention. That's the
contamination pattern post 2 is entirely about, showing up here first.

The revised conclusion was that no Phase 2 result causally selects anti-Hebbian
hidden learning, and that any future claim about a plastic representation rule
requires a matched frozen/random-feature ablation first. Which is the rule I
should have written down before Phase 1.

## What I'd tell you

**A baseline that shares your pipeline is worth ten that don't.** I had a
backprop baseline from day one, sitting in its own isolated file, and it told me
nothing here — different architecture, different code path, easy to dismiss as
not comparable. The control that actually mattered was one configuration
switch away: same harness, same scorer, same data, hidden layer frozen.
It took an adversarial audit to run it because it never occurred to me that my
own contribution might be the removable part.

**"Does my component do anything" is a different question from "does my system
work."** My system worked. It hit 99.7% on a task with a 66.7% floor and it
replicated across seeds. Every gate I'd written was about system performance,
and none was about component necessity, so the system passing told me nothing
about the component — and the component was the entire thesis of the project.

**Noticing a result is fragile is not the same as acting on it.** The 10-seed
reversal was the project working correctly. I found it myself, wrote it down
accurately, labelled the rule unconfirmed, and then continued building on top
of it anyway. Writing "unconfirmed" in a document is not a control. It's a note
that you owe yourself one, and I didn't pay.

The genuinely useful output of this era was the infrastructure and the
ablations: bounded memory, exact checkpoints, and three clean component
necessity tests on normalization, competition and decay. The learning rule at
the center of this phase never got the same treatment.

Next up: what happened when I finally pointed that kind of scrutiny at
everything at once.

---

*Next: **My Results Were Real. My Claims Weren't.** — the adversarial audit, and the `0.800` that became `0.150`.*
