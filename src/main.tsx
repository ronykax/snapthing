import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  );
}
