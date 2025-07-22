import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import axios from 'axios';

const HLSPlayer = () => {
    const videoRef = useRef(null);
    const watermarkRef = useRef(null);
    const [token, setToken] = useState(null);

    // Fetch token
    useEffect(() => {
        axios.get('http://localhost:5000/get-token')
            .then(res => setToken(res.data.token))
            .catch(console.error);
    }, []);

    // Load stream
    useEffect(() => {
        if (token && videoRef.current) {
            const video = videoRef.current;
            const source = `http://localhost:5000/secure-stream?t=${token}`;

            if (Hls.isSupported()) {
                const hls = new Hls({
                    xhrSetup: function (xhr, url) {
                        // Rewrite .ts file requests to authenticated routes
                        if (url.endsWith('.ts')) {
                            const file = url.split('/').pop();
                            xhr.open('GET', `http://localhost:5000/segment/${token}/${file}`, true);
                        }
                    }
                });

                hls.loadSource(source);
                hls.attachMedia(video);

                return () => hls.destroy();
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            }
        }
    }, [token]);

    // Dynamic watermark movement
    useEffect(() => {
        const moveWatermark = () => {
            const wm = watermarkRef.current;
            if (!wm) return;

            const top = Math.floor(Math.random() * 80);
            const left = Math.floor(Math.random() * 80);

            wm.style.top = `${top}%`;
            wm.style.left = `${left}%`;
        };

        const interval = setInterval(moveWatermark, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <video
                ref={videoRef}
                controls
                autoPlay
                style={{ width: '100%', userSelect: 'none' }}
                onContextMenu={e => e.preventDefault()}
            />
            <div
                ref={watermarkRef}
                style={{
                    position: 'absolute',
                    color: 'white',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '4px 8px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    top: '10%',
                    left: '10%',
                }}
            >
                UserID: Anonymous | Time: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default HLSPlayer;
