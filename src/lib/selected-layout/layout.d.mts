export type SelectedLayoutPhoto = {
  id: string;
  image_width: number | string | null;
  image_height: number | string | null;
  selected_order?: number | string | null;
};

export type SelectedLayoutItemInput = {
  photo_id: string;
  desktop_x?: number | string | null;
  desktop_y?: number | string | null;
  desktop_width?: number | string | null;
  desktop_z_index?: number | string | null;
  mobile_order?: number | string | null;
  caption?: string | null;
};

export type SelectedLayoutItem = {
  photo_id: string;
  desktop_x: number;
  desktop_y: number;
  desktop_width: number;
  desktop_z_index: number;
  mobile_order: number | null;
  caption: string | null;
};

export const SELECTED_LAYOUT_CAPTION_LIMIT: 280;
export const SELECTED_LAYOUT_MIN_WIDTH: 8;
export const SELECTED_LAYOUT_DEFAULT_WIDTH: 28;

export function normalizeSelectedLayoutItem(item: SelectedLayoutItemInput): SelectedLayoutItem;
export function buildDefaultSelectedLayoutItems(photos: SelectedLayoutPhoto[]): SelectedLayoutItem[];
export function validateSelectedLayoutItems(
  items: SelectedLayoutItemInput[],
  selectedPhotoIds: Set<string>,
): { ok: true; errors: [] } | { ok: false; errors: string[] };
export function mergeSelectedLayoutItems(
  photos: SelectedLayoutPhoto[],
  existingItems: SelectedLayoutItemInput[],
): SelectedLayoutItem[];
