---
title: "My Results Were Real. My Claims Weren't."
pubDate: "2026-10-02"
description: "An adversarial audit turned a reported 0.800 compositional-generalization result into 0.150 under genuinely frozen evaluation, and exposed four more ways the evidence had been overstated."
category: "Machine Learning"
heroImage: "../../assets/my-results-were-real-my-claims-werent-hero.webp"
heroImageAlt: "Two experiment dashboards flank a magnifying lens that reveals evaluation data looping back into a neural network; green success plots on the left become orange failure plots on the right."
draft: true
---

*Post 2 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/).*

---

One of my benchmarks reported `0.800` test accuracy on compositional
generalization, with a generalization gap of `-0.088`. In other words, the test
score was higher than the training score. I read that as evidence the model had
learned reusable concepts rather than memorized patterns.

Then I froze the model during evaluation. And I mean actually froze it, no
weight updates of any kind while measuring. The same suite scored `0.150`, below
its `1/6` token-chance bound of about `0.167`.

Two things make that worse than just a bad result.

The first is that the benchmark was never testing what I said it was. The idea
was the standard one: train on `red square`, `red circle`, `blue square`,
hold back `blue circle`, and see whether the model composes it anyway. That's
what I wrote down as the purpose. What the suite actually did was train on all
four combinations of `{red, blue} × {square, circle}` and then test on `green
square`, `green circle`, and `green triangle`. That's a color the model had never
seen, and a shape it had never seen. Nothing was held back as a *combination* at
all. I was asking it to produce symbols that did not exist in its training data,
which is not compositional generalization. It's clairvoyance.

The second is that the benchmark wasn't even passing. Across the three suites it
cleared 4 of 4, 3 of 4, and 3 of 4 decision gates, so 10 of 12. Two gates were
failing the whole time, and both of them were the neuron-specialization gate
that was supposed to establish the factorized representation I was claiming. I
had the failures in a table right in front of me, and I looked at the attractive
accuracy number instead.

This post is about the audit that found that, and the four other ways my
evaluation was overstating my evidence. Every number here is reproducible.
That's the uncomfortable part.

## The setup

I was building a language model that learns without backpropagation. Local
learning rules only, where updates are driven mainly by the activity available
at the two ends of a connection, sometimes with a local modulatory signal. Post
1 covers why. The short version: if you want a model that keeps learning after
deployment, on a fixed memory budget, without a training cluster, backprop's
global gradient is inconvenient, and biology seems to manage without it.

I had a working NumPy framework and benchmarks I had been treating as
successful. Online fitting, sparsity, checkpointing, bounded resource use.
Multi-task validation at 99.4% train accuracy. Continual learning over 500
patterns with 96% retention. Compositional generalization at 80%.

Before scaling up to anything larger, I ran an adversarial audit against my own
results. This wasn't a code review. It was an explicit attempt to break every
claim I'd made, starting from the assumption that each one was wrong and then
looking for the reason.

It went poorly, which is to say it went extremely well.

## Concept: what "frozen evaluation" actually means

Skip this if it's obvious to you. It wasn't obvious to me at the time, and that's
the whole story.

In standard supervised learning, the framework helps you out. `model.eval()`
switches layer behavior like dropout and batchnorm, and `torch.no_grad()` stops
autograd from recording. Neither one is a real state-isolation guarantee (you can
still change parameters inside a `no_grad` block if you try), but together they
make the train/eval boundary explicit enough that crossing it is usually a
deliberate act.

Local learning rules have no such boundary. The update *is* the forward pass.
A Hebbian-family rule adjusts weights whenever activity flows through the
network. That's the entire mechanism, and there's no separate backward pass to
switch off. So "run the model on held-out data" and "train the model on
held-out data" are, by default, **the same operation**.

What that means is the boundary your framework at least makes visible, you now
have to draw and enforce entirely by yourself. I didn't. I wrote an evaluation
function that called the training runner, because the training runner was the
thing that ran the model.

Everything below follows from that one decision.

## Failure 1: the model learned the test set, every time

My held-out evaluation called the training runner. The training runner updated
the hidden layer and the output scorer. So every "held-out" measurement trained
on the data it was measuring.

It gets worse. In the compositional suite, the reported generalization gap came
from a *second* train/test pass, which ran after the first pass had already
trained on every test stream. The reported gaps were zero or negative because by
the time I measured them, there was no held-out data left anywhere in the
experiment.

Here's what the compositional suites looked like before and after freezing, on
seed 0:

| Suite | Reported | Frozen (seed 0) | Gates passed |
| --- | --- | --- | --- |
| simple color-shape | 0.800 | 0.150 | 4/4 |
| hierarchical | 0.800 | 0.311 | 3/4 |
| nested dependencies | 0.767 | 0.150 | 3/4 |

