import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function PublicMenuDefaultPage() {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = createClient();
  }

  // Look up default restaurant
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("slug, id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const targetSlug = restaurant?.slug || restaurant?.id || "palakaluru-grand";
  redirect(`/menu/${targetSlug}`);
}
