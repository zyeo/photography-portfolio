export function getPhotoVisualStyle(seed: string) {
  const palettes = [
    "linear-gradient(135deg, #26221f, #65584d)",
    "linear-gradient(135deg, #1d2328, #59666b)",
    "linear-gradient(135deg, #3d342e, #a18d73)",
    "linear-gradient(135deg, #252220, #6a625b)",
  ];
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

export function getPublicImageUrl(path: string | null) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/public-images/${path}`;
}
