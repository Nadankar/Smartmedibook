
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Notification from "./Notification";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="py-8  px-3 sm:px-5">
      {/* MAIN NAVBAR */}
      <div className="max-w-7xl mx-auto bg-base-100 shadow-lg rounded-full flex justify-between items-center px-4 sm:px-6 md:px-10 md:py-4 sticky">
        
        {/* LEFT SIDE */}
        <div className="flex items-center gap-2">
          <img
            src="https://img.icons8.com/pulsar-color/48/medical-id.png"
            alt="medical-id"
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
          <h1 className="font-semibold font-serif text-2xl">
            SmartMediBook
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4 ">
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-5 font-medium text-base">
            <Link to="/" className="hover:text-pink-600">Home</Link>
            <Link to="/About" className="hover:text-pink-600">About Us</Link>
            <Link to="/Service" className="hover:text-pink-600">Services</Link>
          </div>

          {/* Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/login"
              className="btn bg-[#132440] text-white hover:bg-pink-600 shadow-2xl text-sm sm:text-base px-4 sm:px-5 py-2 rounded-full"
            >
              Login
            </Link>

            <Link
              to="/chatbot"
              className="btn text-white bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 border-0 hover:bg-[#132440] hover:scale-105 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base"
            >
              Book Appointment
            </Link>

            <Notification />
          </div>

          {/* Hamburger Menu for Mobile */}
          <button
            className="md:hidden flex items-center justify-center text-gray-700 hover:text-pink-600 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR / MENU */}
      {menuOpen && (
        <div className="md:hidden bg-base-100 px-4 pb-4 space-y-3 shadow-lg">
          {/* Links */}
          <Link to="/" className="block font-medium hover:text-pink-600">Home</Link>
          <Link to="/About" className="block font-medium hover:text-pink-600">About Us</Link>
          <Link to="/Service" className="block font-medium hover:text-pink-600">Services</Link>

          {/* Buttons */}
          <Link
            to="/login"
            className="block text-center bg-[#132440] text-white hover:bg-pink-600 rounded-full py-2 font-medium"
          >
            Login
          </Link>

          <Link
            to="/chatbot"
            className="block text-center bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 text-white hover:bg-[#132440] rounded-full py-2 font-semibold"
          >
            Book Appointment
          </Link>

          <div className="flex justify-center">
            <Notification />
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;