The gate I'd declared was `0.70`. None of the three frozen results came close,
and the simple suite landed below its `1/6` token-chance bound. Across eight
seeds the frozen maxima were `0.167 / 0.311 / 0.167`. So even the best seed out
of eight was still roughly at chance, on the one suite where I can state chance
exactly.

The same defect ran through the multi-task validation. Its adaptation and
retention paths, the ones producing 99.1% and 99.5%, were all training paths.

Classification: `INVALID` as evidence of frozen compositional generalization.
What survived was narrower and a lot less exciting: *the learner fits short
periodic streams online, quickly.* Which is true, and which I already knew.

## Failure 2: the held-out set that was a copy of the training set

While I was in there, I checked what the held-out streams actually contained.

Each "held-out" stream turned out to be exactly the prefix of its own training
stream, starting at the same point in the same periodic cycle. Not sampled from
the same distribution. The same bytes.

And the fifth task in my five-task suite, `AAB-repeat`, whose entire job was to
test retention by revisiting an earlier task, was behaviorally identical to task
one. I was measuring retention of a task by re-running that task.

So the 99.7% held-out generalization number was really measuring the model's
ability to train on a stream it had already trained on, and then report that it
had learned it.

## Failure 3: metrics that could not measure the thing they were named after

This is the one I'd most want other practitioners to take away, because it
survives code review. The code is correct. It computes exactly what it says. It
just doesn't mean what the variable name implies.

**The forgetting curve that contained no forgetting.** My continual-learning
experiment trained on 200 sequentially generated patterns and periodically
re-tested old ones, reporting ~96% retention. It had three problems, all fatal:

- The 200 "diverse" patterns contained **36 unique streams**. The 500-pattern
  version contained 46. I was generating from a small family with heavy
  duplication and calling it diversity.
- Each retention checkpoint evaluated only the **five immediately preceding**
  patterns, and updated the model while doing it. That's not retention. That's
  recent reacquisition, measured by training.
- No pattern index was ever evaluated twice. Only 100 of 200 indices were
  checked at all.

A forgetting curve needs the same memory measured at two points in time. My
setup had no repeated trajectory in it anywhere. It was structurally incapable
of detecting forgetting, which goes a long way to explain why it never detected
any.

**The selectivity metric that reached two million.** I was measuring neuron
specialization as a signed max-minus-min divided by a signed mean. When the mean
gets close to zero, the ratio explodes. I built a two-activation counterexample
that goes past two million. My actual reported values included `-21.940` and
`213.659`, and I had written interpretations of both, including a thoughtful
paragraph about how negative selectivity might indicate complementary coding.

It indicated a small denominator.

**The automaton that ignored its own automaton.** My finite-state-machine
generator moved an internal state through a transition table and then picked
each emitted symbol *uniformly at random*. Two different automata, reset to the
same RNG state, emit identical observations. The transition graph had no
influence on the output at all.

That one at least failed honestly. Seed 0 came back with test accuracy `0.3402`,
frequency margin `0.0078`, adaptation `0.3475`, retention `0.33075`, missing
4 of 4 gates. Sometimes a broken experiment has the courtesy to look broken.

## Failure 4: ordinary arithmetic

In the Forward-Forward implementation:

```python
return correct / len(symbols) - 1
```

The intent was `correct / (len(symbols) - 1)`. Operator precedence did what
operator precedence does, and the function could return negative accuracy.

I want to call this one out because it's the least interesting bug in the post,
and the one most likely to be in your code right now. It produced values that
were clearly impossible. Nobody noticed, including me, because the number was
small and sat in a table alongside other small numbers. After the fix, the same
distribution-shift test returned `acc_a=0.384`, `acc_b=0.229`. Bounded,
sensible, and a lot less flattering.

On a related note, the audit harness for a different experiment turned out not
to keep the model between calls at all. One function built a fresh stack and
returned metrics from it, and the next function called it again on *another*
fresh stack. So a 24-seed "trained context" result was measuring prefix learning
on brand-new models, an A→B→A retention sequence was really three unrelated runs,
and the memory ablations silently threw away the training streams they were
named for.

Every one of those produced plausible numbers.

## Failure 5: one seed

My replay-consolidation result looked like this on seed 0: after exposure to the
relevant action, association strength was already `19.54x` its original value,
and after one replay pass it reached `23.03x`. So replay's own contribution was
the `3.49x` step at the end, not the whole climb. That's a distinction I blurred
in my own notes by describing the result as "23x." Compelling either way, so I
wrote it up.

The eight-seed replication:

| Measurement | Seeds improved | Mean change in association lift |
| --- | --- | --- |
| Immediate post-replay | 6/8 | **-0.120 ± 9.374** |
| Post-distractor retention | 6/8 | +0.101 ± 0.159 |

