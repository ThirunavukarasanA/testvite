import React, { useEffect, useRef, useState } from 'react';

const SecureCanvasVideo = ({ width = 800, height = 450, watermark = '© RVS Group' }) => {
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // Fetch signed URL and assign to video/audio blobs
    useEffect(() => {
        const loadSecureVideo = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/get-secure-video-url');
                const data = await res.json();
                const blobRes = await fetch(data.url);
                const blob = await blobRes.blob();
                const blobUrl = URL.createObjectURL(blob);

                videoRef.current.src = blobUrl;
                audioRef.current.src = blobUrl;
            } catch (err) {
                console.error('Error loading secure video:', err);
            }
        };

        loadSecureVideo();
    }, []);

    // Draw video to canvas
    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            if (video && !video.paused && !video.ended) {
                ctx.drawImage(video, 0, 0, width, height);

                // Watermark
                ctx.font = '16px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText(watermark, 10, height - 10);

                requestAnimationFrame(draw);
            }
        };

        if (isPlaying) requestAnimationFrame(draw);
    }, [isPlaying]);

    const playPause = () => {
        const v = videoRef.current;
        const a = audioRef.current;

        if (isPlaying) {
            v.pause();
            a.pause();
            setIsPlaying(false);
        } else {
            v.play();
            a.volume = volume;
            a.play();
            setIsPlaying(true);
        }
    };

    const onVolumeChange = (e) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        audioRef.current.volume = vol;
    };

    const onSeek = (e) => {
        const val = parseFloat(e.target.value);
        const time = (val / 100) * duration;
        videoRef.current.currentTime = time;
        audioRef.current.currentTime = time;
        setProgress(val);
    };

    useEffect(() => {
        const video = videoRef.current;
        const updateProgress = () => {
            const val = (video.currentTime / video.duration) * 100;
            setProgress(val);
        };
        const onLoaded = () => setDuration(video.duration);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', onLoaded);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadedmetadata', onLoaded);
        };
    }, []);

    const goFullscreen = () => {
        const canvas = canvasRef.current;
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
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

            <video ref={videoRef} muted playsInline style={{ display: 'none' }} />
            <audio ref={audioRef} style={{ display: 'none' }} />

            <div style={{ marginTop: 10 }}>
                <button onClick={playPause}>{isPlaying ? 'Pause' : 'Play'}</button>
                <button onClick={goFullscreen}>Fullscreen</button>

                <div>
                    <label>Volume</label>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolumeChange} />
                </div>

                <div>
                    <label>Progress</label>
                    <input type="range" min="0" max="100" value={progress} onChange={onSeek} />
                    <span>{Math.floor((progress / 100) * duration)}s / {Math.floor(duration)}s</span>
                </div>
            </div>
        </div>
    );
};

export default SecureCanvasVideo;
