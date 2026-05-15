import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const baseUrl = "https://photos.zachyeo.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: entries }, { data: collections }] = await Promise.all([
    supabase.from("journal_entries").select("entry_date").eq("published", true),
    supabase.from("collections").select("slug").eq("published", true),
  ]);

  return [
    "",
    "/selected",
    "/journal",
    "/collections",
    "/about",
    ...(entries ?? []).map((entry) => `/journal/${entry.entry_date}`),
    ...(collections ?? []).map((collection) => `/collections/${collection.slug}`),
  ].map((path) => ({ url: `${baseUrl}${path}`, lastModified: new Date() }));
}
