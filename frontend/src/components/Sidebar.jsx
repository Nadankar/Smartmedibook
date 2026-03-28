
import React from 'react'
import { HiOutlineUser } from "react-icons/hi";
import PatientDashboard from '../pages/PatientDashboard.jsx'
import DoctorDashboard from '../pages/DoctorDashboard.jsx'


 function Sidebar() {

    let user = null; 
    const userData = localStorage.getItem("user");

    if (userData && userData !== "undefined") { 
        user = JSON.parse(userData);
    }

    return (
        <> 
            <div className="drawer ">
                <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content">
                    <label htmlFor="my-drawer-1" className="btn drawer-button bg-gradient-to-r from-violet-600 to-pink-500 border-0 text-white hover:scale-105 p-2 rounded-full">
                        <HiOutlineUser className="h-6 w-6 " />
                    </label>
                </div>
                <div className="drawer-side">
                    <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
                    <div className="menu  min-h-full  p-4 bg-base-200">
                        {!user ? (
                            <div className="flex flex-col items-center gap-3 mt-10">
                                <p className="text-gray-500">Please login to access dashboard</p>
                            </div> 
                        ) : user.role === "patient" ? (
                            <PatientDashboard />
                        ) : (
                            <DoctorDashboard />
                        )}

                    </div>
                </div>
            </div>

        </>
    )
}

export default Sidebar;


