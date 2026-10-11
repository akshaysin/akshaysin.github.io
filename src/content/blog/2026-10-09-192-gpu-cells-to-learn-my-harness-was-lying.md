---
title: "192 GPU Cells to Learn My Harness Was Lying"
pubDate: "2026-10-09"
description: "A continual-learning grid finished every cell and reported the calibrated configuration while running a different update dose; the repaired rerun still failed cross-seed stability in 18 of 24 groups."
category: "Machine Learning"
heroImage: "../../assets/192-gpu-cells-to-learn-my-harness-was-lying-hero.webp"
heroImageAlt: "A dark panel of small cells, each with a green status light, while a magnifying lens over one cell shows teal bars overflowing a dashed slot into coral bars."
draft: false
---

*Post 7 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/). Every claim here is as
of 18 September 2026.*

My first full continual-learning grid ran for about 8 hours and 41 minutes on a
rented GPU. All 192 cells finished. Every memory meter agreed with its
independent audit. The result file said the configuration matched the one I'd
calibrated and selected.

It didn't. The selected configuration said 24 learning updates per segment of
the data stream. The grid actually ran 40, 60 or 80, depending on the
schedule. The check that said "matches" had only looked at a constant in the
code, never at the loop that did the training.

I fixed that and ran all 192 cells again. The second run did exactly the
number of updates it claimed, and it still failed. Results varied too much
between random seeds in 18 of 24 comparison groups. Every method that learned
within the declared memory budget ended up worse than simply not learning at all.

This post is about both runs, what each one could and couldn't tell me, and why
I kept the broken one instead of deleting it.

## The pivot

The previous post ended with the last forward-only mechanism family closed.
Every route that needed structure to be *discovered* from real text, without
backpropagation, had failed under preregistered evaluation.

So I changed the goal. The new target was a small language model that keeps
learning from a stream of text on a fixed memory budget. That's what the
program had always been about underneath. Backpropagation was allowed back in,
as a counted and bounded tool. The biological-fidelity constraint was retired.

The success criterion was written down before anything ran: at a fixed total
budget, beat a standard replay baseline on the retention-plasticity trade-off
at 2 of 3 budget levels, without the model's memory quietly growing.

## A few terms first

**Continual learning** is training on a stream that changes over time, rather
than on one shuffled dataset. The classic failure is **catastrophic
forgetting**: learn domain B and you lose what you knew about domain A. The two
things you want at once are **plasticity** (getting better at whatever's
arriving now) and **retention** (not getting worse at what came before).

The backbone was **Pythia-160M**, a small public pretrained language model with
about 160 million parameters. It already knows a fair amount of English, so the
question isn't whether it can learn language. It's whether it can keep adapting
without wrecking itself.

The stream cycled through four text domains: earthquake summaries, weather
forecast discussions, Mastodon posts and Swahili Wikipedia articles. One visit to a domain
is a **regime**. Four regimes make a **cycle**, and the stream ran 12 cycles.
Text was cut into 256-token **blocks**. A **schedule** set how long each regime
lasted: `10,240`, `15,360` or `20,480` tokens for fast, medium and slow. That's
40, 60 or 80 blocks per regime.

Everything was scored in **NLL** (negative log-likelihood, how surprised the
model is by the real next token, in nats). Lower is better. The key number here
is **final held-out NLL**: at the end of the stream, how well the model
predicts a fixed set of development documents it never trained on.

The methods:

- **Frozen backbone:** never trains. It's the "do nothing" reference, and it
  scored `4.1515` final held-out NLL.
- **Naive fine-tuning:** train on each block as it arrives.
- **Experience replay (ER):** keep a small buffer of past blocks and mix a
  couple of them into every update, so old domains keep getting practiced. The
  buffer size is capped by a **byte budget**: `448`, `896` or `1,792` KiB
  (small, medium, large).
- **Unbounded storage:** ER with an unlimited buffer and matched compute. It's
  the "what would more memory buy" reference.
- **Simplified continual backprop** and a **grow-state adapter**, two more
  reference points. The adapter is out-of-class because it keeps growing.

