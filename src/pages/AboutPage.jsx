import React from "react";
import MetaTags from "./MetaTags";
import { Helmet } from "react-helmet-async";
export default function AboutPage() {
  return (
    <div>
      {/* <MetaTags
        title="About Page"
        description="This is the about page"
        image="https://yourwebsite.com/about-image.jpg"
        url="https://yourwebsite.com/about"
      />
      <h1>About Page Content</h1> */}
      <Helmet>
        <title>About Us</title>
        <meta name="description" content="Learn more about us on this page" />
        <meta property="og:title" content="About Us" />
        <meta
          property="og:description"
          content="Learn more about us on this page"
        />
        <meta
          property="og:image"
          content="https://example.com/about-image.jpg"
        />
        <meta property="og:url" content="https://example.com/about" />
        {/* Add more meta and og tags as needed */}
      </Helmet>
      <h1>About Us</h1>
      <p>This is the content of the about page.</p>
    </div>
  );
}
