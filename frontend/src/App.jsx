import SocketManager from "./components/SocketManager";
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Chatbot from "./pages/Chatbot";
import Loginpage from "./pages/Loginpage";
import Signup from "./pages/Signup";
import Service from "./pages/Service";



function App() {
  return (
    <>
    <SocketManager />
    <Routes>
      <Route path="/" element={<Home />} /> 
      <Route path="About" element={<About />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/Login" element={<Loginpage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/service" element={<Service />} /> 
      <Route path="/chatbot" element={<Chatbot/>}/>

    </Routes>
    </>
  );
}

export default App;


