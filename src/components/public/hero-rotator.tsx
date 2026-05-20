"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPhotoBackgroundStyle, getPublicImageUrl } from "@/lib/public/visuals";
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
    const timeout = window.setTimeout(() => reject(new Error("Hero image preload timed out.")), 7000);
    image.decoding = "async";
    image.onload = () => {
      if (image.decode) {
        image.decode().then(resolve).catch(resolve).finally(() => window.clearTimeout(timeout));
        return;
      }
      window.clearTimeout(timeout);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Hero image failed to load."));
    };
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
  const failedPreloadIdsRef = useRef<Set<string>>(new Set());

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

  const advancePastFailedPhoto = useCallback((failedId: string) => {
    if (pinned || photos.length < 2) return;
    setIndex((current) => {
      for (let offset = 1; offset < photos.length; offset += 1) {
        const nextIndex = (current + offset) % photos.length;
        const candidate = photos[nextIndex];
        if (candidate.id !== failedId && !failedPreloadIdsRef.current.has(candidate.id)) {
          return nextIndex;
        }
      }
      return current;
    });
  }, [photos, pinned]);

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
      const nextUrl = getPublicImageUrl(nextPath);
      if (nextPath) {
        try {
          if (!nextUrl) return;
          await preloadHeroImage(nextUrl);
          if (nextPhoto) failedPreloadIdsRef.current.delete(nextPhoto.id);
        } catch {
          if (nextPhoto) {
            failedPreloadIdsRef.current.add(nextPhoto.id);
            advancePastFailedPhoto(nextPhoto.id);
          }
          return;
        }
      }
      if (cancelled || transitionRef.current !== transitionId) return;

      setPreviousPhoto(displayedPhotoRef.current);
      setDisplayedPhoto(nextPhoto);
      setIsVisible(false);

      frame = window.requestAnimationFrame(() => setIsVisible(true));
      cleanup = window.setTimeout(() => setPreviousPhoto(null), 900);
    }

    switchWhenReady();
    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (cleanup) window.clearTimeout(cleanup);
    };
  }, [active, advancePastFailedPhoto]);

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
