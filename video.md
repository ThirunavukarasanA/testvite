# Scroll-Controlled Video in One React File

This is a single-file React version of the scroll video concept. It uses one `Video.jsx` component with GSAP ScrollTrigger and Lenis inside the same file.

## Install

```bash
npm install gsap lenis
```

## Recommended Video Encoding

For smooth scroll scrubbing, encode the MP4 with frequent keyframes. A normal video with keyframes every several seconds will stutter when scrolling backward/forward.

Example FFmpeg settings:

```bash
ffmpeg -i input.mp4 -vf "scale=1280:-2,format=yuv420p" -c:v libx264 -crf 25 -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -tune fastdecode -movflags +faststart public/videos/cinematic.mp4
```

## `Video.jsx`

```jsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./video.css";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  {
    title: "Origin",
    subtitle: "Light breaks the surface",
    description:
      "The first frame opens quietly, revealing a form shaped by shadow, reflection, and restraint.",
  },
  {
    title: "Craft",
    subtitle: "Materials find their rhythm",
    description:
      "Every scroll step moves through a precise timeline, letting texture and motion unfold at human pace.",
  },
  {
    title: "Focus",
    subtitle: "The detail becomes the story",
    description:
      "Pinned composition keeps attention on the film while the narrative changes around it.",
  },
  {
    title: "Arrival",
    subtitle: "A final controlled reveal",
    description:
      "The sequence resolves into a premium product moment that rewinds when you scroll back.",
  },
];

export default function Video() {
  const sectionRef = useRef(null);
  const videoWrapRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const chapterRefs = useRef([]);

  useEffect(() => {
    const section = sectionRef.current;
    const videoWrap = videoWrapRef.current;
    const video = videoRef.current;
    const progress = progressRef.current;
    const chapterItems = chapterRefs.current;

    if (!section || !videoWrap || !video || !progress) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotion.matches) {
      video.currentTime = 0;
      return undefined;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });

    let lenisFrame = 0;
    let videoFrame = 0;
    let targetTime = 0;
    let currentProgress = 0;
    const minimumSeekDelta = 1 / 30;

    const runLenis = (time) => {
      lenis.raf(time);
      lenisFrame = requestAnimationFrame(runLenis);
    };

    const setChapter = (scrollProgress) => {
      if (chapterItems.length === 0) return;

      const index = Math.min(
        chapterItems.length - 1,
        Math.max(0, Math.floor(scrollProgress * chapterItems.length))
      );

      chapterItems.forEach((item, itemIndex) => {
        if (!item) return;

        gsap.to(item, {
          autoAlpha: itemIndex === index ? 1 : 0.16,
          y: itemIndex === index ? 0 : 24,
          duration: 0.35,
          overwrite: true,
        });
      });
    };

    const scrubVideo = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const delta = targetTime - video.currentTime;

        if (Math.abs(delta) > minimumSeekDelta) {
          video.currentTime = video.currentTime + delta * 0.18;
        }
      }

      videoFrame = requestAnimationFrame(scrubVideo);
    };

    video.pause();
    video.loop = false;
    lenis.on("scroll", ScrollTrigger.update);
    lenisFrame = requestAnimationFrame(runLenis);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      pin: videoWrap,
      pinSpacing: false,
      scrub: 0.45,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        currentProgress = self.progress;
        targetTime =
          Number.isFinite(video.duration) && video.duration > 0
            ? self.progress * video.duration
            : 0;

        progress.style.transform = `scaleX(${currentProgress})`;
        setChapter(currentProgress);
      },
    });

    const handleMetadata = () => {
      targetTime = currentProgress * video.duration;
      ScrollTrigger.refresh();
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    videoFrame = requestAnimationFrame(scrubVideo);
    setChapter(0);

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      lenis.off("scroll", ScrollTrigger.update);
      cancelAnimationFrame(lenisFrame);
      cancelAnimationFrame(videoFrame);
      trigger.kill();
      lenis.destroy();
    };
  }, []);

  return (
    <section ref={sectionRef} className="scroll-video" aria-label="Scroll video">
      <div ref={videoWrapRef} className="scroll-video__stage">
        <video
          ref={videoRef}
          className="scroll-video__media"
          muted
          playsInline
          preload="auto"
          poster="/images/cinematic-poster.png"
          aria-label="Scroll controlled cinematic video"
        >
          <source src="/videos/cinematic.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="scroll-video__shade" />

        <div className="scroll-video__intro">
          <p>Scroll Down / Up</p>
          <span>The timeline follows page position.</span>
        </div>

        <div className="scroll-video__chapters">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.title}
              ref={(node) => {
                if (node) chapterRefs.current[index] = node;
              }}
              className="scroll-video__chapter"
            >
              <p>{chapter.title}</p>
              <h2>{chapter.subtitle}</h2>
              <span>{chapter.description}</span>
            </article>
          ))}
        </div>

        <div className="scroll-video__progress" aria-hidden="true">
          <div ref={progressRef} />
        </div>
      </div>
    </section>
  );
}
```

