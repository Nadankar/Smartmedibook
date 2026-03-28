import React from 'react'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

function Footer() { 
    return (
        <>
            <footer className="bg-[#f5f9fa] text-gray-700 pt-12 pb-6 border-t">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10">
                    {/* Brand Info */}
                     <div className="text-center sm:text-left">
                        <h2 className="text-xl sm:text-2xl font-bold text-blue-950 mb-4">Smart MediBook</h2>
                        <p>A108 Carter Road</p>
                        <p>Bandra , Mumbai (400 007)</p>
                        <p className="mt-3">
                            <span className="font-semibold">Phone:</span> +1 5589 55488 55
                        </p>
                        <p>
                            <span className="font-semibold ">Email:</span> smartmedibook@gmail.com
                        </p>

                        {/* Social Icons */}
                       <div className="flex justify-center sm:justify-start space-x-4 mt-4">
                            <a href="#" className=" p-2 sm:p-3 rounded-full bg-white shadow hover:bg-pink-300 ">
                                <FaXTwitter />
                            </a>
                            <a href="#" className=" p-2 sm:p-3 rounded-full bg-white shadow hover:bg-pink-300 ">
                                <FaFacebookF />
                            </a>
                            <a href="#" className=" p-2 sm:p-3 rounded-full bg-white shadow hover:bg-pink-300 ">
                                <FaInstagram />
                            </a>
                            <a href="#" className=" p-2 sm:p-3 rounded-full bg-white shadow hover:bg-pink-300 ">
                                <FaLinkedinIn />
                            </a>
                        </div>
                    </div>

                    {/* Useful Links */}
                     <div className="text-center sm:text-left">
                        <h3 className=" text-base sm:text-lg font-semibold text-blue-950 mb-3">Useful Links</h3>
                        <ul className="space-y-2">
                            <li><a href="/" className="hover:text-blue-600">Home</a></li>
                            <li><a href="/about" className="hover:text-blue-600">About Us</a></li>
                            <li><a href="/service" className="hover:text-blue-600">Services</a></li>
                            <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Our Services */}
                    <div className="text-center sm:text-left">
                        <h3 className=" text-base sm:text-lg font-semibold text-blue-950 mb-3">Our Services</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-600">Appointment Booking</a></li>
                            <li><a href="#" className="hover:text-blue-600">Health Records</a></li>
                            <li><a href="#" className="hover:text-blue-600">Doctor Consultations</a></li>
                            <li><a href="#" className="hover:text-blue-600">Medicine Reminders</a></li>
                            <li><a href="#" className="hover:text-blue-600">Lab Reports</a></li>
                        </ul>
                    </div>

                    {/* Extra Links */}
                   <div className="text-center sm:text-left">
                        <h3 className=" text-base sm:text-lg font-semibold text-blue-950 mb-3">Support</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                            <li><a href="#" className="hover:text-blue-600">FAQs</a></li>
                            <li><a href="#" className="hover:text-blue-600">Feedback</a></li>
                            <li><a href="#" className="hover:text-blue-600">Contact Support</a></li>
                            <li><a href="#" className="hover:text-blue-600">Community</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                 <div className="border-t mt-8 pt-4 text-center text-xs sm:text-sm text-gray-600 px-4">
                    © Copyright <span className="font-semibold text-blue-700">SmartMediBook</span> All Rights Reserved
                    <br />
                    <span>
                        Designed by <a href="#" className="text-blue-600 hover:underline">Students of RCOE</a>
                    </span>
                </div>
            </footer>
        </>
    )
}

export default Footer
