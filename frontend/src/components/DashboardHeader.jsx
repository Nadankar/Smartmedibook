
import React from 'react'
import { useNavigate } from "react-router-dom";

function DashboardHeader() {
  const navigate = useNavigate();  

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login"); 
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-950 font-serif">
          My Profile
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"
        >
          Logout 
        </button>

      </div>
    </>
  )
}

export default DashboardHeader