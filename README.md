# SecureWrap Removals

A marketing site and instant-quote tool for a home removal/packing company,
based in Milton Keynes and covering the UK nationwide. Customers upload
photos of the items they need wrapped, get an AI-suggested item type per
photo (e.g. "TV") with editable wrap type(s) and size, enter their property
and address details (with postcode → address lookup), pick a move date and
optional van hire, and receive an instant quote with a "pay now" (discounted)
or "pay on the day" option. On acceptance they get a booking reference and can
download a PDF packing checklist (photo + item type + wrap type + size per
item, with tick boxes) for the crew to use on the day.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- lucide-react for icons
- jsPDF for the client-side checklist PDF
- Claude's vision API (optional) for item-type detection from photos
- [postcodes.io](https://postcodes.io) (free, no key needed) for postcode → distance lookup
- [getaddress.io](https://getaddress.io) (optional, needs a key) for postcode → full address list

No database is included — the quote wizard runs entirely in the browser and
photos are held as data URLs in memory for the session; three small API
routes handle photo classification, address lookup and distance server-side
(so no API key ever reaches the browser). See **Next steps** below for what
to wire up for production.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Optionally copy `.env.example` to `.env.local` and set:
- `ANTHROPIC_API_KEY` to enable AI item-type detection from photos (get a key
  at [console.anthropic.com](https://console.anthropic.com/)). Without it, the
  app falls back to guessing from the photo's filename and manual selection.
- `GETADDRESS_API_KEY` to enable "Find address" — postcode → pick your
  address from a list (get a key at [getaddress.io](https://getaddress.io)).
  Without it, the postcode field still checks distance from our Milton
  Keynes base for free (via postcodes.io), and the customer types their
  address manually.

Neither key is required for the app to run and produce a real quote.

## Project structure

```
app/
  page.tsx                    Homepage
  services/page.tsx            Services overview
  contact/page.tsx              Contact page
  quote/page.tsx                 Instant quote wizard
  api/identify-item/route.ts       Server route: classify a photo via Claude vision
  api/address/lookup/route.ts       Server route: postcode → list of addresses (getaddress.io)
  api/distance/route.ts              Server route: postcode → miles from base (postcodes.io)
components/
  Header.tsx, Footer.tsx, Hero.tsx, WhyTrustUs.tsx, ...   Marketing sections
  quote/                                                    Multi-step quote wizard
    QuoteWizard.tsx      Step orchestration + state
    StepUpload.tsx        Photo upload (camera, library, or drag-and-drop) + kicks off AI item detection
    StepWrapping.tsx       Item type (AI/manual), wrap type(s) & size per item
    StepProperty.tsx        Contact + address (with lookup) + property details + distance
    StepSchedule.tsx         Date, time slot, van hire (with size recommendation)
    StepQuote.tsx             Price breakdown + accept
    Confirmation.tsx           Booking confirmation + checklist download
lib/
  types.ts       Shared types
  itemCatalog.ts Wrapping price per item type — edit prices here
  pricing.ts     Quote calculation engine + rate card (edit fees/surcharges here)
  distance.ts    Haversine distance calculation from the Milton Keynes base
  quoteApi.ts    Client-side fetch helpers for the three API routes
  checklist.ts   PDF checklist generator
```

## Pricing

The calculation lives in [`lib/pricing.ts`](lib/pricing.ts), with per-item
wrapping prices in [`lib/itemCatalog.ts`](lib/itemCatalog.ts) — that's the one
place to edit "wrapping a TV costs about £30" style prices. The full model,
in order:

1. Callout & materials fee
2. Per-item wrapping cost — **item type base price** (from the catalog,
   suggested from the photo or picked manually) **× size multiplier × combined
   wrap-type factor**. Customers can pick more than one wrap type per item
   (e.g. bubble wrap + a box) — the first selected counts in full, each
   additional one adds at half its normal rate.
3. Stairs/floor access surcharge (property type, floor and lift)
4. Additional-rooms surcharge for larger properties
5. Optional van hire, in three parts once we know the address:
   - **Vehicle hire** — an estimated range (vans are hired from a third-party
     transport partner), midpoint used in the total
   - **Fuel** — real round-trip mileage ÷ the van's MPG, converted to litres,
     × the diesel price (`DIESEL_PRICE_PER_LITRE` in `lib/pricing.ts`, £1.90/L by default)
   - **Driver** — round-trip driving time (at an assumed average road speed)
     × an hourly rate, plus a flat fee since the driver also helps unload at
     the destination (`DRIVER_HOURLY_RATE` and `DRIVER_UNLOAD_HELP_FLAT`)

   If the address/distance isn't known yet, this falls back to a single rough
   estimate rather than blocking the quote, and is refined once confirmed.
   A van size is recommended based on the items uploaded (so 10 boxes doesn't
   suggest a Luton van).
6. Weekend / evening surcharges
7. A service & handling margin, applied to everything above — **20%
   normally, 30% if the customer's postcode is more than 40 miles from our
   Milton Keynes base** (this is how distance affects the *wrapping* side of
   the job; van travel has its own real cost above)
8. A "pay now" discount applied to the final subtotal

**Known edge case:** the van fuel/driver formula is a simple there-and-back
model with no cap. For very long distances (e.g. 200+ miles) it can produce
a driver-time cost that implies many hours of continuous driving in one day,
which isn't realistic without an overnight stay or a second driver. You may
want to add a maximum distance for an instant van quote (e.g. "beyond 100
miles, call us to arrange transport") in `lib/pricing.ts` and `StepSchedule.tsx`.

## Item-type detection

When a photo is uploaded, `app/api/identify-item/route.ts` sends it to
Claude's vision API (if `ANTHROPIC_API_KEY` is set) asking it to match the
photo against the catalog in `lib/itemCatalog.ts` (e.g. "tv", "sofa",
"wardrobe"). The suggested type — and its price — is shown and fully
editable in the "Choose protection" step. If no key is configured, or the
call fails, the app falls back to a keyword guess from the item's name and
manual selection, so the quote flow is never blocked on AI availability.

## Address & distance lookup

`StepProperty.tsx` has a postcode field with a "Find address" button:

- If `GETADDRESS_API_KEY` is set, it calls `app/api/address/lookup/route.ts`
  (getaddress.io's Find API) and shows every address at that postcode to
  pick from — selecting one fills in the address fields and sets the exact
  distance from our base in one step.
- If that isn't configured, or returns no results, it falls back to
  `app/api/distance/route.ts` (postcodes.io, free, no key) to at least
  confirm distance, and the customer fills in the address manually. If the
  postcode is only partially recognised (e.g. just "MK9"), distance falls
  back to an area-level estimate rather than failing outright.
- If distance genuinely can't be determined, the quote still generates
  instantly at the standard (20%) rate, with a note that the final price may
  be adjusted once the address is confirmed — it never blocks on this.

## Trust content

There's a "Why customers choose us" section (`components/WhyTrustUs.tsx`) on
the homepage. Since there are no reviews yet, it deliberately avoids star
ratings or testimonials and instead states concrete, true things about the
service (insurance, DBS-checked crew, itemised pricing, the checklist
system). Once you have real reviews (e.g. Google Business Profile,
Trustpilot), swap this out for an embed or a `Reviews` section — don't
replace it with invented quotes or ratings.

## Next steps for production

This is a front-end scaffold. To take it live you'll likely want to add:

- **A backend** (e.g. a database) to persist quotes and bookings instead of
  keeping everything in browser state — needed for an admin view of all
  quotes, and for follow-up emails to customers who don't accept within 24
  hours.
- **Real payment processing** (e.g. Stripe Checkout/Payment Intents) for the
  "Pay now" option — the button currently just moves to a confirmation screen.
- **Photo storage** (e.g. S3 or Cloudinary) instead of holding images as data
  URLs in memory — needed once photos must survive a page refresh or reach a
  backend.
- **Email delivery** — a copy of the checklist to you (the packer) as well as
  the customer, and quote-acceptance confirmations. The checklist doesn't
  need to be a PDF for this; a plain checkable list works fine by email or
  on a web page — the PDF is a nice-to-have for printing.
- **Real van hire integration** with your transport partner's pricing/
  availability, replacing the estimated range in `lib/pricing.ts`.
- **Road-distance routing** (e.g. Google/Mapbox Directions) instead of the
  straight-line estimate in `lib/distance.ts`, if you want a more accurate
  travel charge.
