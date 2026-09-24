-- SecureWrap Removals — Supabase schema
-- Run this once in your Supabase project's SQL editor (Dashboard → SQL Editor → New query).
-- See README.md "Backend setup" for the full setup steps, including creating
-- the `item-photos` storage bucket (not something SQL can do).

create extension if not exists "pgcrypto";

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  booking_ref text unique not null,

  customer_name text not null,
  customer_email text not null,
  customer_phone text,

  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  property_type text,
  floors integer,
  has_lift boolean,
  rooms integer,
  destination_type text,
  dest_address_line1 text,
  dest_address_line2 text,
  dest_city text,
  dest_postcode text,
  distance_miles numeric,
  distance_approximate boolean default false,
  journey_miles numeric,

  move_date date,
  time_slot text,
  van_size text,

  -- Each item: { id, label, itemType, wrapTypes, size, photoUrl } — photoUrl
  -- points at Supabase Storage once uploaded, not a base64 data URL.
  items jsonb not null default '[]'::jsonb,
  -- The price breakdown lines shown to the customer, for the admin view.
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric,
  pay_now_total numeric,
  pay_on_day_total numeric,

  payment_option text, -- 'pay_now' | 'pay_on_day', set once accepted
  accepted_at timestamptz,
  follow_up_sent_at timestamptz, -- set once the 24hr reminder email has gone out

  created_at timestamptz not null default now()
);

create index if not exists quotes_created_at_idx on quotes (created_at desc);
create index if not exists quotes_follow_up_idx on quotes (accepted_at, follow_up_sent_at, created_at);

-- Per-item tick state for the shared checklist (customer + packer both see
-- the same ticks, from their own phones).
create table if not exists checklist_state (
  quote_id uuid not null references quotes(id) on delete cascade,
  item_id text not null,
  checked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (quote_id, item_id)
);

-- Row-level security: the app only ever talks to this table through the
-- server (service role key), which bypasses RLS entirely — so RLS here is
-- just a safety net against the anon key ever being used directly.
alter table quotes enable row level security;
alter table checklist_state enable row level security;

-- Safe to re-run on an existing project created from an earlier schema.sql.
alter table quotes add column if not exists dest_address_line1 text;
alter table quotes add column if not exists dest_address_line2 text;
alter table quotes add column if not exists dest_city text;
alter table quotes add column if not exists dest_postcode text;
alter table quotes add column if not exists journey_miles numeric;
