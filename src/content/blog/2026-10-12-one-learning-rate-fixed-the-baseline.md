---
title: "One Learning Rate Fixed the Baseline. Storage Still Came Back Null."
pubDate: "2026-10-12"
description: "Lowering one inherited learning rate produced a stable continual-learning baseline that passed every gate, but extra replay storage bought nothing measurable and the last precommitted diagnostic returned NO_RATE."
category: "Machine Learning"
heroImage: "../../assets/one-learning-rate-fixed-the-baseline-hero.webp"
heroImageAlt: "A dial with its amber needle turned down beside a panel showing a smooth teal line over a faint jagged coral one, next to three glass jars of increasing size filled to the same level."
draft: false
---

*Post 8 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/). Every claim here is as
of 18 September 2026.*

The instability from the last post came down to one inherited number. Dropping
the learning rate from `2e-4` to `5e-5` turned a baseline grid that failed
stability in 18 of 24 groups into one that passed all five gates, 24 of 24
groups stable. For the first time, methods that learned from the stream beat
the model that didn't learn at all.

Then the part I actually cared about didn't show up. The whole benchmark was
built to ask whether a smarter use of limited memory could beat standard
replay. On this benchmark, extra memory bought nothing measurable. A screen
designed to make storage matter couldn't find a reliable effect
(`FAIL_NO_RESOLVABLE_MULTIBUDGET_STORAGE_HEADROOM`). The last test planned in
advance searched for a learning rate that would leave some forgetting to
prevent without making training unstable. It returned `NO_RATE`.

So I ended up with a clean, stable, locked baseline and nothing to beat it with.

## A few terms first

This post builds on the setup in *192 GPU Cells to Learn My Harness Was Lying*:
a small pretrained model (Pythia-160M) learning from a stream of four
domains, scored in NLL (lower is better), with frozen, naive fine-tuning and
experience replay (ER) as the main methods. A few new terms:

- **Learning rate** is the size of each update step. Too small and the model
  barely moves. Too big and each update overshoots, which can make training
  blow up.
- **Gradient clipping** caps how large an update is allowed to be. It's a
  common guard against blow-ups.
- A **positive control** is a setting you *expect* to fail. If it doesn't fail,
  your test isn't sensitive enough to trust when other things pass.
- **Fail-fast** stops an arm as soon as the available results show that it has
  broken a rule, instead of spending compute on the rest of its cells.
- **Headroom** here means the gap between ER at a fixed memory budget and the
  unbounded-storage reference with the same compute. A zero gap leaves no
  demonstrated benefit from extra storage under this replay rule. A different
  algorithm could still beat ER.
- **Forgetting** is how much worse the model gets on a domain between visits.
  **Plasticity** is how well it predicts new text as it arrives in the final
  cycle.

## The 78-cell screen

The previous post ended with a named suspect and no proof. So instead of
another 192-cell grid, I locked a small screen designed to test it.

It ran only the fast schedule and the small budget, on six fresh seeds that the
real grid would never score on. Every cell ran the full `1,152`-update horizon
the calibration had missed. It swept two things: learning rate (`2e-4`, `5e-5`,
`1e-5`) and clipping (none, or a cap of `1.0`), for naive fine-tuning and ER.
That's 12 adaptive arms × 6 seeds, plus 6 frozen cells, so 78 in total against
Run 2's 192.

The rules were fixed in advance. An arm whose cross-seed standard deviation went
above `0.5` at any checkpoint was marked unstable and its remaining cells were
cancelled. An arm passed only if it was stable at every checkpoint *and* beat
frozen on at least one axis. And the arm with the exact Run-2 settings (`2e-4`,
no clipping) was the positive control. If it *didn't* go unstable, the screen
would be labelled inconclusive, not a pass.

The control did its job. Naive fine-tuning at `2e-4` aborted at checkpoint 3
with a cross-seed standard deviation of `1.930`. ER aborted at checkpoint 2 at
`0.976`. That reproduced Run 2's failure on fresh seeds. Fail-fast cancelled 8
cells, so the screen computed 70, cancelled 8, and left none unaccounted. The
frozen reference came in at `4.1515` again, identical to Run 2, which told me
the harness was behaving the same way.

All 10 non-control arms passed:

| Arm | Final held-out NLL | Max cross-seed std |
| --- | ---: | ---: |
| ER, `5e-5`, no clipping | `3.5789` | `0.189` |
| ER, `1e-5`, no clipping | `3.8544` | `0.033` |
| Naive, `5e-5`, no clipping | `3.8931` | `0.147` |
| Naive, `1e-5`, no clipping | `3.9962` | `0.014` |
| ER, `2e-4`, clipped | `4.0482` | `0.003` |
| Naive, `2e-4`, clipped | `4.0794` | `0.003` |
| ER, `5e-5`, clipped | `4.1087` | `0.001` |
| Naive, `5e-5`, clipped | `4.1196` | `0.002` |
| ER, `1e-5`, clipped | `4.1356` | `0.0005` |
| Naive, `1e-5`, clipped | `4.1397` | `0.0004` |
| *Frozen (reference)* | `4.1515` | `0` |

