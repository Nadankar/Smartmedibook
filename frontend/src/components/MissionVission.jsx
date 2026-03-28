import React from "react";
import { FaBullseye, FaEye } from "react-icons/fa";

function MissionVision() {
    return (
        <div className="min-h-screen  flex items-center justify-center bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] px-6 sm:px-6">

            <div className="max-w-6xl w-full  grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10">

                {/* Mission Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-2xl transform transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                    <FaBullseye className=" text-4xl sm:text-5xl text-blue-400 mb-6" />
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">Mission</h2>
                    <p className="text-gray-200 leading-relaxed text-sm sm:text-base">
                        Our mission is to deliver accessible, reliable, and compassionate
                        healthcare through innovative technology. We aim to simplify
                        appointments, enhance patient experience, and connect people with
                        trusted medical professionals anytime, anywhere.
                    </p>
                </div>

                {/* Vision Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 text-white shadow-2xl transform transition-all duration-500 hover:scale-105 hover:-translate-y-2">
                    <FaEye className="text-5xl text-green-400 mb-6" />
                    <h2 className="text-3xl font-bold mb-4"> Vision</h2>
                    <p className="text-gray-200 leading-relaxed">
                        Our vision is to create a future where healthcare is smart,
                        patient-centered, and globally accessible. We strive to empower
                        individuals with digital tools that promote preventive care and
                        healthier lives.
                    </p>
                </div>

            </div>
        </div>
    );
}

export default MissionVision;
