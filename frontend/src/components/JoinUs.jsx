import React from 'react'
import { Link } from 'react-router-dom'

function JoinUs() {
    return (
        <>
            <div className="min-h-screen bg-[#FDB5CE]  py-14 px-4 sm:px-6 ">
                {/* Heading */}
                <h2 className="text-2xl sm:text-3xl md:text-5xl text-center font-semibold text-blue-950 mb-12">
                    Join Our Family
                </h2>

                {/* Cards */}
                <div className="flex flex-col md:flex-row justify-center gap-6 sm:gap-8 md:gap-10 max-w-6xl mx-auto">

                    {/* Sign Up Card */}
                    <div className="bg-[#132440] rounded-2xl shadow-lg w-full md:w-1/2 p-8 ">
                        <div className='flex flex-col sm:flex-row items-center gap-4 sm:gap-5 py-6'>
                            <p className="text-gray-300 mb-6 font-medium">
                                Become a part of our healing community. It’s free and easy to join.

                            </p>

                            <img
                                src="https://images.pexels.com/photos/7659570/pexels-photo-7659570.jpeg"
                                alt="Sign Up"
                                className="rounded-xl mb-4 sm:mb-6 h-40 sm:h-48 md:h-56 w-full sm:w-1/2"
                            />


                        </div>
                        <Link to='/signup' className="btn bg-pink-600 border-0 text-white text-lg w-full sm:w-auto">
                            Sign Up
                        </Link>

                    </div>

                    {/* Login Card */}
                    <div className="bg-[#132440] rounded-2xl shadow-lg w-full md:w-1/2 p-8 ">
                        <div className='flex flex-col sm:flex-row items-center gap-4 sm:gap-5 py-6'>
                            <p className="text-gray-300  mb-4 sm:mb-6 font-medium">
                                Access your personal health portal. Your information awaits.

                            </p>

                            <img
                                src="https://images.pexels.com/photos/7659570/pexels-photo-7659570.jpeg"
                                alt="Sign Up"
                                className="rounded-xl mb-4 sm:mb-6 h-40 sm:h-48 md:h-56 w-full sm:w-1/2"
                            />


                        </div>
                        <Link to="/login" className="btn bg-pink-600 border-0 text-white text-lg w-full sm:w-auto">
                            Log In
                        </Link>

                    </div>

                </div>
            </div>
        </>
    )
}

export default JoinUs
