# SecureWrap Removals

A marketing site and instant-quote tool for a home removal/packing company,
based in Milton Keynes (MK13 0BG) and covering the UK nationwide. Customers
upload photos of the items they need wrapped, name each one and choose wrap
type(s) and size, enter a collection address and a destination address (new
home, storage facility, or a UK depot for export packing abroad), pick a
move date and optional van hire, and get an instant quote — pay now, or pay
on the day for a flat surcharge. On acceptance they get a booking reference,
a confirmation email with a PDF receipt attached, and a shared web checklist
they and the crew can tick off from any phone. They can also look up an
accepted booking later by reference + postcode (no account needed) to view
it or ask for items to be added or removed.

Every quote reached — accepted or not — is recorded with the customer's
email, so a follow-up email goes out automatically after 24 hours if they
haven't booked, and you can see every quote in a password-protected
`/admin` dashboard.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- lucide-react for icons
- jsPDF for the checklist PDF (client-side) and the receipt PDF (server-side, email attachment)
- [postcodes.io](https://postcodes.io) (free, no key) — postcode → lat/lon + town
- [Overpass/OpenStreetMap](https://overpass-api.de) (free, no key) — premise-level addresses for a postcode
- [getaddress.io](https://getaddress.io) (optional, paid) — fuller/PAF-complete address lists, if you want them
- [Supabase](https://supabase.com) (optional, free tier) — Postgres + Storage for persisting quotes and photos
- [Resend](https://resend.com) (optional, free tier) — email (customer confirmation + receipt, packer copy, 24hr follow-up, change requests)

Every one of Supabase/Resend/getaddress.io is optional and independent: with
none configured, the site still runs as a fully working instant-quote tool
with free address lookup — it just doesn't persist anything or send email.
See **Backend setup** below to turn on quote storage, email, the admin
dashboard and booking lookup.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Editing prices

All rates live in **[`data/prices.json`](data/prices.json)** — callout fee,
wrap-type factors, size multipliers, van hire fees and MPG, diesel price,
margins, the pay-on-day surcharge, and the item-type catalog (e.g. "a TV
costs about £30 to wrap"). Edit that file and restart `npm run dev` (or
redeploy) — `lib/pricing.ts` and `lib/itemCatalog.ts` read from it directly,
so there's nowhere else prices need updating.

## Project structure

```
data/
  prices.json                 All rates and the item-type catalog — edit this for pricing changes
app/
  page.tsx                    Homepage
  services/page.tsx            Services overview
  contact/page.tsx              Contact page
  quote/page.tsx                 Instant quote wizard
  booking/page.tsx                 "My booking" — look up an accepted booking by ref + postcode
  checklist/[id]/page.tsx            Shared web checklist (customer + packer)
  admin/page.tsx                       All quotes (password-gated)
  admin/login/page.tsx                   Admin sign-in
  api/address/lookup/route.ts       Server route: postcode → addresses (getaddress.io, else free OSM)
  api/distance/route.ts              Server route: postcode(s) → miles from base / journey miles
  api/quotes/route.ts                  Server route: record a quote (Supabase)
  api/quotes/[id]/accept/route.ts        Server route: mark accepted, send emails
  api/quotes/[id]/checklist/route.ts      Server route: toggle a checklist item
  api/quotes/receipt/route.ts               Server route: email fallback when Supabase isn't configured
  api/booking/lookup/route.ts                Server route: find an accepted booking by ref + postcode
  api/booking/change-request/route.ts          Server route: email a request to add/remove items
  api/admin/login, api/admin/logout              Admin session cookie
  api/cron/follow-up/route.ts                      24hr follow-up email job (see vercel.json)
middleware.ts                  Gates /admin/* behind the admin password
components/
  Header.tsx, Footer.tsx, Hero.tsx, WhyTrustUs.tsx, ...   Marketing sections
  admin/LogoutButton.tsx                                    Admin sign-out
  booking/BookingLookup.tsx                                   "My booking" lookup + change-request form
  checklist/ChecklistView.tsx                                   Interactive checklist (tap to tick)
  quote/                                                    Multi-step quote wizard
    QuoteWizard.tsx      Step orchestration + state (also persists/accepts the quote server-side)
    StepUpload.tsx        Photo upload (camera, library, or drag-and-drop)
    StepWrapping.tsx       Item type, wrap type(s) & size per item
    StepProperty.tsx        Contact + collection & destination address + property details
    AddressFields.tsx        Shared postcode/address lookup UI (used for both addresses)
    StepSchedule.tsx         Date, time slot, van hire (with size recommendation)
    StepQuote.tsx             Price breakdown + accept
    Confirmation.tsx           Booking confirmation + checklist link/download + "My booking" pointer
lib/
  types.ts        Shared client-side types
  itemCatalog.ts  Item-type helpers, reading from data/prices.json
  pricing.ts      Quote calculation engine, reading rates from data/prices.json
  distance.ts     Haversine distance + postcode normalising, from our MK13 0BG base
  postcodes.ts    Shared postcodes.io lookup (full postcode, falls back to outward code)
  quoteApi.ts     Client-side fetch helpers for all API routes
  checklist.ts    Client-side checklist PDF generator (download button)
  receiptPdf.ts   Server-side receipt PDF generator (email attachment)
  supabase.ts     Server-only Supabase client (service role key)
  quotes.ts       Server-only quote persistence + photo upload + checklist state + booking lookup
  publicBooking.ts  Strips a QuoteRecord down to what's safe to show/email a customer
  rateLimit.ts    Simple in-memory rate limiter for the public booking endpoints
  email.ts        Server-only Resend email templates
  bookingRef.ts   Shared booking-reference generator
supabase/
  schema.sql     Run once in Supabase's SQL editor to create the tables
vercel.json      Schedules the 24hr follow-up cron job (Vercel only)
```

## Pricing

The calculation lives in [`lib/pricing.ts`](lib/pricing.ts); the actual rate
card is [`data/prices.json`](data/prices.json). The full model, in order:

1. Callout & materials fee
2. Per-item wrapping cost — **item type base price** (from the catalog) **×
   size multiplier × combined wrap-type factor**. Customers can pick more
   than one wrap type per item (e.g. bubble wrap + a box) — the first
   selected counts in full, each additional one adds at half its normal
   rate. There's no generic "Other item" fallback price — if a photo's item
   type can't be matched, the customer must pick a real one before they can
   continue, so nothing gets priced off a made-up guess.
3. Van, if one's booked:
   - Bringing your own van costs a flat loading fee (the crew still loads it for you).
   - Hiring one of ours is a fixed hire fee per size, plus **real fuel
     cost** worked out from the actual journey — collection address →
     destination address → back to our MK13 0BG depot — converted from
     miles to litres by the van's MPG, at the diesel price in
     `data/prices.json`. A size is recommended from the items uploaded (so
     10 boxes doesn't suggest a Luton van).
4. Weekend / evening surcharges
5. A service & handling margin, applied to everything above — **20%
   normally, 30% if the collection postcode is more than 40 miles from our
   Milton Keynes base** (covers crew travel time to reach the property;
   floors, stairs and room count are folded into this margin rather than
   itemised separately). Van fuel has its own real cost, above.
6. **Pay on the day costs a flat surcharge more than paying now** — the
   quoted price is the pay-now price; paying the crew on the day is that
   plus `payOnDaySurcharge`. Booking in advance is always cheaper.

If the journey/distance can't be confirmed yet (address not fully resolved),
the quote still generates instantly using sensible fallbacks, with a note
that the price may be adjusted once both postcodes are confirmed — it never
blocks on this.

## Address lookup

The postcode field's "Find address" button works two ways:

- With `GETADDRESS_API_KEY` set, it uses getaddress.io's Find API for a
  complete, PAF-accurate address list.
- Without it (the default), it uses **free** sources: postcodes.io for the
  postcode's location, and OpenStreetMap's Overpass API for any addresses
  tagged with that postcode. Coverage varies by area — OSM has good data in
  many places but isn't complete — so the customer can always fall back to
  typing the address manually, and if the postcode is only partially
  recognised (e.g. just "MK13"), distance falls back to an area-level
  estimate rather than failing outright.

The same lookup is used for both the collection and destination address
(`components/quote/AddressFields.tsx`), and once both are known the app
calculates the real journey distance for van fuel.

## Backend setup

None of this is required to run the site — skip it and everything above
still works. Do this when you want quotes recorded, emails sent, the admin
dashboard populated, and booking lookup available.

**1. Supabase (quote storage + photos)**

- Create a project at [supabase.com](https://supabase.com).
- Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
- Under Storage, create a **public** bucket named `item-photos`.
- Under Project Settings → API, copy the URL and the **service role** key
  (not the anon key) into `.env.local` (and into Vercel's environment
  variables for production) as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
  The service role key is a secret — never expose it to the browser or
  commit it.

Without this: quotes aren't saved, the shared checklist has nothing to
persist ticks to, "My booking" has nothing to look up, `/admin` is empty,
and the 24-hour follow-up has nothing to send.

**2. Resend (email)**

- Create a free account at [resend.com](https://resend.com) and get an API key.
- Set `RESEND_API_KEY`. For quick testing you can leave `RESEND_FROM_EMAIL`
  unset (it sends from `onboarding@resend.dev`); for production, verify
  your own sending domain in Resend and set `RESEND_FROM_EMAIL` to an
  address on it.
- Set `PACKER_EMAIL` to your own inbox, to receive a copy of every accepted
  job.

**3. Admin dashboard**

- Set `ADMIN_PASSWORD` to something you don't use elsewhere. Visit `/admin`
  and sign in — the whole `/admin` section is gated by `middleware.ts`
  behind this one password (no separate accounts; fine for a single owner,
  swap in real auth if that changes).

**4. 24-hour follow-up (Vercel only)**

- `vercel.json` already schedules `/api/cron/follow-up` to run once daily.
  Once deployed on Vercel with Supabase and Resend configured, it just
  works — Vercel calls the endpoint on schedule.
- Set `CRON_SECRET` to a random string once deployed; Vercel automatically
  sends it as a Bearer token, which the route checks. Without it the
  endpoint is open to anyone who finds the URL — fine for local testing,
  not for production.
- Vercel's Hobby plan limits cron jobs to once a day, so a quote can be
  followed up anywhere from 24–48 hours after it was reached, depending on
  when in the day it crossed the 24-hour mark. On a paid plan you can
  schedule it more often.

**5. Site URL for email links**

- Set `NEXT_PUBLIC_SITE_URL` to your real deployed URL (e.g.
  `https://securewrapremovals.co.uk`) once live, so links in emails (the
  checklist, "My booking") point somewhere real. Defaults to localhost for
  dev.

See [`.env.example`](.env.example) for the full list with inline comments.

## Trust content

There's a "Why customers choose us" section (`components/WhyTrustUs.tsx`) on
the homepage. Since there are no reviews yet, it deliberately avoids star
ratings or testimonials and instead states concrete, true things about the
service (insurance, DBS-checked crew, itemised pricing, the checklist
system). Once you have real reviews (e.g. Google Business Profile,
Trustpilot), swap this out for an embed or a `Reviews` section — don't
replace it with invented quotes or ratings.

## Next steps for production

- **Real payment processing** (e.g. Stripe Checkout/Payment Intents) for the
  "Pay now" option — accepting currently just records the booking and sends
  confirmation email; no card is actually charged.
- **Photo storage limits/cleanup** — Supabase Storage on the free tier has a
  cap; if photo volume grows, consider expiring old unaccepted quotes'
  photos.
- **Real van hire integration** with your transport partner's pricing/
  availability, replacing the fixed hire fees in `data/prices.json`.
- **Road-distance routing** (e.g. Google/Mapbox Directions) instead of the
  straight-line estimate in `lib/distance.ts`, if you want journey mileage
  (and therefore fuel cost) to be more accurate than "as the crow flies".
- **Real auth for `/admin`** if more than one person needs access, or you
  want per-user activity history — the current single shared password is
  fine for one owner.