## `video.css`

```css
.scroll-video {
  position: relative;
  min-height: 560vh;
  background: #000;
  color: #fff;
}

.scroll-video__stage {
  position: relative;
  top: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #000;
}

.scroll-video__media {
  height: 100%;
  width: 100%;
  object-fit: cover;
  background: #000;
}

.scroll-video__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.72), transparent 40%, rgba(0, 0, 0, 0.55)),
    linear-gradient(180deg, rgba(0, 0, 0, 0.3), transparent 35%, rgba(0, 0, 0, 0.72));
  pointer-events: none;
}

.scroll-video__intro {
  position: absolute;
  left: clamp(24px, 5vw, 64px);
  top: 96px;
  z-index: 2;
  max-width: 360px;
}

.scroll-video__intro p,
.scroll-video__chapter p {
  margin: 0;
  color: #d4af37;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.scroll-video__intro span {
  display: block;
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.8;
}

.scroll-video__chapters {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 clamp(24px, 5vw, 64px);
  pointer-events: none;
}

.scroll-video__chapter {
  position: absolute;
  width: min(520px, calc(100vw - 48px));
  border-left: 1px solid rgba(212, 175, 55, 0.55);
  padding-left: 24px;
  opacity: 0.16;
  transform: translateY(24px);
}

.scroll-video__chapter h2 {
  margin: 12px 0 0;
  color: #fff;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1;
}

.scroll-video__chapter span {
  display: block;
  margin-top: 16px;
  max-width: 420px;
  color: rgba(255, 255, 255, 0.64);
  font-size: 16px;
  line-height: 1.8;
}

.scroll-video__progress {
  position: fixed;
  bottom: 24px;
  left: 50%;
  z-index: 3;
  width: min(520px, calc(100vw - 48px));
  height: 1px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.18);
}

.scroll-video__progress div {
  height: 100%;
  transform: scaleX(0);
  transform-origin: left;
  background: #d4af37;
}

@media (max-width: 767px) {
  .scroll-video {
    min-height: 420vh;
  }

  .scroll-video__intro {
    top: 80px;
  }

  .scroll-video__chapters {
    align-items: flex-end;
    justify-content: flex-start;
    padding-bottom: 96px;
  }

  .scroll-video__chapter h2 {
    font-size: 34px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-video {
    min-height: 100vh;
  }
}
```

## Notes

- This file works in normal React apps such as Vite or CRA.
- In Next.js App Router, add `"use client";` at the top of `Video.jsx`.
- For mobile scroll-scrubbing, keep this exact setup. If you want mobile to autoplay instead, add a `matchMedia("(max-width: 767px)")` fallback and call `video.play()` instead of creating ScrollTrigger.
- Smoothness depends heavily on the MP4 encoding. Frequent keyframes matter more than React code here.