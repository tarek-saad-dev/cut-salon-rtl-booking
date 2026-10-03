"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./experience.module.css";

interface SceneMediaProps {
  video?: string;
  poster?: string;
  /** Scene is on screen: play the video. */
  active: boolean;
  /** Scene is current or adjacent: allowed to start loading. */
  near: boolean;
  allowVideo: boolean;
  /** Built-in art shown until real media is uploaded or when it fails. */
  fallback: ReactNode;
  slotName: string;
}

export function SceneMedia({ video, poster, active, near, allowVideo, fallback, slotName }: SceneMediaProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const useVideo = !!video && allowVideo && !videoFailed && near;
  const usePoster = !!poster && !posterFailed;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (active) void element.play().catch(() => {});
    else element.pause();
  }, [active, useVideo]);

  return (
    <div className={styles.media} aria-hidden="true">
      {!usePoster && fallback}
      {usePoster && near && (
        <img
          className={styles.mediaFill}
          src={poster}
          alt=""
          decoding="async"
          onError={() => setPosterFailed(true)}
        />
      )}
      {useVideo && (
        <video
          ref={ref}
          className={styles.mediaFill}
          src={video}
          poster={usePoster ? poster : undefined}
          muted
          loop
          playsInline
          disableRemotePlayback
          preload={active ? "auto" : "metadata"}
          onError={() => setVideoFailed(true)}
        />
      )}
      {process.env.NODE_ENV === "development" && !video && (
        <span className={styles.slotLabel} dir="ltr">
          MEDIA SLOT · {slotName}
        </span>
      )}
    </div>
  );
}
