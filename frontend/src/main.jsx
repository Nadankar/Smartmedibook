import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationContext.jsx";


ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <NotificationProvider>
      <App />  
    </NotificationProvider>
  </BrowserRouter>
);

