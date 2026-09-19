---
name: visual-regression
description: How to capture a stable screenshot against a live, advertising supported target, and how to read a visual diff. Load before writing a visual case, changing the capture helper, or judging a red visual suite.
---

# Visual regression against a live target

The target is a public demo storefront with third party advertising, a rotating carousel, and images
it loads late. Every one of those moves between one run and the next with nothing in the application
having changed. A visual suite that does not deal with them fails most mornings and is ignored by
lunchtime.

## Capture components, not pages

A full page screenshot fails on any change anywhere in it, so the report says "the home page changed"
and someone still has to go and find what. A component capture names the thing that moved.

Capture the smallest region that would still show the regression you are guarding against. One
catalogue tile, not the grid: the shop adds products, and a baseline of the grid would be regenerated
every time it did, which trains everyone to regenerate without looking.

## What `readyForCapture` does, and why each part is there

Each of these was added after a specific failure, and removing one brings that failure back.

| Step                           | The failure it fixes                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wait for `load`                | Pages open on `domcontentloaded`, so the stylesheet declaring the web fonts can still be in flight and `document.fonts` enumerates a shorter list than the page will use.                                                |
| Collapse advertiser containers | Google injects one as the first child of `#footer`; it resizes for as long as the tab is open, so the footer's bounding box never held still for two frames and every capture timed out.                                 |
| Neutralise annotations         | The advertiser writes inside the application's own text. The widget shape is removed; the shape that wraps real text keeps its text and loses only its decoration, or the product's name would vanish from the baseline. |
| Wait for images                | `networkidle` never arrives on this target because the advertising keeps connections open. Asking the images is both faster and true.                                                                                    |
| Load every declared font       | `fonts.ready` only settles faces the browser has already requested, and a face is requested when something first needs it.                                                                                               |
| Wait two animation frames      | Loaded is not painted. A face arriving after first paint re-lays out the text; a capture in the same tick photographs the fallback.                                                                                      |
| Wait for a stable page height  | The collapse reflows the page once. Two identical samples mean it has finished.                                                                                                                                          |

## Reading a diff

Open `test-results/<dir>/*-diff.png` before touching anything.

| What you see                             | What it is                                               |
| ---------------------------------------- | -------------------------------------------------------- |
| Every glyph outlined, layout unchanged   | A font race. Not a regression; the wait above has a gap. |
| Text shifted sideways, sometimes doubled | Injected content changed the width of a centred line.    |
| A block moved down by a constant         | Something above it changed height, usually an ad.        |
| One component changed, the rest steady   | A real change. This is what the suite is for.            |

## Baselines

Chromium on Linux, generated inside the image the pipeline runs. `.gitignore` refuses `-win32` and
`-darwin` baselines, because a baseline generated on those platforms is only ever compared against on
those platforms: it sits in the repository looking like coverage while proving nothing.

Regeneration is a reviewed change. `yarn test:vr:update` is denied to agents in
`.claude/settings.json`. The `update_baselines` workflow dispatch regenerates and then immediately
re-runs, because a baseline is only worth having if it reproduces. The first set this suite generated
contained two captures taken before the fonts had painted; they disagreed with every run afterwards
while looking like a regression in the application.

## When a component cannot be captured

Say so and stop, rather than lowering the threshold until it passes. The empty cart was dropped from
this suite for that reason: its message is a single centred paragraph and the advertiser injects a
widget inside that paragraph, so the sentence re-centres by a different amount on every run. It is
covered functionally by TC-16, which asserts the message rather than photographing it, and the
reasoning is in `specs/STATUS.md`.
