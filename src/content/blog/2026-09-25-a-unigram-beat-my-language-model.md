---
title: "A Unigram Beat My Language Model"
pubDate: "2026-09-25"
description: "A sealed natural-text test showed learned features beat random ones but still lost to word-frequency counting; a later confirmation preserved only a small complementary signal."
category: "Machine Learning"
heroImage: "../../assets/a-unigram-beat-my-language-model-hero.webp"
heroImageAlt: "A small mechanical counter crosses a finish line ahead of a complex glass neural apparatus, whose faint signal joins stronger counting paths."
draft: false
---

*Post 3 of a series on a language-model research program that didn't work.
[Series index](/blog/2026-09-18-series-introduction/).*

My learned features passed their first real control, and then lost to the
simplest serious baseline I could throw at them.

On a sealed natural-text test, the learned features scored `5.4996` negative
log-likelihood. Matched random features scored `7.2103`. Lower is better, so the
learning had picked up something real. Then a unigram model, which is basically
a table asking "how often have I seen this word?", scored `5.3582` and won.

That killed the claim that the learned features were a competitive standalone
language model. It didn't make them useless though. A later test put them on
top of a stronger counting model and found a small improvement that held up:
`4.9717`, against `4.9917` for a matched random-feature residual and `5.0057`
for the counting model alone. So the honest conclusion was a lot narrower than
the one I wanted. The representation carried some complementary information. It
was not a better replacement for counting.

## One honest look at the answer

A **sealed test** is an exam whose questions you lock away before you make the
final design choices. You develop on one set of text, freeze the model and the
evaluation rules, and then open the held-out test exactly once. If the result
disappoints you, you don't get to tweak the system and call the second look a
confirmation. The whole point is to stop the test set from quietly turning into
an extension of the training set.

I also needed a score that cared about more than whether the top guess happened
to be right. This is where **negative log-likelihood**, or NLL, comes in. It
measures how much probability the model gave to the word that actually came
next. Confidently giving almost no probability to the right answer gets
punished heavily. Lower NLL is better.

Finally, I needed baselines that could embarrass the model. A **unigram**
ignores word order completely and predicts from overall word frequency. It
knows that common words are common, and not much else. That's exactly why it
matters. Beating random features doesn't make a new representation useful as a
language model. It also has to beat the cheap statistics that are already
sitting in the text.

## What I tried

The experiment split apart two questions that are easy to blur together:

1. Did the learning rule produce features with predictive information?
2. Were those features competitive with ordinary count-based prediction?

For the first question, I trained the same kind of output scorer on either the
learned features or a matched random representation. The random condition kept
all the surrounding machinery but took away whatever benefit the learning was
supposed to add. For the second, I compared the winner against count models,
the unigram included.

The test was deliberately unforgiving. The corpus, split, vocabulary, metrics,
seed set and decision rules were all fixed before the sealed data was opened.
From there, the experiment could only carry forward the claims its gates
actually supported.

## The result that narrowed the claim

| System | Test NLL (nats) | What it tests |
| --- | ---: | --- |
| Matched random features + trained scorer | `7.2103` | Can the scorer rescue arbitrary features? |
| Frozen learned features + trained scorer | `5.4996` | Did learning create predictive features? |
| Unigram count baseline | `5.3582` | Does the whole learned path beat word frequency? |

The learned features beat random features on every seed. Their mean NLL gain
was `1.7106` nats, with a paired document-bootstrap interval of
`[1.6522, 1.7621]`. So this wasn't another case of a flexible readout making a
random hidden layer look clever (that was the whole story of *I Chose a
Learning Rule Twice*). The representation had real predictive signal in it.

But the unigram was better by `0.1414` nats. A model with no notion of syntax,
meaning, or even local word order had just beaten the thing I was trying to
turn into a language model.

So "better than random" is a checkpoint, not a destination. Random features
tell you whether the learned representation contributes anything at all. A
strong simple baseline tells you whether that contribution is worth anything
compared to what you can already get cheaply.

## The counting model got stronger too

The first higher-order count baselines were surprisingly weak. They tried to
remember exact recent contexts, but natural language is sparse. Lots of word
sequences show up too rarely to estimate a reliable next-word distribution
from, so just adding more context can actually make a count model worse.

The fix was a support-adaptive trigram. A trigram predicts from the previous
two words, but this version backed off toward simpler counts whenever the local
evidence was thin. In plain terms: trust a specific phrase only when you've
seen enough examples of it, and otherwise lean on broader word frequencies.

That stronger baseline became the foundation for the last question. Instead of
asking the learned features to replace counting, I asked whether they could add
a small correction on top of it. That correction is called a **residual**.

| System | Confirmatory NLL (nats) |
| --- | ---: |
| Support-adaptive trigram only | `5.0057` |
| Trigram + matched random-feature residual | `4.9917` |
| Trigram + learned-feature residual | `4.9717` |

The learned residual beat both alternatives on every seed. Its mean gain was
`0.0200` nats over the random residual and `0.0340` nats over trigram-only. The
paired bootstrap intervals were `[0.0163, 0.0225]` and `[0.0287, 0.0387]`.

That's a positive result, but a small and specific one. It doesn't turn the
learned layer into a competitive standalone predictor. What it does say is that
the layer found some information the count model missed, and that information
survived a sealed confirmation when used as a complement.

## Why the original claim failed

I had been treating representation quality as one ladder: random at the
bottom, learned features above that, and a useful language model somewhere
near the top. The experiment showed there were really two different ladders.

One measures **materiality**: does learning add information beyond arbitrary
features? Yes. The other measures **competitiveness**: does the proposed system
beat a simple method suited to the data? No.

This distinction matters well beyond language modelling. A clever component can
have a measurable effect and still be the wrong foundation for a system. If a
cheap baseline already captures the dominant structure, the clever component
has to justify itself in whatever small space is left over.

## What I'd do differently

I'd put counting baselines into the very first development loop, instead of
saving them for the big test. A unigram should be the entrance exam for word
prediction, and a properly smoothed local-context model should show up soon
after.

I'd also write down two separate claims before running anything: "the
representation contains signal" and "the representation is competitive." Each
one needs its own control. Having that in writing would have made it a lot
harder to promote the first result into the second.

Most of all, I'd design around residual value much earlier. When a simple model
already owns most of the problem, trying to replace it is an unnecessarily
heroic bet. The more useful question is usually: what reliable error can the
new idea remove?

The unigram won the race I had entered. The learned features earned a much
smaller job, sitting next to the eventual winner. It wasn't the architecture I
set out to build, but it was the claim the evidence could actually support.

---

*Next: [**The One Mechanism Claim That Passed**](/blog/2026-09-28-the-one-mechanism-claim-that-passed/).
The one claim about how my model learned that survived a sealed confirmation.*
