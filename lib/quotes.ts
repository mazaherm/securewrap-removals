import { getSupabaseAdmin } from "./supabase";
import { extensionForMediaType, parseDataUrl } from "./dataUrl";
import type { PaymentOption } from "./types";

const PHOTO_BUCKET = "item-photos";

export interface QuoteRecordItem {
  id: string;
  label: string;
  itemType: string;
  wrapTypes: string[];
  size: string;
  photoUrl: string;
}

export interface QuoteLineItemRecord {
  label: string;
  amount: number;
  detail?: string;
}

export interface QuoteRecord {
  id: string;
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  propertyType: string;
  floors: number;
  hasLift: boolean;
  rooms: number;
  destinationType: string;
  destinationAddressLine1: string;
  destinationAddressLine2: string;
  destinationCity: string;
  destinationPostcode: string;
  distanceMiles: number | null;
  distanceApproximate: boolean;
  journeyMiles: number | null;
  moveDate: string;
  timeSlot: string;
  vanSize: string;
  items: QuoteRecordItem[];
  lineItems: QuoteLineItemRecord[];
  subtotal: number;
  payNowTotal: number;
  payOnDayTotal: number;
  paymentOption: PaymentOption | null;
  acceptedAt: string | null;
  followUpSentAt: string | null;
  createdAt: string;
}

export interface CreateQuoteInput {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  propertyType: string;
  floors: number;
  hasLift: boolean;
  rooms: number;
  destinationType: string;
  destinationAddressLine1: string;
  destinationAddressLine2: string;
  destinationCity: string;
  destinationPostcode: string;
  distanceMiles: number | null;
  distanceApproximate: boolean;
  journeyMiles: number | null;
  moveDate: string;
  timeSlot: string;
  vanSize: string;
  items: QuoteRecordItem[]; // photoUrl may still be a data: URL here — uploaded during creation
  lineItems: QuoteLineItemRecord[];
  subtotal: number;
  payNowTotal: number;
  payOnDayTotal: number;
}

/** Shape of a raw row from Supabase (snake_case) — supabase-js returns
 * untyped rows without generated Database types, so this is the one place
 * that trusts the shape matches supabase/schema.sql. */
interface QuoteRow {
  id: string;
  booking_ref: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  property_type: string | null;
  floors: number | null;
  has_lift: boolean | null;
  rooms: number | null;
  destination_type: string | null;
  dest_address_line1: string | null;
  dest_address_line2: string | null;
  dest_city: string | null;
  dest_postcode: string | null;
  distance_miles: number | null;
  distance_approximate: boolean | null;
  journey_miles: number | null;
  move_date: string | null;
  time_slot: string | null;
  van_size: string | null;
  items: QuoteRecordItem[] | null;
  line_items: QuoteLineItemRecord[] | null;
  subtotal: number | null;
  pay_now_total: number | null;
  pay_on_day_total: number | null;
  payment_option: PaymentOption | null;
  accepted_at: string | null;
  follow_up_sent_at: string | null;
  created_at: string;
}

function mapRowToRecord(row: QuoteRow): QuoteRecord {
  return {
    id: row.id,
    bookingRef: row.booking_ref,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone ?? "",
    addressLine1: row.address_line1 ?? "",
    addressLine2: row.address_line2 ?? "",
    city: row.city ?? "",
    postcode: row.postcode ?? "",
    propertyType: row.property_type ?? "",
    floors: row.floors ?? 0,
    hasLift: Boolean(row.has_lift),
    rooms: row.rooms ?? 0,
    destinationType: row.destination_type ?? "",
    destinationAddressLine1: row.dest_address_line1 ?? "",
    destinationAddressLine2: row.dest_address_line2 ?? "",
    destinationCity: row.dest_city ?? "",
    destinationPostcode: row.dest_postcode ?? "",
    distanceMiles: row.distance_miles ?? null,
    distanceApproximate: Boolean(row.distance_approximate),
    journeyMiles: row.journey_miles ?? null,
    moveDate: row.move_date ?? "",
    timeSlot: row.time_slot ?? "",
    vanSize: row.van_size ?? "",
    items: row.items ?? [],
    lineItems: row.line_items ?? [],
    subtotal: Number(row.subtotal ?? 0),
    payNowTotal: Number(row.pay_now_total ?? 0),
    payOnDayTotal: Number(row.pay_on_day_total ?? 0),
    paymentOption: row.payment_option ?? null,
    acceptedAt: row.accepted_at ?? null,
    followUpSentAt: row.follow_up_sent_at ?? null,
    createdAt: row.created_at,
  };
}

/** Uploads any base64 item photos to Supabase Storage, returning the same
 * items with photoUrl replaced by a public Storage URL. If the upload
 * fails, the original data URL is kept so the item still has an image. */
async function uploadItemPhotos(quoteId: string, items: QuoteRecordItem[]): Promise<QuoteRecordItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return items;

  return Promise.all(
    items.map(async (item) => {
      const parsed = parseDataUrl(item.photoUrl);
      if (!parsed) return item; // already a URL (or unrecognised) — leave as-is
      try {
        const path = `${quoteId}/${item.id}.${extensionForMediaType(parsed.mediaType)}`;
        const buffer = Buffer.from(parsed.base64, "base64");
        const { error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, buffer, { contentType: parsed.mediaType, upsert: true });
        if (error) return item;
        const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
        return { ...item, photoUrl: data.publicUrl };
      } catch {
        return item;
      }
    })
  );
}

/** Persists a new quote (called once the customer reaches the final quote
 * step), recording their email even before they accept. Returns null when
 * Supabase isn't configured — callers should treat that as "skip
 * persistence" rather than an error. */
export async function createQuote(input: CreateQuoteInput): Promise<QuoteRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: inserted, error: insertError } = await supabase
    .from("quotes")
    .insert({
      booking_ref: input.bookingRef,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      city: input.city,
      postcode: input.postcode,
      property_type: input.propertyType,
      floors: input.floors,
      has_lift: input.hasLift,
      rooms: input.rooms,
      destination_type: input.destinationType,
      dest_address_line1: input.destinationAddressLine1,
      dest_address_line2: input.destinationAddressLine2,
      dest_city: input.destinationCity,
      dest_postcode: input.destinationPostcode,
      distance_miles: input.distanceMiles,
      distance_approximate: input.distanceApproximate,
      journey_miles: input.journeyMiles,
      move_date: input.moveDate || null,
      time_slot: input.timeSlot,
      van_size: input.vanSize,
      items: input.items,
      line_items: input.lineItems,
      subtotal: input.subtotal,
      pay_now_total: input.payNowTotal,
      pay_on_day_total: input.payOnDayTotal,
    })
    .select()
    .single();

  if (insertError || !inserted) return null;

  const itemsWithPhotos = await uploadItemPhotos(inserted.id, input.items);
  if (itemsWithPhotos.some((item, i) => item.photoUrl !== input.items[i]?.photoUrl)) {
    await supabase.from("quotes").update({ items: itemsWithPhotos }).eq("id", inserted.id);
    inserted.items = itemsWithPhotos;
  }

  return mapRowToRecord(inserted);
}

export async function getQuoteById(id: string): Promise<QuoteRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.from("quotes").select().eq("id", id).single();
  if (error || !data) return null;
  return mapRowToRecord(data);
}

export async function acceptQuote(id: string, paymentOption: PaymentOption): Promise<QuoteRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("quotes")
    .update({ payment_option: paymentOption, accepted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;
  return mapRowToRecord(data);
}

export async function listQuotes(): Promise<QuoteRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("quotes").select().order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRowToRecord);
}

/** Quotes older than 24 hours, never accepted, never followed up — for the cron job. */
export async function listQuotesDueForFollowUp(): Promise<QuoteRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("quotes")
    .select()
    .is("accepted_at", null)
    .is("follow_up_sent_at", null)
    .lt("created_at", cutoff);
  if (error || !data) return [];
  return data.map(mapRowToRecord);
}

export async function markFollowUpSent(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("quotes").update({ follow_up_sent_at: new Date().toISOString() }).eq("id", id);
}

export async function getChecklistState(quoteId: string): Promise<Record<string, boolean>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return {};
  const { data, error } = await supabase.from("checklist_state").select().eq("quote_id", quoteId);
  if (error || !data) return {};
  const state: Record<string, boolean> = {};
  for (const row of data) state[row.item_id] = row.checked;
  return state;
}

export async function setChecklistItemState(quoteId: string, itemId: string, checked: boolean): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase
    .from("checklist_state")
    .upsert(
      { quote_id: quoteId, item_id: itemId, checked, updated_at: new Date().toISOString() },
      { onConflict: "quote_id,item_id" }
    );
}
