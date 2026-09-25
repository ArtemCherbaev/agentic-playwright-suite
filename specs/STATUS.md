# Status

Coverage per area, what has been found against the application, and the decisions still open.

Last verified: 2026-09-19, against `https://automationexercise.com`.

## Coverage

| Area             | Functional            | Visual         | Notes                                                   |
| ---------------- | --------------------- | -------------- | ------------------------------------------------------- |
| Home             | TC-01 to TC-03        | VR-01 to VR-05 | TC-21 parked, see below                                 |
| Account          | TC-04 to TC-07        | VR-15 to VR-18 | Every account created is deleted in fixture teardown    |
| Catalogue        | TC-08 to TC-13        | VR-06 to VR-10 | Search matches category as well as name, see below      |
| Cart             | TC-14 to TC-17, TC-20 | VR-11 to VR-14 | The largest share of the budget, and where the money is |
| Contact, reviews | TC-18, TC-19          | VR-19, VR-20   |                                                         |
| REST API         | API-01 to API-12      |                | HTTP only; three findings raised, AE-6 to AE-8          |

20 functional cases, 20 visual cases and 12 API cases, each suite capped. The functional cases are
replayed on WebKit, so the same coverage is proven on the engine behind Safari.

**Last full run:** functional 20/20 on Chromium, 20/20 on WebKit, 1 parked. Visual 20/20 on the
reference platform.

## Raised against the application

### AE-1 The scroll up control does nothing on roughly one visit in three

**Case:** TC-21, parked with `test.fixme()`.

The control is present, visible, and nothing covers it. `elementFromPoint` at the click coordinates
returns `#scrollUp` itself, the click is delivered, no console error follows, and the page stays
where it was. Retrying the click for fifteen seconds does not recover it: once a visit is in that
state the control stays dead for that visit.

Measured over six consecutive runs, two failed. Isolating the setup did not explain it — the
failures occurred with and without the animation freeze, and with and without the consent dismissal.

Parked rather than repaired, because a repair would mean asserting something weaker than "the button
works", and the defect belongs to the application.

### AE-2 Product search matches the category as well as the product name

**Case:** TC-10, which asserts the behaviour as it is.

Searching `top` returns 14 of 34 products. Twelve contain "top" in the name; "Little Girls Mr. Panda
Shirt" and "Colour Blocked Shirt – Sky Blue" do not, and both sit under a Tops category.

Not obviously a defect — it may well be intended — but it is not what a reader of the feature would
assume, so the case asserts narrowing plus a present expected match rather than pretending every
result contains the term.

### AE-3 Advertiser markup is injected inside the application's own text

**Affects:** every case that reads a product name, and the visual suite throughout.

Google's link annotations write into the same node as product titles. Two shapes seen on one page
within a minute of each other:

```html
<p>Full Sleeves Top Cherry - Pink<span class="google-anno-t">Apparel</span></p>
<p>
  <a class="google-anno"><span class="google-anno-t">Lace Top For Women</span></a>
</p>
```

`textContent` picks up the advertiser's word in the first; keeping only direct text nodes returns an
empty string in the second. The empty string was the worse failure: passed to a `hasText` filter it
matched every row in the cart, and the case failed three assertions later on a count that made no
sense.

The suite no longer joins on names at all — cart assertions use `data-product-id` from the tile and
`id="product-<id>"` on the row. Where a displayed name genuinely is the subject, `utils/text.ts`
handles both shapes and asserts the result is not empty.

### AE-4 Google's vignette interstitial swallows navigation, mostly on WebKit

**Affects:** TC-12, and any case navigating from the sidebar.

The click lands, a full screen advertisement opens over the page, and the address becomes
`/products#google_vignette` rather than the category. Nothing in the application went wrong.

`BasePage.dismissVignette` goes back when it sees that fragment, and `ProductsPage.openCategory`
retries the whole interaction, which is what a visitor who meets an interstitial does. Recorded here
because it is third party behaviour rather than a defect either side can fix.

### AE-5 The empty cart cannot be captured visually

**Case:** VR-11 was redirected to the checkout control instead.

The empty cart message is a single centred paragraph, and the advertiser injects a widget inside
that paragraph, which re-centres the sentence by a different amount depending on whether the widget
arrived before the capture. Three consecutive runs disagreed with the baseline and with each other.
Removing the widget by class worked for two of its shapes and not the one used here.

The empty cart is covered functionally by TC-16, which asserts the message rather than photographing
it. VR-11 now captures the checkout control, which is the commercially important thing on the page
and sits in a region the advertiser does not write into.

### AE-6 The REST API answers HTTP 200 to everything, including its own refusals

**Cases:** every API case, which assert the HTTP status and the body's `responseCode` together.

A missing parameter, a wrong password, an unsupported verb and a deleted account all come back as
`HTTP/1.1 200 OK`. The real outcome is only in the body: `{"responseCode": 405, "message": "This
request method is not supported."}`. Observed on all fourteen documented endpoints, every run since
the API suite was added.

It matters beyond this suite: any client, proxy or monitor that trusts the status line records these
failures as successes. The cases pin the 200 on purpose, so the day the API starts answering with
real status codes they fail and say so, rather than quietly carrying on.

### AE-7 JSON is served as `text/html`

**Affects:** every API response.

Every endpoint returns `Content-Type: text/html; charset=utf-8` with a JSON body. A client that
negotiates on the content type refuses to parse it. The suite's client parses the text itself and
fails with the body in the message if it is not JSON.

### AE-8 The brand list has one row per product, not one per brand

**Case:** API-03, which asserts the brands as a set.

`GET /api/brandsList` returns 34 rows, ids 1 to 34, for 8 distinct brands: "Polo" appears six
times. The row count happens to equal the product count. Whether that is the intended contract is
not documented, so the case asserts what a consumer can rely on — every brand a product carries is
listed — and records the row count as an annotation instead of asserting it.

## Open decisions

| Question                                                          | Current position                                                                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should the WebKit job run at one worker rather than two?          | Two for now. TC-04 failed once at two workers and passed alone; one occurrence is not a measurement. Revisit if it recurs.                                            |
| Should the suite stub the advertising rather than work around it? | No. Blocking it would change the layout the baselines are of, and the point of this target is that its failures are real ones.                                        |
| Is a checkout and payment flow worth a case?                      | Not yet. It would need a stable account and a payment form on someone else's demo, and the cap means it would displace a cart case that has already caught something. |

## How to add to this file

A defect raised against the application gets an `AE-n`, the case that found it, what was actually
observed, and how many runs out of how many. A defect with no numbers in it is an opinion.
