import React from "react";
import { Link } from "react-router-dom";
import Notification from "./Notification";

function Navbar() {
  return (
    <>
      <div className="py-4 sm:py-6 md:py-10 px-3 sm:px-5">
        <div className="navbar bg-base-100 shadow-sm px-4 sm:px-6 md:px-10 rounded-full z-10 sticky flex items-center justify-between">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-2">
            <img
              src="https://img.icons8.com/pulsar-color/48/medical-id.png"
              alt="medical-id"
              className="w-12 h-12"
            />
            <h1 className="font-semibold font-serif text-2xl">
              SmartMediBook
            </h1>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {/* Nav links */}
            <div className="hidden md:flex gap-5 font-medium text-base">
              <Link to="/" className="hover:text-pink-600">
                Home
              </Link>
              <Link to="/About" className="hover:text-pink-600">
                About Us
              </Link>
              <Link to="/Service" className="hover:text-pink-600">
                Services
              </Link>
            </div>

            {/* Buttons */}
            <Link
              to="/login"
              className="btn bg-[#132440] text-white hover:bg-pink-600 shadow-2xl"
            >
              Login
            </Link>

            <Link
              to="/chatbot"
              className="btn text-black bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 border-0 hover:bg-[#132440] hover:text-white hover:scale-105 rounded-full px-4 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base"
            >
              Book Appointment
            </Link>

           
            <Notification />

          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;