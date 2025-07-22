import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import HideImage from "./components/HideImage";
import Test from '/public/testing.jpg'
import MacMini from '/public/EMBASSY_Village_HD.mp4'
import ProtectedVideoPlayer from "./components/ProtectedVideoPlayer";
import SecureCanvasVideo from "./components/SecureCanvasVideo";
import HLSPlayer from "./components/HLSPlayer";

function App() {
  return (
    <>
      {/* <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router> */}
      {/* <div>
        <h1>Protected Image Viewer</h1>
        <HideImage imageUrl={Test} width={600} height={400} />
      </div> */}
      {/* <div>
        <h1>Secure Video Viewer</h1>
        <ProtectedVideoPlayer videoPath={MacMini} width={700} height={450} />
      </div> */}
      {/* <div>
        <h1>Secure Video Viewer</h1>
        <SecureCanvasVideo />
      </div> */}
      <HLSPlayer />
    </>
  );
}

export default App;
