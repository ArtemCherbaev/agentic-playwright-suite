# Test plan

Twenty functional cases and twenty visual ones, both capped. New coverage replaces an existing case
rather than growing the total.

## Why a cap

Twenty cases that can each be justified demonstrate more than two hundred nobody can explain. A suite
small enough to hold in your head is one people reason about; one nobody can explain is one nobody
trusts enough to act on. The cap also forces the question that matters — what would this failure
cost, and who pays — every time someone wants to add something.

## How a case earns its place

Three questions, in this order. The requirement list is not among them.

1. What would this failure cost, and who pays for it?
2. How late would it surface?
3. What is the cheapest layer that would catch it?

## Functional cases

| ID    | Area      | Proves                                                                                   |
| ----- | --------- | ---------------------------------------------------------------------------------------- |
| TC-01 | Home      | The landing page renders its carousel, catalogue and categories                          |
| TC-02 | Home      | A visitor can subscribe from the footer                                                  |
| TC-03 | Home      | A product from the recommended row reaches the cart                                      |
| TC-04 | Account   | A new visitor can register and is greeted by name                                        |
| TC-05 | Account   | The wrong password is refused and no session is created                                  |
| TC-06 | Account   | An existing account can log in and log out again                                         |
| TC-07 | Account   | Registering an email that already exists is refused                                      |
| TC-08 | Catalogue | The products page lists the catalogue                                                    |
| TC-09 | Catalogue | A product page states everything a buyer decides on                                      |
| TC-10 | Catalogue | Search narrows the catalogue rather than returning all of it                             |
| TC-11 | Catalogue | A search that matches nothing says so rather than showing everything                     |
| TC-12 | Catalogue | A category narrows the catalogue to that category                                        |
| TC-13 | Catalogue | A brand narrows the catalogue to that brand                                              |
| TC-14 | Cart      | Two products added from the grid both arrive in the cart                                 |
| TC-15 | Cart      | The quantity chosen on the product page is the quantity in the cart                      |
| TC-16 | Cart      | Removing the only product leaves the cart empty, not stale                               |
| TC-17 | Cart      | The cart survives navigating away and back                                               |
| TC-18 | Contact   | The contact form submits and confirms                                                    |
| TC-19 | Contact   | A review can be left against a product                                                   |
| TC-20 | Cart      | A visitor can subscribe from the cart page                                               |
| TC-21 | Home      | **Parked.** The scroll up control returns the visitor to the top — see AE-1 in STATUS.md |

Five of the twenty sit on the cart, the largest share of any area, because that is where the money is
and where the defects found so far have been.

## Visual cases

| ID    | Captures                                 |
| ----- | ---------------------------------------- |
| VR-01 | Header and navigation                    |
| VR-02 | Hero carousel, first slide               |
| VR-03 | Category and brand sidebar               |
| VR-04 | A catalogue tile                         |
| VR-05 | Footer and subscription box              |
| VR-06 | Search input and button                  |
| VR-07 | Search results heading and first tile    |
| VR-08 | Product information panel                |
| VR-09 | Review form                              |
| VR-10 | Category listing heading and tile        |
| VR-11 | Checkout control — see AE-5 in STATUS.md |
| VR-12 | Added to cart modal                      |
| VR-13 | A cart row                               |
| VR-14 | The cart table with two products         |
| VR-15 | Login form                               |
| VR-16 | Signup form                              |
| VR-17 | Login error state                        |
| VR-18 | Account details form                     |
| VR-19 | Contact form                             |
| VR-20 | Contact success state                    |

Each captures a component rather than a page. A full page screenshot fails on any change anywhere in
it, so the report says "the page changed" and someone still has to go and find what.

## What is deliberately not covered

| Not covered                 | Why                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Checkout and payment        | Someone else's demo, no stable test account for it, and it would displace a cart case that has already caught something. |
| The published API endpoints | A different layer with a different tool. Driving a browser to check a JSON contract is slow and fragile.                 |
| Responsive breakpoints      | The target's layout is not the product being demonstrated here. Would be first on the list if it were.                   |
| Accessibility               | Worth a suite of its own with its own tooling, not two cases bolted onto this one.                                       |

The gaps are as much a decision as the cases. Adding any of these means naming what comes out.
