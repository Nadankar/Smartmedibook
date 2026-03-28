import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios'

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/api/doctors');
        setDoctors(response.data.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-blue-100">
        <span className="loading loading-spinner loading-lg text-blue-900"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="relative bg-blue-100 py-10">
      
      <p className="text-center text-xl sm:text-2xl md:text-3xl font-medium text-blue-950 mb-6">
        Meet Our Expert Doctors
      </p>

      <div className="carousel carousel-center w-full py-6 space-x-4 sm:space-x-6 px-4 sm:px-6">

        {doctors.map((data) => (
          <div key={data._id} className="carousel-item">
            <div className="w-64 sm:w-72 h-auto bg-[#3B9797] rounded-xl shadow-md flex flex-col items-center justify-center p-6 hover:scale-105 duration-200">
              
              <img
                src={data.img}
                alt={data.name}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full mb-4 object-cover"
              />

              <h3 className="text-base sm:text-lg font-semibold text-center">
                {data.name}
              </h3>

              <p className="text-gray-700 font-medium text-sm sm:text-base text-center">
                {data.specialization}
              </p>

              <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                {data.experience} years
              </p>

              <div className='my-4 sm:my-5 w-full flex justify-center'>
                <Link
                  to="/chatbot"
                  className="btn text-black bg-pink-500 border-0 hover:bg-blue-950 hover:text-white hover:scale-105 rounded-full px-5 py-3 sm:px-7 sm:py-5 font-semibold w-full sm:w-auto text-center"
                >
                  Book Appointment
                </Link>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Doctors;