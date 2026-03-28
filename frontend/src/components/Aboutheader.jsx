import React from 'react'
import Navbar from '../components/Navbar.jsx'

function Aboutheader() {
  return (
    <>
      <div className="relative min-h-screen overflow-hidden ">

        {/* Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover "
          src="/animated_video.mp4"
          autoPlay
          muted
          loop
          playsInline

        />
           
        {/* Content on top */}
       <div className="relative z-10 px-2 sm:px-0">
          <Navbar />
          <h1 className="text-pink-800 text-4xltext-2xl sm:text-3xl md:text-4xl text-center pt-28 sm:pt-32 md:pt-40 font-bold animate-[text-scale_3s_ease-out]">
            Welcome to Our Hospital
          </h1>
          <p className='text-center mt-3 font-medium text-sm sm:text-base px-4'>Caring for you with smart, secure, and accessible healthcare.</p>
        </div>

      </div>



    </>
  )
}

export default Aboutheader
