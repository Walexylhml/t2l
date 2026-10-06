import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Design Studio design library (what customers drag onto a garment).
// Stored in the Supabase "designs" table (see supabase/studio.sql), read with
// the public anon key + the "designs_select_active" RLS policy.
// ---------------------------------------------------------------------------

// Where a design can be placed. "any" designs fit on any view.
export const PLACEMENTS = ["front", "back", "arm"] as const
export type Placement = (typeof PLACEMENTS)[number]
export type DesignPlacement = Placement | "any"

export const PLACEMENT_LABELS: Record<DesignPlacement, string> = {
  front: "Front",
  back: "Back",
  arm: "Arm",
  any: "Any",
}

export type Design = {
  id: string
  name: string
  image: string
  placement: DesignPlacement
}

type DesignRow = {
  id: string
  name: string
  image: string
  placement: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

function toDesignPlacement(value: string): DesignPlacement {
  return (["front", "back", "arm", "any"] as const).includes(value as DesignPlacement)
    ? (value as DesignPlacement)
    : "any"
}

function toDesign(row: DesignRow): Design {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    placement: toDesignPlacement(row.placement),
  }
}

// Returns active designs. Pass a placement to limit to designs for that
// location; "any"-placement designs are always included since they fit
// anywhere. Omit it to return the whole library (the "All" filter).
export async function getDesigns(placement?: Placement): Promise<Design[]> {
  if (!supabase) return []
  let query = supabase.from("designs").select("*").eq("active", true)
  if (placement) query = query.in("placement", [placement, "any"])
  const { data, error } = await query.order("sort_order", { ascending: true })
  if (error || !data) return []
  return (data as DesignRow[]).map(toDesign)
}
