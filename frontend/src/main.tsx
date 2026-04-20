
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./styles/index.css";
  import { ErrorBoundary } from "./components/ErrorBoundary";

  console.log("Environment Mode:", import.meta.env.MODE);

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );