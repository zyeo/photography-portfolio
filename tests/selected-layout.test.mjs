import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDefaultSelectedLayoutItems,
  normalizeSelectedLayoutItem,
  validateSelectedLayoutItems,
} from "../src/lib/selected-layout/layout.mjs";

const photos = [
  { id: "lead", image_width: 1600, image_height: 1000, selected_order: 1 },
  { id: "portrait", image_width: 900, image_height: 1400, selected_order: 2 },
  { id: "wide", image_width: 1800, image_height: 900, selected_order: 3 },
];

test("buildDefaultSelectedLayoutItems creates a desktop spread and mobile order", () => {
  const items = buildDefaultSelectedLayoutItems(photos);

  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((item) => item.photo_id),
    ["lead", "portrait", "wide"],
  );
  assert.equal(items[0].desktop_width, 56);
  assert.equal(items[0].desktop_x, 0);
  assert.equal(items[1].desktop_x > items[0].desktop_x, true);
  assert.deepEqual(
    items.map((item) => item.mobile_order),
    [1, 2, 3],
  );
});

test("normalizeSelectedLayoutItem clamps unsafe values and trims captions", () => {
  const item = normalizeSelectedLayoutItem({
    photo_id: "lead",
    desktop_x: -10,
    desktop_y: Number.NaN,
    desktop_width: 400,
    desktop_z_index: 4.4,
    mobile_order: -1,
    caption: `  ${"A".repeat(500)}  `,
  });

  assert.equal(item.desktop_x, 0);
  assert.equal(item.desktop_y, 0);
  assert.equal(item.desktop_width, 100);
  assert.equal(item.desktop_z_index, 4);
  assert.equal(item.mobile_order, null);
  assert.equal(item.caption.length, 280);
});

test("validateSelectedLayoutItems rejects duplicate and unknown photos", () => {
  assert.deepEqual(
    validateSelectedLayoutItems(
      [
        { photo_id: "lead", desktop_x: 0, desktop_y: 0, desktop_width: 40 },
        { photo_id: "lead", desktop_x: 10, desktop_y: 10, desktop_width: 40 },
        { photo_id: "ghost", desktop_x: 10, desktop_y: 20, desktop_width: 40 },
      ],
      new Set(["lead"]),
    ),
    {
      ok: false,
      errors: [
        "Photo lead appears more than once.",
        "Photo ghost is not in Selected.",
      ],
    },
  );
});
