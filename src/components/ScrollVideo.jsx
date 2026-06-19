import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./ScrollVideo.css";

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

export default function ScrollVideo() {
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
          poster="/testing.jpg"
          aria-label="Scroll controlled cinematic video"
        >
          <source src="/out.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="scroll-video__shade" />

        <div className="scroll-video__intro">
          <p>Scroll Down / Up</p>
          <span>The timeline follows page position.</span>
        </div>

        {/* <div className="scroll-video__chapters">
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
        </div> */}

        <div className="scroll-video__progress" aria-hidden="true">
          <div ref={progressRef} />
        </div>
      </div>
    </section>
  );
}
