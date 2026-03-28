import React, { useState, useEffect } from 'react'

function BasicInfoCard() {

  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {

        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        const response = await fetch(`http://localhost:3000/api/doctors/${user.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setDoctor(data.data);
        }

      } catch (error) {
        console.error("Error fetching doctor", error);
      }
    };

    fetchDoctor();

  }, []);

  if (!doctor) {
    return (
      <p className="text-center mt-6 sm:mt-10 text-sm sm:text-base">
        Loading...
      </p>
    );
  }

  return (
    <div className="card shadow-xl bg-base-100">

      <div className="card-body items-center text-center p-4 sm:p-6">

        <div className="avatar">
          <div className="w-16 sm:w-20 md:w-24 rounded-full">
            <img src={doctor.img} alt="doctor" />
          </div>
        </div>

        <h2 className="card-title text-lg sm:text-xl">
          {doctor.name}
        </h2>

        <p className="text-xs sm:text-sm break-all">
          <strong>Doctor_ID:</strong> {doctor._id}
        </p>

        <p className="text-xs sm:text-sm">
          <strong>Specialization: </strong> {doctor.specialization}
        </p>

        <div className="text-xs sm:text-sm">
          <strong>Experience: </strong> {doctor.experience} years
        </div>

        <div className="divider"></div>

        <p className="text-xs sm:text-sm break-all">
          <strong>Email: </strong>{doctor.email}
        </p>

        <p className="text-xs sm:text-sm break-all">
          <strong>Phone: </strong>{doctor.phone}
        </p>

      </div>

    </div>
  );
}

export default BasicInfoCard;

