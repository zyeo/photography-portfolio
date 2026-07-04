export const SELECTED_LAYOUT_CAPTION_LIMIT = 280;
export const SELECTED_LAYOUT_MIN_WIDTH = 8;
export const SELECTED_LAYOUT_DEFAULT_WIDTH = 28;

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizedOrder(value) {
  if (!Number.isFinite(value) || value < 1) return null;
  return Math.round(value);
}

function normalizedCaption(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, SELECTED_LAYOUT_CAPTION_LIMIT) : null;
}

export function normalizeSelectedLayoutItem(item) {
  const desktopWidth = clamp(
    finiteNumber(item.desktop_width, SELECTED_LAYOUT_DEFAULT_WIDTH),
    SELECTED_LAYOUT_MIN_WIDTH,
    100,
  );

  return {
    photo_id: String(item.photo_id ?? ""),
    desktop_x: clamp(finiteNumber(item.desktop_x, 0), 0, 100 - desktopWidth),
    desktop_y: Math.max(finiteNumber(item.desktop_y, 0), 0),
    desktop_width: desktopWidth,
    desktop_z_index: Math.round(finiteNumber(item.desktop_z_index, 0)),
    mobile_order: normalizedOrder(item.mobile_order),
    caption: normalizedCaption(item.caption),
  };
}

function sortedPhotos(photos) {
  return [...photos].sort((a, b) => {
    const orderA = Number.isFinite(a.selected_order) ? Number(a.selected_order) : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(b.selected_order) ? Number(b.selected_order) : Number.MAX_SAFE_INTEGER;
    return orderA - orderB || String(a.id).localeCompare(String(b.id));
  });
}

function aspectRatio(photo) {
  return photo.image_width && photo.image_height ? photo.image_width / photo.image_height : 1.3;
}

function desktopPreset(index, photo) {
  const ratio = aspectRatio(photo);
  const row = Math.floor(index / 3);
  const slot = index % 3;
  const baseY = row * 42;
  const width = index === 0 ? 56 : ratio < 0.85 ? 24 : ratio > 1.8 ? 40 : 30;
  const xBySlot = [0, 62, 18];
  const yBySlot = [0, 8, 26];

  if (index === 0) {
    return { desktop_x: 0, desktop_y: 0, desktop_width: width };
  }

  return {
    desktop_x: clamp(xBySlot[slot] ?? 0, 0, 100 - width),
    desktop_y: baseY + (yBySlot[slot] ?? 0),
    desktop_width: width,
  };
}

export function buildDefaultSelectedLayoutItems(photos) {
  return sortedPhotos(photos).map((photo, index) =>
    normalizeSelectedLayoutItem({
      photo_id: photo.id,
      ...desktopPreset(index, photo),
      desktop_z_index: 0,
      mobile_order: index + 1,
      caption: null,
    }),
  );
}

export function validateSelectedLayoutItems(items, selectedPhotoIds) {
  const errors = [];
  const seen = new Set();

  for (const rawItem of items) {
    const item = normalizeSelectedLayoutItem(rawItem);

    if (!item.photo_id) {
      errors.push("Each layout item needs a photo id.");
      continue;
    }

    if (seen.has(item.photo_id)) {
      errors.push(`Photo ${item.photo_id} appears more than once.`);
    }

    if (!selectedPhotoIds.has(item.photo_id)) {
      errors.push(`Photo ${item.photo_id} is not in Selected.`);
    }

    seen.add(item.photo_id);
  }

  return errors.length ? { ok: false, errors } : { ok: true, errors: [] };
}

export function mergeSelectedLayoutItems(photos, existingItems) {
  const existingByPhotoId = new Map(existingItems.map((item) => [item.photo_id, item]));
  return buildDefaultSelectedLayoutItems(photos).map((defaultItem) =>
    normalizeSelectedLayoutItem({
      ...defaultItem,
      ...(existingByPhotoId.get(defaultItem.photo_id) ?? {}),
    }),
  );
}
