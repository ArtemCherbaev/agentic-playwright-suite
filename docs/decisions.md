# Decisions

The calls a reviewer would question, and what broke while building this. The second half is the more
useful one.

## Retries are zero

Playwright's `retries` is `0` and the flake policy forbids raising it. A retry converts a flaky test
into a green tick and discards the only run that had anything to say about why it was flaky.

The cost is real: a run can fail on third party noise and need a human to look at it. That is the
intended trade. The alternative is a suite whose green means "passed eventually", which is not a
statement anyone can act on.

## Twenty cases, capped

New coverage replaces existing coverage. See `specs/TEST-PLAN.md` for the reasoning. The uncomfortable
consequence is that obvious gaps stay open — there is no checkout case — and that is easier to defend
than a suite of two hundred cases where nobody can say which forty matter.

## Three projects rather than one

`chromium`, `webkit` and `visual` answer three different questions, and merging them would bury the
visual failures under twenty functional passes. It also means the WebKit run is a control: when the
whole functional suite fails at one step, WebKit passing the same twenty cases says the shared host
was overloaded rather than the suite being wrong.

## Baselines are Linux only, and `.gitignore` enforces it

A baseline generated on Windows or macOS is only ever compared against on that platform. It would sit
in the repository looking like coverage while proving nothing, and it would never fail, which is
worse than not existing. `vr-tests/__screenshots__/**/*-win32.png` and `*-darwin.png` are refused.

The cost is that a developer on Windows cannot run the visual suite without Docker. `yarn docker:vr`
exists for exactly that, and the workflow dispatch regenerates baselines for anyone without Docker
at all.

---

# What broke while building this

## `exact: true` on a name containing an icon

`getByRole('link', { name: 'Women', exact: true })` resolved on one run and returned zero matches on
the next, on the same commit. The toggle is:

```text
<a><span class="badge pull-right"><i class="fa fa-plus"></i></span> Women </a>
```

Once the Font Awesome stylesheet applies, the icon's generated content joins the accessible name. The
first run clicked before the stylesheet landed; the second did not. Verified directly: `exact: true`
gave 0 matches and a substring match gave 1, on a page four seconds after load.

Substring matching now, with the reason in the page object. Three toggles, all distinct, so nothing
is lost.

## An empty product name matched every row in the cart

The advertiser's annotations write into the same node as product titles. The first attempt at
handling this kept only the element's own text nodes, which is correct for the shape where the
advertiser appends a word, and returns an empty string for the shape where it wraps the whole title.

The empty string went into `filter({ hasText: name })`, which matched all of them, and the case
failed on `toHaveCount(1)` receiving `2` — three assertions after the actual mistake, on a number
nobody could explain from the error alone.

Two changes came out of it. The helper now falls back to the full text when stripping leaves nothing,
and asserts the result is not empty, so the next shape of this problem fails at the read with a clear
message. More importantly, the cart stopped joining on names at all: `data-product-id` on the tile
and `id="product-<id>"` on the row are the application's own identifiers and nothing an advertiser
does can touch them.

## Two baselines were photographs of the fallback font

The first generated baseline set had two captures that disagreed with every run afterwards by three
to six percent of their pixels. The diff showed every glyph outlined and the layout unchanged, which
is the signature of a font difference rather than a layout one.

`document.fonts.ready` alone was not enough — it settles the faces the browser has already asked for,
and a face is only requested when something first needs it. Forcing every declared face to load was
not enough either, because loaded is not painted. The capture helper now waits for `load`, forces
every face, waits for `fonts.ready` again, and then waits two animation frames so the re-layout is
drawn before the screenshot.

The lesson went into the pipeline as well: the `update_baselines` job regenerates and then
immediately re-runs, because a baseline that has not been shown to reproduce is not a baseline.

## The footer could never be photographed

Every capture of `#footer` timed out waiting for the element to be stable. Nothing was wrong with the
locator: Google injects a container as the footer's first child and it resizes for as long as the tab
is open, so the bounding box never held still for two consecutive frames.

Masking does not help — a mask changes what is compared, not what is on the page. The capture helper
now collapses the advertiser's containers before capturing, on every run, so the baseline and the
comparison see the same thing, and that thing is the application's own layout.

The two annotation shapes had to be treated differently. The advertiser's own widgets are removed
outright; the shape that wraps the application's text keeps its text and loses only its decoration,
because removing it would take the product's name out of the baseline.

## The empty cart had to be dropped from the visual suite

Its message is one centred paragraph and the advertiser injects a widget inside that paragraph, so
the sentence re-centres by a different amount depending on when the widget arrives. Three runs
disagreed with the baseline and with each other. Removing the widget by class worked for two of its
shapes and not the one used there.

It was not made to pass by raising the threshold. VR-11 now captures the checkout control, which is
the commercially important thing on that page, and the empty state is covered functionally by TC-16,
which asserts the message rather than photographing it.

## The scroll up control does nothing on one visit in three

Six runs, two failures, and the control is not covered, the click is delivered, and no console error
follows. Retrying for fifteen seconds does not recover it. Bisecting the test setup did not explain
it: it failed with and without the animation freeze, and with and without the consent dismissal.

Parked with `test.fixme()` rather than repaired, because every repair available would assert
something weaker than "the button works". Written up as AE-1.

## CSP caught a class of bug in the portfolio's sibling repository

Worth recording because it is the same lesson: the smoke suite in the portfolio repository asserts an
empty console, and that assertion failed on inline `style` attributes being refused by the page's own
Content Security Policy. The styles were silently dropped in production. The fix was CSS classes, not
a looser policy — and the console assertion is why anyone knew.
