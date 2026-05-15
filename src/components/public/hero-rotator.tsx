"use client";

import { useEffect, useState } from "react";
import { getPhotoVisualStyle, getPublicImageUrl } from "@/lib/public/visuals";
import styles from "./hero-rotator.module.css";

type HeroPhoto = {
  id: string;
  public_image_path: string | null;
  pinned_hero: boolean;
};

export function HeroRotator({ photos }: { photos: HeroPhoto[] }) {
  const pinned = photos.find((photo) => photo.pinned_hero);
  const [index, setIndex] = useState(0);
  const active = pinned ?? photos[index];

  useEffect(() => {
    if (pinned || photos.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % photos.length), 8000);
    return () => window.clearInterval(timer);
  }, [photos.length, pinned]);

  const imageUrl = getPublicImageUrl(active?.public_image_path ?? null);

  return (
    <div
      className={styles.hero}
      style={
        imageUrl
          ? { backgroundImage: `url(${imageUrl})` }
          : { background: getPhotoVisualStyle(active?.id ?? "hero") }
      }
    />
  );
}
