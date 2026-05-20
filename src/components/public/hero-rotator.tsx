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

function preloadHeroImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => {
      if (image.decode) {
        image.decode().then(resolve).catch(resolve);
        return;
      }
      resolve();
    };
    image.onerror = () => reject(new Error("Hero image failed to load."));
    image.src = src;
  });
}

export function HeroRotator({ photos }: { photos: HeroPhoto[] }) {
  const pinned = photos.find((photo) => photo.pinned_hero);
  const [index, setIndex] = useState(0);
  const active = pinned ?? photos[index];
  const [displayedPhoto, setDisplayedPhoto] = useState<HeroPhoto | null>(active ?? null);
  const [previousPhoto, setPreviousPhoto] = useState<HeroPhoto | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const displayedPhotoRef = useRef<HeroPhoto | null>(displayedPhoto);
  const transitionRef = useRef(0);

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

    const transitionId = transitionRef.current + 1;
    transitionRef.current = transitionId;
    let cancelled = false;
    let frame = 0;
    let cleanup = 0;

    async function switchWhenReady() {
      const nextPath = getHeroImagePath(nextPhoto);
      if (nextPath) {
        try {
          await preloadHeroImage(nextPath);
        } catch {
          return;
        }
      }
      if (cancelled || transitionRef.current !== transitionId) return;

      setPreviousPhoto(displayedPhotoRef.current);
      setDisplayedPhoto(nextPhoto);
      setIsVisible(false);

      frame = window.requestAnimationFrame(() => setIsVisible(true));
      cleanup = window.setTimeout(() => setPreviousPhoto(null), 700);
    }

    switchWhenReady();
    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (cleanup) window.clearTimeout(cleanup);
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
