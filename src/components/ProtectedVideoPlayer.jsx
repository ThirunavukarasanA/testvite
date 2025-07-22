import React, { useEffect, useRef, useState } from 'react';

const SecureCanvasVideoPlayer = ({ videoPath, width = 640, height = 360, watermarkText = '© RVS Group' }) => {
    const canvasRef = useRef(null);
    const hiddenVideoRef = useRef(null);
    const audioRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Fetch video/audio as blob and set src
    useEffect(() => {
        const fetchVideoAndAudio = async () => {
            try {
                const response = await fetch(videoPath);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                if (hiddenVideoRef.current) hiddenVideoRef.current.src = blobUrl;
                if (audioRef.current) audioRef.current.src = blobUrl;
            } catch (err) {
                console.error('Error loading video/audio:', err);
            }
        };

        fetchVideoAndAudio();
    }, [videoPath]);

    // Canvas rendering logic
    useEffect(() => {
        const video = hiddenVideoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawFrame = () => {
            if (!video || video.paused || video.ended) return;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(video, 0, 0, width, height);

            // Watermark
            ctx.font = '16px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(watermarkText, 10, height - 10);

            requestAnimationFrame(drawFrame);
        };

        let animation;
        if (isPlaying) animation = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(animation);
    }, [isPlaying, watermarkText, width, height]);

    useEffect(() => {
        const video = hiddenVideoRef.current;

        const updateProgress = () => {
            if (video?.duration) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };

        const onLoaded = () => setDuration(video.duration);

        video?.addEventListener('timeupdate', updateProgress);
        video?.addEventListener('loadedmetadata', onLoaded);

        return () => {
            video?.removeEventListener('timeupdate', updateProgress);
            video?.removeEventListener('loadedmetadata', onLoaded);
        };
    }, []);

    const handlePlayPause = () => {
        const video = hiddenVideoRef.current;
        const audio = audioRef.current;

        if (isPlaying) {
            video.pause();
            audio.pause();
            setIsPlaying(false);
        } else {
            video.play();
            audio.play();
            setIsPlaying(true);
        }
    };

    const handleVolumeChange = (e) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        if (audioRef.current) audioRef.current.volume = newVol;
    };

    const handleSeek = (e) => {
        const seekTo = (parseFloat(e.target.value) / 100) * duration;
        if (hiddenVideoRef.current && audioRef.current) {
            hiddenVideoRef.current.currentTime = seekTo;
            audioRef.current.currentTime = seekTo;
            setProgress(parseFloat(e.target.value));
        }
    };

    const enterFullscreen = () => {
        const canvas = canvasRef.current;
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
        else if (canvas.msRequestFullscreen) canvas.msRequestFullscreen();
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{ border: '1px solid #ccc', userSelect: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
            />

            {/* Hidden video for canvas rendering (src assigned by JS) */}
            <video ref={hiddenVideoRef} muted playsInline crossOrigin="anonymous" style={{ display: 'none' }} />

            {/* Hidden audio (src assigned by JS) */}
            <audio ref={audioRef} style={{ display: 'none' }} />

            {/* Custom Controls */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>
                    <button onClick={handlePlayPause}>
                        {isPlaying ? '⏸ Pause' : '▶️ Play'}
                    </button>
                    <button onClick={enterFullscreen}>⛶ Fullscreen</button>
                </div>

                <div>
                    <label>🔊 Volume:</label>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} />
                </div>

                <div>
                    <label>⏱ Progress:</label>
                    <input type="range" min="0" max="100" value={progress} onChange={handleSeek} />
                    <span> {Math.floor((progress / 100) * duration)}s / {Math.floor(duration)}s</span>
                </div>
            </div>
        </div>
    );
};

export default SecureCanvasVideoPlayer;
