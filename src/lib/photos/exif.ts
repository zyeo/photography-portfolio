import { parse } from "exifr";

export type NormalizedExif = {
  dateTaken: string | null;
  camera: string | null;
  lens: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  latitude: number | null;
  longitude: number | null;
};

type RawExif = {
  DateTimeOriginal?: Date;
  CreateDate?: Date;
  Make?: string;
  Model?: string;
  LensModel?: string;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  latitude?: number;
  longitude?: number;
};

function formatAperture(value?: number) {
  return value ? `f/${Number.isInteger(value) ? value : value.toFixed(1)}` : null;
}

function formatShutterSpeed(value?: number) {
  if (!value) return null;
  if (value >= 1) return `${value}s`;
  return `1/${Math.round(1 / value)}`;
}

function formatCamera(make?: string, model?: string) {
  return [make, model].filter(Boolean).join(" ") || null;
}

export async function extractExif(buffer: ArrayBuffer): Promise<NormalizedExif> {
  const exif = (await parse(buffer, {
    pick: [
      "DateTimeOriginal",
      "CreateDate",
      "Make",
      "Model",
      "LensModel",
      "FNumber",
      "ExposureTime",
      "ISO",
      "latitude",
      "longitude",
    ],
  })) as RawExif | undefined;

  const date = exif?.DateTimeOriginal ?? exif?.CreateDate;

  return {
    dateTaken: date ? date.toISOString() : null,
    camera: formatCamera(exif?.Make, exif?.Model),
    lens: exif?.LensModel ?? null,
    aperture: formatAperture(exif?.FNumber),
    shutterSpeed: formatShutterSpeed(exif?.ExposureTime),
    iso: exif?.ISO ?? null,
    latitude: exif?.latitude ?? null,
    longitude: exif?.longitude ?? null,
  };
}
