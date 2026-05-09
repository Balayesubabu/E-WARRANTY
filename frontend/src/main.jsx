import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  } catch (error) {
    console.error("Error rendering app:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial;">
        <h1>Error Loading App</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
} else {
  console.error("Root element not found!");
}