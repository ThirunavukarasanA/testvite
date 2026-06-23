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

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isAndroid = () => /Android/i.test(navigator.userAgent);

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

    if (!section || !videoWrap || !video || !progress) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) {
      video.currentTime = 0;
      return;
    }

    const ios = isIOS();
    const android = isAndroid();

    // Chapter highlight
    const setChapter = (p) => {
      if (!chapterItems.length) return;
      const index = Math.min(
        chapterItems.length - 1,
        Math.max(0, Math.floor(p * chapterItems.length)),
      );
      chapterItems.forEach((item, i) => {
        if (!item) return;
        gsap.to(item, {
          autoAlpha: i === index ? 1 : 0.16,
          y: i === index ? 0 : 24,
          duration: 0.35,
          overwrite: true,
        });
      });
    };

    // =========================================================================
    // iOS PATH — native scroll + decoder unlock trick
    // =========================================================================
    if (ios) {
      let videoFrame = 0;
      let targetTime = 0;
      let currentProgress = 0;
      let isSeeking = false;
      let decoderUnlocked = false;

      const unlockDecoder = () => {
        if (decoderUnlocked) return;
        decoderUnlocked = true;
        const p = video.play();
        if (p !== undefined) {
          p.then(() => {
            video.pause();
            video.currentTime = targetTime;
          }).catch(() => {
            video.currentTime = 0;
          });
        }
      };

      const scrubIOS = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          const delta = targetTime - video.currentTime;
          if (!isSeeking && Math.abs(delta) > 1 / 24) {
            isSeeking = true;
            video.currentTime = video.currentTime + delta * 0.22;
          }
        }
        videoFrame = requestAnimationFrame(scrubIOS);
      };

      const onSeeked = () => {
        isSeeking = false;
      };
      video.addEventListener("seeked", onSeeked);
      document.addEventListener("touchstart", unlockDecoder, { once: true });
      window.addEventListener("scroll", unlockDecoder, {
        once: true,
        passive: true,
      });

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        pin: videoWrap,
        pinSpacing: false,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          currentProgress = self.progress;
          if (Number.isFinite(video.duration) && video.duration > 0) {
            targetTime = self.progress * video.duration;
          }
          progress.style.transform = `scaleX(${currentProgress})`;
          setChapter(currentProgress);
          unlockDecoder();
        },
      });

      const onMeta = () => {
        targetTime = 0;
        video.currentTime = 0;
        ScrollTrigger.refresh();
      };
      video.addEventListener("loadedmetadata", onMeta);
      video.load();
      videoFrame = requestAnimationFrame(scrubIOS);
      setChapter(0);

      return () => {
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("seeked", onSeeked);
        document.removeEventListener("touchstart", unlockDecoder);
        window.removeEventListener("scroll", unlockDecoder);
        cancelAnimationFrame(videoFrame);
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    }

    // =========================================================================
    // ANDROID PATH — CSS sticky pin + native scroll event (zero GSAP overhead)
    // =========================================================================
    /*
     * ANDROID FIX — why GSAP pin feels heavy:
     * ScrollTrigger pin uses position:fixed internally. Android Chrome
     * repaints the entire fixed layer on every scroll tick → heavy/stuck.
     *
     * Fix: use CSS `position:sticky` on videoWrap (set via class) and
     * listen to native window scroll directly — ZERO GSAP involvement
     * in the scroll path. Only the video.currentTime update runs on scroll.
     */
    if (android) {
      videoWrap.classList.add("scroll-video__stage--sticky");

      let videoFrame = 0;
      let targetTime = 0;
      let currentProgress = 0;
      let isScrolling = false; // RAF only runs while scrolling
      let scrollTimer = null; // detect scroll stop
      let isSeeking = false; // seek guard — don't overlap seeks
      let lastChapterIdx = -1; // only trigger setChapter on chapter change

      // Cache these once — reading offsetTop is cheap, getBoundingClientRect is not
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const scrollTotal = sectionHeight - window.innerHeight;

      /*
       * FIX 1 — RAF only runs while user is scrolling.
       * When scroll stops, cancel the loop. Restart on next scroll.
       * This means zero GPU work when the page is idle.
       */
      const scrubAndroid = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) {
          videoFrame = requestAnimationFrame(scrubAndroid);
          return;
        }

        const delta = targetTime - video.currentTime;

        /*
         * FIX 2 — seek guard.
         * Android video decoder stalls if currentTime is written
         * while a previous seek is still pending. Wait for 'seeked'.
         */
        if (!isSeeking && Math.abs(delta) > 1 / 24) {
          isSeeking = true;
          // Direct assign (no lerp) — lerp causes the heavy feel because
          // it keeps writing small deltas forever after scroll stops.
          // Instead snap to target; the scroll event fires frequently
          // enough that it already feels smooth.
          video.currentTime = targetTime;
        }

        if (isScrolling) {
          videoFrame = requestAnimationFrame(scrubAndroid);
        }
      };

      const onSeekedAndroid = () => {
        isSeeking = false;
      };
      video.addEventListener("seeked", onSeekedAndroid);

      const onScroll = () => {
        /*
         * FIX 3 — use cached offsetTop instead of getBoundingClientRect().
         * getBoundingClientRect forces a layout recalc on every scroll event
         * which is expensive on Android. window.scrollY is free.
         */
        const scrolled = window.scrollY - sectionTop;
        currentProgress = Math.min(1, Math.max(0, scrolled / scrollTotal));

        if (Number.isFinite(video.duration) && video.duration > 0) {
          targetTime = currentProgress * video.duration;
        }

        // Progress bar — cheap transform, no layout
        progress.style.transform = `scaleX(${currentProgress})`;

        /*
         * FIX 4 — throttle setChapter to only fire on chapter boundary cross.
         * Previously it ran on every scroll pixel, triggering GSAP every time.
         */
        const newIdx = Math.min(
          chapters.length - 1,
          Math.max(0, Math.floor(currentProgress * chapters.length)),
        );
        if (newIdx !== lastChapterIdx) {
          lastChapterIdx = newIdx;
          setChapter(currentProgress);
        }

        // Start RAF if not running
        if (!isScrolling) {
          isScrolling = true;
          videoFrame = requestAnimationFrame(scrubAndroid);
        }

        // Stop RAF 150ms after scroll ends
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          isScrolling = false;
        }, 150);
      };

      window.addEventListener("scroll", onScroll, { passive: true });

      video.pause();
      video.loop = false;

      const onMeta = () => {
        targetTime = 0;
      };
      video.addEventListener("loadedmetadata", onMeta);
      setChapter(0);

      return () => {
        video.removeEventListener("loadedmetadata", onMeta);
        video.removeEventListener("seeked", onSeekedAndroid);
        window.removeEventListener("scroll", onScroll);
        clearTimeout(scrollTimer);
        cancelAnimationFrame(videoFrame);
        videoWrap.classList.remove("scroll-video__stage--sticky");
      };
    }

    // =========================================================================
    // DESKTOP PATH — Lenis + GSAP ScrollTrigger pin
    // =========================================================================
    let videoFrame = 0;
    let targetTime = 0;
    let currentProgress = 0;

    const scrubDesktop = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const delta = targetTime - video.currentTime;
        if (Math.abs(delta) > 1 / 30) {
          video.currentTime += delta * 0.12;
        }
      }
      videoFrame = requestAnimationFrame(scrubDesktop);
    };

    video.pause();
    video.loop = false;

    const lenis = new Lenis({
      wrapper: window,
      content: document.documentElement,
      smoothWheel: true,
      syncTouch: false,
      gestureOrientation: "vertical",
      autoRaf: false,
      lerp: 0.075,
    });

    const lenisTicker = (time) => lenis.raf(time * 1000);

    ScrollTrigger.scrollerProxy(window, {
      scrollTop(value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
          return;
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: document.documentElement.style.transform ? "transform" : "fixed",
    });

    ScrollTrigger.addEventListener("refresh", () => lenis.resize());
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(lenisTicker);
    gsap.ticker.lagSmoothing(0);

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

    const onMeta = () => {
      targetTime = currentProgress * video.duration;
      ScrollTrigger.refresh();
    };
    video.addEventListener("loadedmetadata", onMeta);
    videoFrame = requestAnimationFrame(scrubDesktop);
    setChapter(0);

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(lenisTicker);
      cancelAnimationFrame(videoFrame);
      trigger.kill();
      lenis.destroy();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="scroll-video"
      aria-label="Scroll video"
    >
      <div ref={videoWrapRef} className="scroll-video__stage">
        <video
          ref={videoRef}
          className="scroll-video__media"
          muted
          playsInline
          preload="metadata"
          poster="/poster.png"
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          aria-label="Scroll controlled cinematic video"
        >
          <source src="/outt.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* <div className="scroll-video__shade" /> */}

        {/* <div className="scroll-video__intro">
          <p>Scroll Down / Up</p>
          <span>The timeline follows page position.</span>
        </div> */}

        {/* <div className="scroll-video__chapters">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.title}
              ref={(node) => { if (node) chapterRefs.current[index] = node; }}
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
