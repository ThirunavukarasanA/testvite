import { useEffect, useRef } from 'react';

const HideImage = ({ imageUrl, width, height }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        };
    }, [imageUrl, width, height]);

    useEffect(() => {
        const disableContextMenu = (e) => {
            if (e.target.tagName === 'CANVAS') {
                e.preventDefault();
            }
        };

        // const disableKeys = (e) => {
        //     if (e.ctrlKey && ['s', 'u', 'c'].includes(e.key.toLowerCase())) {
        //         e.preventDefault();
        //     }
        // };

        document.addEventListener('contextmenu', disableContextMenu);
        // document.addEventListener('keydown', disableKeys);

        return () => {
            document.removeEventListener('contextmenu', disableContextMenu);
            // document.removeEventListener('keydown', disableKeys);
        };
    }, []);

    return (
        <div
            style={{
                position: 'relative',
                userSelect: 'none',
                pointerEvents: 'none', // Disable mouse interaction entirely if needed
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    border: '1px solid #ccc',
                    pointerEvents: 'auto', // allow hover but block interaction
                }}
                className=''
            />
        </div>
    );
};

export default HideImage;