The gain is measured relative to the original association baseline, and `±` is
the sample standard deviation across seeds. Now look at it: `9.374` on a mean of
`-0.120`. The effect is too noisy to estimate reliably at this sample size, and
seed 0 just happened to land at the flattering end of an extremely wide
distribution. Six of eight seeds showing improvement sounds supportive, right up
until you notice that the two that didn't were enough to swamp the mean by nearly
two orders of magnitude.

I'd read enough papers to know better. Knowing better is apparently not the same
as doing better when the number on your own screen is 23x.

## What the audit cost

Most of a program. Phase 2.5 retention, Phase 2.7 composition, and Phase 2.8
episodic generalization were all reclassified as invalid frozen evidence. The
early language-readiness stages went the same way. One had learned during
measurement, one depended on probe order, and one had been evaluated on
repeated placeholder text instead of a real held-out corpus.

A phase and a half of results came down to one sentence: *this thing fits short
periodic streams online, which is a useful regression test.*

The decision that came out of it was `SIMPLIFY`, meaning strip out the
unsupported complexity. When that wasn't enough, it became
`PAUSE_RESET_CURRENT_ARCHITECTURE`: stop patching, keep the diagnostics, and
require a genuinely different approach before continuing.

## The thing that should scare you

**Every number in this post reproduced exactly.**

The audit of the multi-task suite passed all 11 of its own checks and
reproduced the original means to the decimal. The compositional audit passed
9/9 and reproduced the historical 10-of-12 gate result. Same seeds, same
outputs, every time.

Reproducibility and validity are two different things. A deterministic pipeline
with a contaminated evaluation reproduces its contamination perfectly, forever.
All my version pinning and seed control did was guarantee I'd get the same wrong
answer on demand.

If your defense against fooling yourself is "but it's reproducible," you don't
have a defense. You have a very reliable way of being wrong.

## The rules I adopted

The audit produced a fixed list. Nothing gets scored now unless it satisfies all
of them:

1. **Non-degenerate choices.** The task must be solvable and must have a real
   chance floor that's stated up front and compared against. If I'd written down
   `1/6` before running the compositional suite, `0.150` would have been obvious
   in week one.
2. **Causal isolation.** All learned and adaptive state is frozen during
   measurement. Evaluation gets its own code path that physically cannot update
   weights.
3. **Component necessity.** If a component is claimed to matter, ablate it and
   show the result degrades.
4. **Baseline parity.** Compare against the best cheap statistical baseline, not
   against random. More on this in post 3, where a unigram beats me.
5. **Gate and state integrity.** Gates are declared before the run, and the
   harness rejects malformed or silently omitted ones. A missing gate is a
   failure, not a pass.
6. **Replication across seeds and structures.** Multiple seeds, and where the
   task has structure, multiple genuinely different structures. A later audit
   caught me "replicating" across four graphs that turned out to be isomorphic.
7. **Calibrated claims.** Every registered result carries an explicit statement
   of what it does and does not establish. "Fits periodic streams online" and
   "generalizes compositionally" are different claims and get different labels.

## What I'd actually tell you

The bugs weren't the problem. The bugs were downstream.

The problem was that I wrote the evaluation code after the training code, while
hoping the training code worked. Every defect above has that same shape: an
evaluation path that shares state with training, a held-out set put together
from whatever was convenient, a metric named for the property I wanted rather
than the quantity it computed, and a seed count of one, because one seed already
gave me the answer I wanted.

None of those were deliberate. What's striking is that nearly all of them pointed
in the same direction.

I don't think that's because flattering bugs are more common. This post has two
counterexamples: the arithmetic bug produced impossible negative accuracies, and
the FSA generator failed 4 of 4 gates on its own terms. Unflattering bugs happen
at the same rate.

The asymmetry comes after the bug. An unflattering result gets investigated
until it's explained or fixed. A flattering one gets written up, cited in the
next design document, and built on. So the filter isn't on which errors occur.
It's on which ones survive contact with my own interpretation. That's selection
pressure, and it runs in exactly one direction unless something from outside
stops it.

The fix that worked wasn't more careful coding. It was writing the evaluation
and its thresholds down **before** the experiment existed, in a document I
couldn't edit afterwards, with a harness that refuses to score a run whose gates
don't match what was declared. That's expensive and annoying, and it feels like
bureaucracy right up to the first time it catches something.

It has caught quite a lot since. Post 3 is about the first thing it caught: a
frozen, honestly-evaluated, properly-sealed model losing to a unigram.

---

*Next: **A Unigram Beat My Language Model**. What happened when I finally ran a sealed test on real text.*
