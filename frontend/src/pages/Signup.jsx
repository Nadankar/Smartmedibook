import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

function Signup() {

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        dob: "",
        phone: "",
        gender: "",
        bloodGroup: "",
        medicalHistory: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${BACKEND_URL}/api/auth/signup`, formData);

            setSuccess("User Registered Successfully!");
            setError("");
            setFormData({
                name: "",
                email: "",
                password: "",
                dob: "",
                phone: "",
                gender: "", 
                bloodGroup: "",
                medicalHistory: ""
            });
            console.log(response.data);

        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
            setSuccess("");
        }
    };

    return (
        <> 
            <div className="min-h-screen bg-gradient-to-r from-purple-950 via-purple-400 to-pink-800">

                {/* Navbar */}
                <Navbar />

                {/* Centered signup form */}
                <div className="flex justify-center items-center min-h-[85vh] my-6 px-4 sm:px-6 md:px-0">

                    <div className="grid gap-4 bg-[#132440] p-6 sm:p-8 md:p-10 rounded-2xl shadow-lg w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%]">

                        <h2 className="text-xl sm:text-2xl md:text-3xl text-center font-bold text-white">
                            Sign up
                        </h2> 

                        {error && <p className="text-red-400">{error}</p>}
                        {success && <p className="text-green-400">{success}</p>}

                        <form onSubmit={handleSignup} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                            <input
                                type="text"
                                name="name"
                                placeholder="Username"
                                className="input md:col-span-2"
                                onChange={handleChange}
                                value={formData.name}
                                required
                            />

                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="input md:col-span-2"
                                onChange={handleChange}
                                value={formData.email}
                                required   
                            />

                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                className="input md:col-span-2"
                                onChange={handleChange}
                                value={formData.password}
                                required
                            />

                            <input
                                type="date"
                                name="dob"
                                className="input"
                                onChange={handleChange}
                                value={formData.dob}
                                required
                            />

                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone" 
                                className="input"
                                onChange={handleChange}
                                value={formData.phone}
                                 maxLength={10}
                                required
                            />

                            <select
                                name="gender"
                                className="input"
                                onChange={handleChange}
                                value={formData.gender}
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>


                            <select
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                name="bloodGroup"
                                className="input"
                                required
                            >
                                <option value="">Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>

                            <textarea
                                name="medicalHistory"
                                value={formData.medicalHistory}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Enter medical history..."
                                className="bg-fuchsia-50 rounded-sm p-5 focus:outline-none md:col-span-2"
                                required
                            />


                            <button
                                type="submit"
                                className="btn bg-pink-600 border-0 text-white md:col-span-2"
                            >
                                Signup
                            </button>

                        </form>

                    </div>

                </div>
                <Footer />
            </div>

        </>

    );
}

export default Signup;



