import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "@fontsource/noto-sans-devanagari/devanagari-700.css";
import "@fontsource/noto-sans-gujarati/gujarati-400.css";
import "@fontsource/noto-sans-gujarati/gujarati-700.css";
import App from "./app";
import "./styles.css";
import "./new-experiences.css";
import "./experience-layout.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
