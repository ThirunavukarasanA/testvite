import React, { useState } from "react";
import MetaTags from "./MetaTags";
import { Helmet } from "react-helmet-async";
import { Translations } from "./Translations";
export default function HomePage() {
  const [language, setLanguage] = useState("en");
  const changeLanguage = (lng) => {
    setLanguage(lng);
  };
  return (
    <div>
      <Helmet>
        <title>Home Page</title>
        <meta name="description" content="This is the home page description" />
        <meta property="og:title" content="Home Page" />
        <meta
          property="og:description"
          content="This is the home page description"
        />
        <meta property="og:image" content="https://example.com/image.jpg" />
        <meta property="og:url" content="https://example.com/home" />
        {/* Add more meta and og tags as needed */}
      </Helmet>
      <div>
        <h1>{Translations[language].welcome}</h1>
        <p>{Translations[language].description}</p>
        <button onClick={() => changeLanguage("en")}>English</button>
        <button onClick={() => changeLanguage("ta")}>Tamil</button>
      </div>
    </div>
  );
}
