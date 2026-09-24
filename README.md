# SecureWrap Removals

A marketing site and instant-quote tool for a home removal/packing company,
based in Milton Keynes and covering the UK nationwide. Customers upload
photos of the items they need packed, choose the item type, wrap type(s)
and size themselves, enter collection and destination addresses (with
postcode → address lookup), pick a move date and optional van hire, and
receive an instant quote with a "pay now" or "pay on the day"
option. On acceptance they get a booking reference, a
shared web checklist they and the crew can tick off from any phone (photo +
item type + wrap type + size per item — a PDF download is there too if
wanted, but not required), and a confirmation email. Every quote reached —
accepted or not — is recorded with the customer's email so a follow-up email
goes out automatically after 24 hours if they haven't booked, and you can see
every quote in a password-protected `/admin` dashboard.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- lucide-react for icons
- jsPDF for the client-side checklist PDF
- [postcodes.io](https://postcodes.io) (free, no key needed) for postcode → distance / town lookup
- OpenStreetMap Overpass (free, no key) as the default postcode → address list
- [getaddress.io](https://getaddress.io) (optional, needs a key) for a complete PAF address list
- [Supabase](https://supabase.com) (optional, free tier) — Postgres + Storage for persisting quotes and photos
- [Resend](https://resend.com) (optional, free tier) — email (customer confirmation, packer copy, 24hr follow-up)

Every one of these is optional and independent: with none configured, the
site still runs as a fully working instant-quote tool, it just doesn't
persist anything or send email. See **Backend setup** below to turn on
quote storage, email and the admin dashboard.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Optionally copy `.env.example` to `.env.local` and set
`GETADDRESS_API_KEY` if you want a complete Royal Mail PAF address list
from [getaddress.io](https://getaddress.io). Without it, Find address still
works using free postcodes.io + OpenStreetMap data.

## Project structure

```
app/
  page.tsx                    Homepage
  services/page.tsx            Services overview
  contact/page.tsx              Contact page
  quote/page.tsx                 Instant quote wizard
  checklist/[id]/page.tsx          Shared web checklist (customer + packer)
  admin/page.tsx                    All quotes (password-gated)
  admin/login/page.tsx                Admin sign-in
  api/address/lookup/route.ts       Server route: postcode → list of addresses
  api/distance/route.ts              Server route: postcode → miles from base + van journey
  api/quotes/route.ts                  Server route: record a quote (Supabase)
  api/quotes/[id]/accept/route.ts        Server route: mark accepted, send emails
  api/quotes/[id]/checklist/route.ts      Server route: toggle a checklist item
  api/admin/login, api/admin/logout        Admin session cookie
  api/cron/follow-up/route.ts                24hr follow-up email job (see vercel.json)
middleware.ts                  Gates /admin/* behind the admin password
components/
  Header.tsx, Footer.tsx, Hero.tsx, WhyTrustUs.tsx, ...   Marketing sections
  admin/LogoutButton.tsx                                    Admin sign-out
  checklist/ChecklistView.tsx                                 Interactive checklist (tap to tick)
  quote/                                                    Multi-step quote wizard
    QuoteWizard.tsx      Step orchestration + state (also persists/accepts the quote server-side)
    StepUpload.tsx        Photo upload (camera, library, or drag-and-drop)
    StepWrapping.tsx       Item type, wrap type(s) & size per item (customer-chosen)
    StepProperty.tsx        Contact + collection & destination addresses + property details
    StepSchedule.tsx         Date, time slot, van hire (with size recommendation)
    StepQuote.tsx             Price breakdown + accept
    Confirmation.tsx           Booking confirmation + checklist link/download
lib/
  types.ts       Shared client-side types
  itemCatalog.ts Wrapping price per item type — edit prices here
  pricing.ts     Quote calculation engine + rate card (edit fees/surcharges here)
  distance.ts    Haversine distance calculation from the Milton Keynes base
  quoteApi.ts    Client-side fetch helpers for all API routes
  checklist.ts   PDF checklist generator
  supabase.ts    Server-only Supabase client (service role key)
  quotes.ts      Server-only quote persistence + photo upload + checklist state
  email.ts       Server-only Resend email templates
  bookingRef.ts  Shared booking-reference generator
supabase/
  schema.sql     Run once in Supabase's SQL editor to create the tables
vercel.json      Schedules the 24hr follow-up cron job (Vercel only)
```

## Pricing

The calculation lives in [`lib/pricing.ts`](lib/pricing.ts), with per-item
wrapping prices in [`lib/itemCatalog.ts`](lib/itemCatalog.ts) — that's the one
place to edit "wrapping a TV costs about £30" style prices. The full model,
in order:

1. Callout & materials fee
2. Per-item wrapping cost — **item type base price** (from the catalog,
   picked by the customer) **× size multiplier × combined wrap-type factor**.
   Customers can pick more than one wrap type per item (e.g. bubble wrap + a
   box) — the first selected counts in full, each additional one adds at half
   its normal rate.
3. Stairs/floor access surcharge (property type, floor and lift)
4. Additional-rooms surcharge for larger properties
5. Optional van hire, in two parts:
   - **Vehicle hire** — fixed: £150 small, £200 medium, £250 large
   - **Fuel** — journey miles (collection → destination + destination →
     MK13 0BG depot) ÷ the van's MPG, converted to litres × the diesel price
     (`DIESEL_PRICE_PER_LITRE` in `lib/pricing.ts`, £1.90/L by default)

   If the journey isn't known yet, hire is still quoted and fuel is added
   once both postcodes are confirmed. A van size is recommended based on the
   items uploaded (so 10 boxes doesn't suggest a Luton van).
6. Weekend / evening surcharges
7. A service & handling margin, applied to everything above — **20%
   normally, 30% if the customer's postcode is more than 40 miles from our
   Milton Keynes base** (this is how distance affects the *wrapping* side of
   the job; van travel has its own real cost above)
8. Pay now is the quoted total. Pay on the day adds a £150 surcharge
   (`PAY_ON_DAY_SURCHARGE` in `lib/pricing.ts`) so settling upfront is
   always cheaper.

**Known edge case:** van fuel uses a simple straight-line journey with no
cap. For very long distances you may want to add a maximum for an instant
van quote (e.g. "beyond 100 miles, call us") in `lib/pricing.ts`.

## Address & distance lookup

`StepProperty.tsx` has collection and destination postcode fields with a
"Find address" button:

- `app/api/address/lookup/route.ts` lists addresses at a postcode. If
  `GETADDRESS_API_KEY` is set it uses getaddress.io; otherwise it uses
  postcodes.io (town + coordinates) plus OpenStreetMap Overpass (premises
  when OSM has them). Town is filled in either way so the customer is never
  blocked on a missing paid key.
- Van fuel uses `app/api/distance/route.ts`: collection → destination +
  destination → the MK13 0BG depot. Collection distance from base still
  drives the 20%/30% service margin.
- If a postcode is only partially recognised (e.g. just "MK9"), distance
  falls back to an area-level estimate rather than failing outright.

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
- **Real van hire integration** with your transport partner if you later
  want live availability alongside the fixed hire fees in `lib/pricing.ts`.
- **Road-distance routing** (e.g. Google/Mapbox Directions) instead of the
  straight-line estimate in `lib/distance.ts`, if you want a more accurate
  travel charge.
