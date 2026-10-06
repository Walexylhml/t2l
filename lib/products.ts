import { createClient } from "@supabase/supabase-js"

export const SIZES = ["S", "M", "L", "XL", "2XL"] as const
export type Size = (typeof SIZES)[number]

export const CATEGORIES = [
  { slug: "pop-culture", label: "Pop Culture" },
  { slug: "social-cause", label: "Social Cause" },
  { slug: "originals", label: "Originals" },
  { slug: "horror", label: "Horror" },
] as const
export type CategorySlug = (typeof CATEGORIES)[number]["slug"]

export type Product = {
  id: string
  slug: string
  name: string
  /** Price in cents, ready to map onto Stripe unit_amount. */
  price: number
  category: CategorySlug
  garment: "Tee" | "Hoodie" | "Crewneck"
  image: string
  description: string
  featured?: boolean
  badge?: string
}

// ---------------------------------------------------------------------------
// Catalog now lives in the Supabase "products" table (see supabase/products.sql).
// Uses the public anon key + the "products_select_active" row-level-security
// policy, so these getters only ever return ACTIVE products to shoppers.
// The anon key is public by design, so this module is safe on server or client.
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

type ProductRow = {
  id: string
  slug: string
  name: string
  price: number
  category: string
  garment: string
  image: string
  description: string | null
  featured: boolean | null
  badge: string | null
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    category: row.category as CategorySlug,
    garment: row.garment as Product["garment"],
    image: row.image,
    description: row.description ?? "",
    featured: row.featured ?? false,
    badge: row.badge ?? undefined,
  }
}

async function fetchActiveProducts(): Promise<Product[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, price, category, garment, image, description, featured, badge")
    .eq("active", true)
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("[products] fetch failed:", error.message)
    return []
  }
  return (data as ProductRow[]).map(toProduct)
}

export async function getProducts(category?: string): Promise<Product[]> {
  const products = await fetchActiveProducts()
  if (!category) return products
  return products.filter((product) => product.category === category)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await fetchActiveProducts()
  return products.filter((product) => product.featured)
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await fetchActiveProducts()
  return products.find((product) => product.slug === slug)
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await fetchActiveProducts()
  const sameCategory = products.filter(
    (p) => p.id !== product.id && p.category === product.category
  )
  const others = products.filter((p) => p.id !== product.id && p.category !== product.category)
  return [...sameCategory, ...others].slice(0, limit)
}

export function getCategoryLabel(slug: CategorySlug): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export function formatPrice(cents: number): string {
  return currencyFormatter.format(cents / 100)
}