A **cell** is one combination of method, budget, schedule and seed. That's 3
schedules × 8 method-budget combinations × 8 seeds, so 192 cells. A **group**
is the same cell across all 8 seeds, which gives 24 groups.

The **stability gate** asked that, within each group, the standard deviation of
final held-out NLL across the 8 seeds be at most `0.5` nats. If changing the
seed moves the answer by more than that, you can't compare methods with it.

## Run 1: everything checked out, except the thing that mattered

The configuration came from an earlier calibration step. It had picked plain
SGD with a learning rate of `2e-4` (how big a step each update takes), a replay
batch of 2, and **24 updates per regime**. A later protocol lock carried that
forward, and the grid runner had a check that asserted it matched.

Run 1 finished and the operational checks were spotless: 192 of 192 cells,
every byte meter agreeing with its independent audit, zero compute-cap
violations, same-cell reruns reproducing exactly. The one result I was
waiting for failed. Two of five harness gates failed:

- **Stability** failed in 16 of 24 groups. It wasn't one bad seed: after
  dropping the single seed that helped each group most, 14 still failed.
- **Budget monotonicity** (more ER memory shouldn't make things worse) failed
  on the slow schedule by `0.008` beyond its allowed slack.

The descriptive numbers were worse than the gates. Every method that trained
the full backbone was worse than frozen on average at every schedule. Naive
fine-tuning landed at `5.922`, `6.032` and `5.942` against frozen's `4.1515`.
Even the unbounded-storage reference, supposed to be a ceiling, came in at
`5.338`, `4.796` and `4.779`. ER's retention looked fine, but it was retaining
a degraded model.

My first write-up said the passing completeness and meter gates showed this
wasn't a harness bug. The analysis about twenty minutes later retracted that.

### The line that lied

The grid's result file contained this:

```json
"matches_step6_selection": true
```

That flag came from a function that compared an imported constant,
`updates_per_regime = 24`, to the calibrated value. They matched. But the
training loop never used that constant. It trained once on every 256-token
block, so it ran 40, 60 or 80 updates per regime depending on the schedule.
That's 1.67x, 2.5x and 3.33x the dose the learning rate had been calibrated for.

Nothing in the cell files recorded how many updates actually ran. The design
contract saved the dwell tokens and the block size, and left out the number that
mattered.

Please note that the dose mismatch was never proven to *cause* the instability.
It was a plausible common cause, and the run couldn't be a valid frontier
either way. So Run 1 was labelled a **negative, protocol-nonconforming
diagnostic**, and the harness gates' "not a bug" reading was withdrawn.

The monotonicity failure turned out to be much less interesting. One seed
contributed a `+3.546` paired difference, and without it the gap shrank to about
`+0.074`. There was a subtler point too. With a fixed replay batch, a bigger
buffer changes *which* old blocks get replayed, not *how many*. So "more memory
must help" was never guaranteed by this method, and a failure there didn't
point to a bug.

## Run 2: the right number of updates, and still unstable

The repair was locked before any new score existed. Every block still got
scored as it arrived, but training happened only on the first 24 blocks of each
regime. Every cell now recorded its update policy and the exact per-regime
counts of observations and updates. The completeness gate failed closed unless
every trained method recorded exactly 24 updates per regime and frozen recorded
zero.

Run 2 ran the same 192-cell shape on the same kind of rental GPU. Its longest
worker took about 5 hours 24 minutes. The operational gates passed again, and
so did the budget-axis check. Stability failed:

| | Run 1 | Run 2 |
| --- | ---: | ---: |
| Updates per regime (fast/medium/slow) | 40/60/80 | 24/24/24 |
| Groups failing stability | 16/24 | 18/24 |
| Still failing after dropping each group's friendliest seed | 14/24 | 15/24 |
| Naive fine-tuning, final held-out NLL (fast/medium/slow) | `5.922`/`6.032`/`5.942` | `6.350`/`5.616`/`6.266` |
| Frozen backbone | `4.1515` | `4.1515` |

Only frozen and the grow-state adapter passed stability, across their six
groups. Frozen can't vary. The adapter barely moved: it improved held-out NLL by
about `0.0046` while using `36,126,720` bytes of state, outside every declared
budget.

ER was worse than frozen in every group. On the fast schedule its three budgets
landed at `6.031`, `5.460` and `5.406`.

So fixing the dose didn't recover a usable baseline. Relaxing the stability
gate wouldn't have helped either, because every in-class adaptive method was
worse than doing nothing on both axes.

## What the root-cause analysis could and couldn't say

The follow-up was read-only: no model loaded, no GPU, no new scores. It
localized the problem well.

Every group started with exactly zero spread across seeds at checkpoint 0.
Frozen stayed at exactly zero. All 18 full-backbone adaptive groups crossed the
`0.5` tolerance by checkpoint 1 or 2, and each failing group had final
standard deviation above `0.5` on at least three of four domains. The worst
deviation in each group was spread across six different seeds. That rules out a
noisy evaluator, a corrupt cell or one bad seed. The spread was coming from
the training itself.

The main suspect was the learning rate. The `2e-4` had been calibrated on two
domains that were later replaced, with naive stability checked on one seed and
ER on three. And the calibration run that picked it did 96 updates. Every
trained Run-2 cell did `1,152`. That's a 12x longer horizon than the setting was
ever tested at.

Here's the thing, though. Run 2 contained no learning-rate counterfactual. It
couldn't show that `2e-4` was the cause, or that a lower rate would give a
stable, useful baseline. That's why the write-up says "primary target", not
"cause", and why the next step was a small screen to test it rather than
another full grid. That screen is the next post.

## Why I kept both runs

The easy move after Run 1 was to delete it. It was nonconforming, it had
taken almost nine hours of rented GPU time, and a clean rerun would've replaced it.

I preserved it instead, before starting any investigation: a byte-identical
copy of all 192 cells (hash-checked, 192/192), the frontier artifact, every
worker and orchestrator log, and a manifest with the status
`PRESERVED_FAILED_GATES` and the full gate result. The live copy stayed where
it was for analysis.

There were three reasons.

**The failure is data.** The main intended difference between Run 1 and Run 2
was the update dose. Having both shows that correcting the dose didn't remove
the instability. Delete Run 1 and that comparison is gone.

**Write-once cells need somewhere to go.** Each cell file refuses to be
overwritten. A fixed runner has a new fingerprint, so it can't reuse the old
cells, and it also can't write over them. The runner's own error message says to
preserve the old cells and use a new directory. Doing that up front meant the
rerun couldn't be blocked by the old record or destroy it.

**Deleting failures makes the record look better than the work was.** This
series exists because I found out, repeatedly, that the version of events I
remembered was more flattering than the one on disk. A project that deletes its
failed grids has a success rate it didn't earn.

Run 2 had a smaller auditability gap of its own. It stored
`reproducibility: passes: true` with 3 pairs checked, but not the paired
signatures behind it, so nobody can reconstruct that pass now. It didn't change
the verdict, because stability fails on the raw cells regardless. But persisting
those statistics became mandatory before any future frontier could lock.

## What I'd do differently

**Attest the value you executed, not the value you imported.** A check that
compares a constant to itself will pass forever. The cell should record what
the loop actually did (updates, observations, tokens), and the gate should read
that record.

**Calibrate at the horizon you'll score at.** A configuration tuned over 96
updates had never been tested at `1,152`. Shorter is cheaper, and it's also a
different experiment.

**Don't let clean operations vouch for the science.** Complete grids, agreeing
meters and exact reruns tell you the harness is honest about what it did. They
say nothing about whether it did the right thing. I wrote "not a harness bug" on
the strength of those gates, and the analysis retracted it soon afterward.

**Keep a root cause as a hypothesis until something tests it.** "The learning
rate is the prime suspect" and "the learning rate is the cause" are different
sentences. The second one needs an experiment that changes the learning rate.

---

*Next: **One Learning Rate Fixed the Baseline. Storage Still Came Back Null.**
A 78-cell screen finds the culprit, the baseline finally passes every gate, and
the payoff never arrives.*
