export type SelectedLayoutPhoto = {
  id: string;
  image_width: number | null;
  image_height: number | null;
  selected_order?: number | null;
};

export type SelectedLayoutItemInput = {
  photo_id: string;
  desktop_x?: number | null;
  desktop_y?: number | null;
  desktop_width?: number | null;
  desktop_z_index?: number | null;
  mobile_order?: number | null;
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