The best arm was `0.57` nats *better* than frozen. In Run 2, ER with the same
schedule and budget had been `1.88` nats *worse*.

### Clipping was a throttle, not a fix

Look at the clipped rows. They all sit in a narrow band just under frozen, with
almost no spread across seeds. That looks like stability, and in a narrow sense
it is.

But before the run, I'd measured the raw gradient sizes: `245` to `464`.
For gradients of those observed sizes, a cap of `1.0` cuts the step by a
factor of roughly 250 to 450. The clipped arms were stable mostly because they
barely moved. Clipping did rescue
`2e-4` from blowing up, but at the lower rates it only cost performance. The
unclipped lower-rate arms carried the result.

That's also why the pass rule deserves a caveat. An arm had to stay stable and
beat frozen on at least one of the two measures. It could do that by barely
changing. Here the best margin happened to be large, but the rule itself says
"not broken", not "useful".

## Run 3: one number changed

The rate for the full grid was picked by a rule written before the screen ran:
among settings where every screened method passed, take the one with the lowest
mean final held-out NLL. That picked `5e-5` with no clipping, with a mean of
`3.7360`. The runner refused to start unless that recomputation matched the
lock.

Run 3 used Run 2's exact 192-cell shape: same schedules, methods, budgets,
seeds and block orders, and the same gates with no fail-fast. The learning rate
was the only difference, which made Run 2 against Run 3 a paired comparison of
that one setting.

All five gates passed. Stability passed in 24 of 24 groups, and the worst group
had a standard deviation of `0.212` against the `0.5` tolerance. Three
reproducibility reruns were bit-identical, and this time their signatures were
saved.

| Mean final held-out NLL (fast/medium/slow) | Run 2 (`2e-4`) | Run 3 (`5e-5`) |
| --- | --- | --- |
| Frozen | `4.1515` everywhere | `4.1515` everywhere |
| Naive fine-tuning | `6.350`/`5.616`/`6.266` | `3.862`/`3.847`/`3.825` |
| ER, small budget | `6.031`/`6.059`/`5.909` | `3.598`/`3.736`/`3.603` |
| ER, large budget | `5.406`/`5.597`/`5.908` | `3.597`/`3.656`/`3.575` |
| Unbounded storage | `5.406`/`5.597`/`5.885` | `3.597`/`3.656`/`3.570` |

No in-class method was worse than frozen on both axes at any schedule. Run 2 had
said the opposite. One learning rate, inherited from a calibration done on
different domains at a twelfth of the horizon, had been the difference between
a benchmark that couldn't find a working baseline and one that could.

Look at the last two rows of that table, though.

## The storage null

The benchmark's success claim was about memory. A candidate method would win by
getting closer to the unbounded-storage reference than ER does, at the same
budget, across several budget levels. That only works if there's a gap between
ER and unbounded storage to close.

There mostly wasn't. A read-only analysis measured ER minus unbounded, paired by
seed:

- **Large budget:** on the fast and medium schedules, ER's buffer never filled,
  so ER and unbounded were bit-identical by construction. On slow, the
  difference was `-0.0002`.
- **Medium budget:** ER was marginally *better* than unbounded on every
  schedule.
- **Small budget:** the only visible gaps. On the medium schedule it was
  `+0.082`, but the plausible range still included no effect, and two seeds
  drove most of the gap.

The only gap that was clearly real was a forgetting effect of about `0.006`
nats on the slow schedule at the small budget, positive on 8 of 8 seeds. That's
all the headroom there was in the grid.

The reason is simple once you see it. Even the small buffer held 892 records
from a stream of 1,920 to 3,840 blocks. That was already enough to represent
the stream. More storage had nothing left to add.

There was a second problem sitting underneath this. The only acceptance margin
ever locked was on an accuracy scale, and these cells record NLL. A margin in
NLL, set from measured seed noise, was supposed to be written before scoring and
never had been. So the analysis couldn't use one. It reported conclusions that
hold at any positive margin instead. An extra sweep of margins, which I'm
flagging as not preregistered, found that storage alone won no cell at any
margin tried.

### One more try at making storage matter

I didn't want to give up on the storage question just because this particular
grid couldn't answer it. So I designed a screen to make the budget actually
bind: 48 cells on the slow schedule, six fresh seeds, three tighter budgets
(`448`, `576` and `704` KiB, holding 892, 1,147 and 1,402 records), and bigger
replay batches (4 and 8) to push more replay through the buffer. It ran only
ER and its matched unbounded reference.

