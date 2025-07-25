import React, { useEffect, useRef, useState } from "react";

const BlogReader = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [words, setWords] = useState([]);

    const timerRef = useRef(null);
    const wordSpans = useRef([]);

    useEffect(() => {
        const tags = Array.from(document.querySelectorAll("h2, p"));
        let all = [];

        tags.forEach(tag => {
            const split = tag.textContent.trim().match(/\S+|\s+/g) || [];
            tag.innerHTML = "";

            split.forEach((part, i) => {
                const span = document.createElement("span");
                span.textContent = part;
                span.style.transition = "0.1s all";
                tag.appendChild(span);

                if (!/^\s+$/.test(part)) {
                    all.push(span);
                }

                wordSpans.current.push(span);
            });
        });

        setWords(all);
    }, []);

    const speakWord = (index) => {
        if (!words[index] || isPaused) return;

        const word = words[index].textContent;
        const utter = new SpeechSynthesisUtterance(word);
        utter.rate = speed;
        window.speechSynthesis.speak(utter);

        // Highlight
        words.forEach((el, i) => {
            el.style.background = i === index ? "#007bff" : "transparent";
            el.style.color = i === index ? "#fff" : "#000";
        });

        words[index].scrollIntoView({ behavior: "smooth", block: "center" });

        utter.onend = () => {
            timerRef.current = setTimeout(() => {
                if (!isPaused && index + 1 < words.length) {
                    setCurrentIndex(index + 1);
                    speakWord(index + 1);
                } else {
                    setIsSpeaking(false);
                }
            }, 100); // Small delay before next word
        };
    };

    const handlePlay = () => {
        if (isPaused) {
            setIsPaused(false);
            speakWord(currentIndex);
        } else {
            setCurrentIndex(0);
            setIsPaused(false);
            setIsSpeaking(true);
            speakWord(0);
        }
    };

    const handlePause = () => {
        window.speechSynthesis.cancel();
        setIsPaused(true);
        clearTimeout(timerRef.current);
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsPaused(false);
        setIsSpeaking(false);
        setCurrentIndex(0);
        clearTimeout(timerRef.current);
        wordSpans.current.forEach(el => {
            el.style.background = "transparent";
            el.style.color = "#000";
        });
    };

    return (
        <div style={{ marginTop: "40px", fontFamily: "Arial", maxWidth: 800, margin: "auto" }}>
            <h3>🔊 Precise Blog Reader</h3>
            <button onClick={handlePlay} disabled={isSpeaking && !isPaused}>
                ▶️ {isPaused ? "Resume" : "Play"}
            </button>
            <button onClick={handlePause} disabled={!isSpeaking || isPaused}>
                ⏸️ Pause
            </button>
            <button onClick={handleStop} disabled={!isSpeaking}>
                ⏹️ Stop
            </button>
            <div style={{ marginTop: 10 }}>
                <label>Speed: </label>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                />
                <span> {speed.toFixed(1)}x</span>
            </div>
        </div>
    );
};

export default BlogReader;
