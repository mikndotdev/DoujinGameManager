import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./App.css";
import Index from "./routes/index.tsx";
import ManageData from "./routes/manage-data.tsx";
import Header from "./components/header.tsx";
import Navigation from "./components/navigation.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/manage-data" element={<ManageData />} />
      </Routes>
      <Navigation />
    </BrowserRouter>
  </StrictMode>,
);
