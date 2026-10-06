import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Design Studio garments (blank garment types customers design on).
// Stored in the Supabase "garments" table (see supabase/studio.sql), read with
// the public anon key + the "garments_select_active" RLS policy, so these
// getters only ever return ACTIVE garments to shoppers.
// ---------------------------------------------------------------------------

export const GARMENT_VIEWS = ["front", "back", "arm"] as const
export type GarmentView = (typeof GARMENT_VIEWS)[number]

export const VIEW_LABELS: Record<GarmentView, string> = {
  front: "Front",
  back: "Back",
  arm: "Arm",
}

export type Garment = {
  id: string
  slug: string
  name: string
  /** Base price in cents. */
  basePrice: number
  views: GarmentView[]
  sizes: string[]
  colors: string[]
  imageFront: string | null
  imageBack: string | null
  imageArm: string | null
}

type GarmentRow = {
  id: string
  slug: string
  name: string
  base_price: number
  views: string[] | null
  sizes: string[] | null
  colors: string[] | null
  image_front: string | null
  image_back: string | null
  image_arm: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

function toGarment(row: GarmentRow): Garment {
  const views = (row.views ?? []).filter((v): v is GarmentView =>
    (GARMENT_VIEWS as readonly string[]).includes(v)
  )
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    basePrice: row.base_price,
    views,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    imageFront: row.image_front,
    imageBack: row.image_back,
    imageArm: row.image_arm,
  }
}

export async function getGarments(): Promise<Garment[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("garments")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
  if (error || !data) return []
  return (data as GarmentRow[]).map(toGarment)
}

export async function getGarmentBySlug(slug: string): Promise<Garment | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("garments")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle()
  if (error || !data) return null
  return toGarment(data as GarmentRow)
}

// ---------------------------------------------------------------------------
// Studio print pricing (one configurable row; edited in admin).
// ---------------------------------------------------------------------------

export type StudioSettings = {
  printFeeFront: number // cents
  printFeeBack: number
  printFeeArm: number
  textFee: number
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  printFeeFront: 0,
  printFeeBack: 0,
  printFeeArm: 0,
  textFee: 0,
}

type StudioSettingsRow = {
  print_fee_front: number
  print_fee_back: number
  print_fee_arm: number
  text_fee: number
}

export async function getStudioSettings(): Promise<StudioSettings> {
  if (!supabase) return DEFAULT_STUDIO_SETTINGS
  const { data, error } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle()
  if (error || !data) return DEFAULT_STUDIO_SETTINGS
  const row = data as StudioSettingsRow
  return {
    printFeeFront: row.print_fee_front,
    printFeeBack: row.print_fee_back,
    printFeeArm: row.print_fee_arm,
    textFee: row.text_fee,
  }
}
