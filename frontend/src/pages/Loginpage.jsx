import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";



function Loginpage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        email: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${BACKEND_URL}/api/auth/login`,
                formData
            );

            // store token
            localStorage.setItem("token", response.data.data.token);

            // store user info
            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: response.data.data.id,
                    email: response.data.data.email,
                    role: response.data.data.role
                })
            );

            console.log("Token stored:", response.data.data.token);

            setSuccess('User login successfully.');
            setError('');
            setFormData({
                password: '',
                email: ''
            })
            navigate("/chatbot");
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
            setSuccess('');
        }


    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-r from-purple-950 via-purple-400 to-pink-800 px-4 sm:px-6">

                {/* Navbar at top */}
                <Navbar />

                {/* Login section */}
                <div className="flex justify-center items-center min-h-[80vh] py-6">

                    <div className="bg-[#132440] p-6 sm:p-8 md:p-10 rounded-2xl shadow-lg w-full sm:w-[80%] md:w-[60%] lg:w-[35%] xl:w-[25%]">

                        <h2 className="text-xl sm:text-2xl md:text-3xl text-center font-bold text-white pb-5">
                            Login
                        </h2>

                        {error && <p className="text-red-500 pb-5">{error}</p>}
                        {success && <p className="text-yellow-500 pb-5">{success}</p>}

                        <form onSubmit={handleLogin} className="grid gap-4 sm:gap-6">

                            <label className="floating-label">
                                <input
                                    type="text"
                                    name="email"
                                    placeholder="email"
                                    className="input border-0"
                                    onChange={handleChange}
                                    value={formData.email}
                                    required
                                />
                                <span>Email</span>
                            </label>

                            <label className="floating-label">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    className="input border-0"
                                    onChange={handleChange}
                                    value={formData.password}
                                    required
                                />
                                <span>Password</span>
                            </label>

                            <button
                                className="btn bg-pink-600 border-0 text-white"
                                type="submit"
                            >
                                Login
                            </button>

                            <span className="text-white text-sm">
                                If you haven't registered?{" "}
                                <Link to="/signup" className="text-blue-400">
                                    Signup
                                </Link>
                            </span>

                        </form>
                    </div>

                </div>



            </div>
            <div>
                <Footer />
            </div>


        </>
    )
}

export default Loginpage




