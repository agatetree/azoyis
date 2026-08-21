"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const FADE_MS = 500;
const AUTOPLAY_GRACE_MS = 1000;
const SAFETY_MS = 6000;

export default function SplashScreen() {
  const [removed, setRemoved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const done = useRef(false);

  // Pull the overlay immediately, no fade. Used for skips and failures.
  const dismiss = useCallback(() => {
    if (done.current) return;
    done.current = true;
    document.documentElement.removeAttribute("data-splash");
    setRemoved(true);
  }, []);

  // Fade out, then unmount. Used when the video plays through.
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      document.documentElement.removeAttribute("data-splash");
      setRemoved(true);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    // The inline script in page.tsx decides whether the splash runs at all
    // (already seen this session, or reduced motion). If it didn't opt in,
    // drop the markup on hydration — CSS has kept it hidden the whole time.
    if (document.documentElement.getAttribute("data-splash") !== "on") {
      done.current = true;
      // Deferred a task rather than set synchronously here, so hydration isn't
      // followed by an immediate cascading re-render. Nothing is visible in the
      // meantime — CSS has kept the overlay hidden since first paint.
      const id = window.setTimeout(() => setRemoved(true), 0);
      return () => window.clearTimeout(id);
    }

    const video = videoRef.current;
    const timers: number[] = [];
    let started = false;
    const onPlaying = () => {
      started = true;
    };
    video?.addEventListener("playing", onPlaying);

    // Autoplay blocked, decode failure, or a video that never starts: the
    // overlay is gone within a second. Deliberately keyed off the `playing`
    // event rather than currentTime — on a cold cache a video that is going to
    // play fine can still read currentTime 0 at the one second mark, and
    // checking that would cut the animation off before anyone saw it.
    timers.push(
      window.setTimeout(() => {
        if (!started) dismiss();
      }, AUTOPLAY_GRACE_MS)
    );

    // Last resort, so a stalled video can never trap the page behind an overlay.
    timers.push(window.setTimeout(dismiss, SAFETY_MS));

    if (video) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => dismiss());
      }
    }

    // Clicking works for mouse and touch; keyboard users need their own way out.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") dismiss();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("keydown", onKey);
      video?.removeEventListener("playing", onPlaying);
    };
  }, [dismiss]);

  if (removed) return null;

  return (
    <div
      className={`splash${leaving ? " is-leaving" : ""}`}
      onClick={dismiss}
      onTouchStart={dismiss}
      role="presentation"
    >
      <video
        ref={videoRef}
        className="splash-video"
        src="/azoyis-logo-animation.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={finish}
        onError={dismiss}
      />
      <button className="splash-skip" type="button" onClick={dismiss}>
        Skip
      </button>
    </div>
  );
}
