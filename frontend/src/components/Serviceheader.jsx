import React from 'react'
import Navbar from './Navbar'
import doctor_img from "../../public/doctor_img.jpg"

function Serviceheader() {
    return (
        <>
            <div className='min-h-screen bg-cover bg-center relative' style={{ backgroundImage: `url(${doctor_img})` }} >
            <div className="absolute inset-0 bg-black/50"></div>
                <Navbar />
                <div className='text-center flex justify-center px-4 '>

                    <h1 className="overflow-hidden whitespace-nowrap z-10 text-blue-200 text-3xl sm:text-5xl md:text-7xl lg:text-9xl pt-20 sm:pt-24 md:pt-28 font-bold animate-[text-typewriter_1.3s_steps(40)_forwards] ">
                        Our Services
                    </h1>
                </div>
               <p className='relative text-sm sm:text-base md:text-lg font-light font-serif text-white z-40 px-4 sm:px-10 md:px-20 lg:px-32 py-4 sm:py-6 animate-[text-slideInUp_1s] text-center'>Our medical services are designed to provide quality healthcare with convenience and security. Patients can easily book appointments, consult experienced doctors, and manage medical records using our smart, AI-powered platform.</p>
               
            </div>
        </>
    )
}
 
export default Serviceheader
