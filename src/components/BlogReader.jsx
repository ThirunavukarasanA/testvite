import React, { useEffect, useRef, useState } from "react";

const BlogReader = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [selectedVoice, setSelectedVoice] = useState(null);

    const synth = window.speechSynthesis;
    const wordRefs = useRef([]);
    const textContent = useRef("");
    const utteranceRef = useRef(null);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = synth.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith("en")) || voices[0];
            setSelectedVoice(englishVoice);
        };
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }, []);

    // Wrap words in spans from real <h2> and <p> elements
    useEffect(() => {
        const tags = document.querySelectorAll("h2, p");
        let fullText = "";
        wordRefs.current = [];

        tags.forEach(tag => {
            const text = tag.textContent;
            fullText += text + " ";
            const words = text.match(/\S+|\s+/g) || [];
            tag.innerHTML = ""; // Clear

            words.forEach((word, i) => {
                const span = document.createElement("span");
                span.textContent = word;
                span.style.transition = "0.1s all";
                span.style.whiteSpace = "pre-wrap";
                tag.appendChild(span);

                if (!/^\s+$/.test(word)) {
                    wordRefs.current.push({ span, charStart: fullText.length - text.length + text.indexOf(word, i) });
                }
            });
        });

        textContent.current = fullText.trim();
    }, []);

    const handlePlay = () => {
        if (isPaused) {
            synth.resume();
            setIsPaused(false);
            return;
        }

        handleStop(); // cancel any existing
        const utterance = new SpeechSynthesisUtterance(textContent.current);
        utterance.voice = selectedVoice;
        utterance.rate = speed;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };

        utterance.onboundary = (event) => {
            if (event.name === "word") {
                const charIndex = event.charIndex;

                for (let i = 0; i < wordRefs.current.length; i++) {
                    const current = wordRefs.current[i];
                    const next = wordRefs.current[i + 1]?.charStart ?? Infinity;

                    if (charIndex >= current.charStart && charIndex < next) {
                        wordRefs.current.forEach((ref, j) => {
                            ref.span.style.background = j === i ? "#007bff" : "transparent";
                            ref.span.style.color = j === i ? "#fff" : "#000";
                        });
                        current.span.scrollIntoView({ behavior: "smooth", block: "center" });
                        break;
                    }
                }
            }
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            clearHighlight();
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            clearHighlight();
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
    };

    const handlePause = () => {
        synth.pause();
        setIsPaused(true);
    };

    const handleStop = () => {
        synth.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        clearHighlight();
    };

    const clearHighlight = () => {
        wordRefs.current.forEach(({ span }) => {
            span.style.background = "transparent";
            span.style.color = "#000";
        });
    };

    return (
        <div style={{ marginTop: 30, fontFamily: "Arial", maxWidth: 800, margin: "auto" }}>
            <h3>🔊 Blog Reader – Synced with Real-Time Speech</h3>
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
