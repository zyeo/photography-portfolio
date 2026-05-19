"use client";

import { useEffect, useRef, useState } from "react";
import { getPhotoBackgroundStyle } from "@/lib/public/visuals";
import styles from "./hero-rotator.module.css";

type HeroPhoto = {
  id: string;
  public_image_path: string | null;
  gallery_image_path: string | null;
  pinned_hero: boolean;
};

export function HeroRotator({ photos }: { photos: HeroPhoto[] }) {
  const pinned = photos.find((photo) => photo.pinned_hero);
  const [index, setIndex] = useState(0);
  const active = pinned ?? photos[index];
  const [displayedPhoto, setDisplayedPhoto] = useState<HeroPhoto | null>(active ?? null);
  const [previousPhoto, setPreviousPhoto] = useState<HeroPhoto | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const displayedPhotoRef = useRef<HeroPhoto | null>(displayedPhoto);

  function getHeroImagePath(photo: HeroPhoto | null) {
    return photo?.public_image_path ?? photo?.gallery_image_path ?? null;
  }

  useEffect(() => {
    if (pinned || photos.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % photos.length), 8000);
    return () => window.clearInterval(timer);
  }, [photos.length, pinned]);

  useEffect(() => {
    displayedPhotoRef.current = displayedPhoto;
  }, [displayedPhoto]);

  useEffect(() => {
    const nextPhoto = active ?? null;
    if ((displayedPhotoRef.current?.id ?? null) === (nextPhoto?.id ?? null)) return;

    setPreviousPhoto(displayedPhotoRef.current);
    setDisplayedPhoto(nextPhoto);
    setIsVisible(false);

    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    const cleanup = window.setTimeout(() => setPreviousPhoto(null), 700);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(cleanup);
    };
  }, [active]);

  return (
    <div className={styles.hero}>
      {previousPhoto ? (
        <div
          aria-hidden="true"
          className={styles.layer}
          style={getPhotoBackgroundStyle(previousPhoto.id, getHeroImagePath(previousPhoto))}
        />
      ) : null}
      <div
        aria-hidden="true"
        className={styles.layer}
        data-visible={isVisible}
        style={getPhotoBackgroundStyle(displayedPhoto?.id ?? "hero", getHeroImagePath(displayedPhoto))}
      />
    </div>
  );
}