The pass rule was fixed in advance. At one replay batch size, at least two
budgets had to show ER worse than unbounded by at least `0.02` NLL on one
measure and on at least 5 of 6 seeds. A conservative resampling check also had
to put the lower bound at `0.01` or higher.

All eight arms were stable and all 36 compute-parity checks passed. The data
was fine. The answer was
`FAIL_NO_RESOLVABLE_MULTIBUDGET_STORAGE_HEADROOM`. Neither batch size had even
one budget that passed, let alone two. The closest was batch 8 at the largest
budget: a mean plasticity gap of `+0.03258` with a lower bound of `+0.01493`,
but only 4 of 6 seeds met the margin where 5 were required.

That's a genuine negative for this setup: one schedule, three narrow budgets,
two replay sizes, six seeds, one learning rate. It doesn't show that storage
can never matter. It shows I couldn't make it matter here.

## `NO_RATE`

By then there was a deeper problem, and a follow-up audit made it concrete.
At `5e-5`, there was almost no forgetting for a memory method to prevent.
Naive fine-tuning forgot only about `0.031` nats between visits to a domain.
ER's forgetting was already zero or negative on every schedule. The audit also
found that forgetting was controlled mostly by the learning rate, with roughly a
25x jump between `5e-5` and `2e-4` and no rate tested in between.

The rate that made the baseline stable was also the rate that made retention
too easy to measure anything against. So the last diagnostic asked the obvious
question: is there a rate between the stable one and the unstable one where ER
has measurable forgetting to work with, and training still holds together?

It was a locked 108-cell screen: rates `1e-4` and `1.5e-4`, a `5e-5` anchor,
and `2e-4` again as the positive control, for naive and ER, on 12 fresh seeds.
A rate would be nominated only if it was stable and ER's own forgetting was
large enough to detect. If no rate qualified, a preregistered stop rule would
end this line of work.

| Arm | Seeds before abort | Checkpoint | Cross-seed std |
| --- | ---: | ---: | ---: |
| Naive, `2e-4` (control) | 2 | 2 | `0.793` |
| ER, `2e-4` (control) | 2 | 1 | `0.563` |
| Naive, `1e-4` | 4 | 7 | `1.150` |
| ER, `1e-4` | 3 | 10 | `0.538` |
| Naive, `1.5e-4` | 2 | 11 | `0.789` |
| ER, `1.5e-4` | 2 | 1 | `112.37` |

The tolerance was `0.5`. That last row isn't a typo: one ER run at `1.5e-4`
diverged catastrophically. The anchor and frozen arms completed all 12 seeds
and passed. Fail-fast cancelled 57 of the 108 cells and 51 were computed.

The control reproduced the known instability. The anchor agreed with Run 3. And
both candidate rates went unstable before ER had any measurable forgetting room.
Verdict: `NO_RATE`, and the stop rule triggered.

I want to be careful about what that means. It means this particular route is
used up: a one-dimensional, unclipped learning-rate search on Pythia-160M on
this stream. It doesn't mean retention-sensitive or storage-sensitive continual
learning can't work. The screen had no storage control, and it didn't try
clipping, other optimizers, other backbones or other streams. Those would each
be a new, separately preregistered experiment, not a retry of this one.

## Where it stands

As of 18 September 2026, the Run-3 grid is locked as the baseline frontier with
its storage degeneracy disclosed, alongside an acceptance rule for scoring
candidates against it. No candidate has been scored. After `NO_RATE`, whether
any candidate is worth scoring against that frontier waits on an explicit
decision from me, recorded before anything runs. Nothing continues by default.

## What I'd do differently

**Measure the headroom before building the benchmark around it.** The success
claim needed a gap between bounded and unbounded memory. A read-only check of
that gap cost nothing and would have shown it was zero at two of three budgets.
An earlier version of this benchmark had hit the same class of problem. I
should have made "is there room to win?" a gate, not a finding.

**Suspect the settings you inherited.** The `2e-4` came from a calibration on
different domains, fewer seeds and a twelfth of the horizon. It sat unexamined
through two full grids. One small screen fixed it.

**Don't mistake "barely moving" for "stable".** The clipped arms had the
lowest seed variance in the whole screen, and they were the least useful arms
that passed. Low variance tells you the answer is repeatable, not that it's any
good.

**Lock the acceptance margin, in the units you'll score, before the scores
exist.** An accuracy-scale margin on an NLL benchmark is a margin you can't
use. Without one, every later comparison has to either invent one after the
fact or say nothing firm.

**Write the stop rule down while you still don't care about the answer.** The
`NO_RATE` stop rule was written before the screen ran. When it triggered, there
was nothing to argue about. If I'd waited until after seeing the result, I'm
fairly sure I'd have found a reason to try one more rate.

---

*This is the last of the eight main posts in the original series. The decision that
followed `NO_RATE` is covered in a follow-on post, **When the Measurement Says
Stop**.*
