# React + Vite

# ffmpeg cmd for video compress
ffmpeg -i input.mp4 -c:v libx264 -crf 20 -preset slow -g 1 -movflags +faststart -c:a aac out.mp4

# ffmpeg ios MAC only cmd for video compress
ffmpeg -i input.mp4 -vcodec hevc_videotoolbox -tag:v hvc1 public/outt-hevc.mp4

# ffmpeg Windows — use libx265 instead
ffmpeg -i input.mp4 -vcodec libx265 -tag:v hvc1 -crf 18 -preset slow -movflags faststart public/outt-hevc.mp4

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
