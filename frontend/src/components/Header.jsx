
import React from 'react'
import hospital_img from "../../public/hospital.png"
import Navbar from './Navbar';

function Header({ onExploreClick }) {
    return ( 
        <>
            <div className="max-w-screen-2xl mx-auto h-screen bg-cover object-cover bg-center relative "
                style={{ backgroundImage: `url(${hospital_img})` }}
            >  
            <div className="absolute inset-0 bg-black/55"></div>
                <Navbar />
                <div className='absolute top-1/2 left-4 sm:left-10 md:left-20 transform -translate-y-1/2 text-white px-2 sm:px-0'>
                    <h1 className='text-2xl sm:text-3xl md:text-5xl font-bold'>Advanced Medical Care <br /> for Your Family's Health</h1><br />
                    <p className='text-sm sm:text-base md:text-xl max-w-md md:max-w-xl'>Manage your medical records, book doctor appointments, and stay on top of your health — all in one secure platform.</p>
                </div>
               <div className='absolute flex gap-5 z-10 bottom-10 sm:bottom-16 left-4 sm:left-10 md:left-20'>

                    <button className="btn btn-outline btn-secondary hover:text-white hover:bg-pink-400 hover:border-0 hover:scale-105 rounded-full px-5 py-3 sm:px-7 sm:py-5 font-semibold"
                        onClick={onExploreClick}
                    >Explore More</button>
                </div>

            </div>

        </>
    )
}

export default Header
