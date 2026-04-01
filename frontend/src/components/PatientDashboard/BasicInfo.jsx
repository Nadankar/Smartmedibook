import React, { useEffect, useState } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

function BasicInfo() {

    const [patient, setPatient] = useState(null);

    useEffect(() => {

        const fetchPatient = async () => {
            try {

                const token = localStorage.getItem("token");
                const user = JSON.parse(localStorage.getItem("user"));

                const response = await fetch(
                    `${BACKEND_URL}/api/patients/${user.id}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (data.success) {
                    setPatient(data.data);
                }

            } catch (error) {
                console.error("Error fetching patient:", error);
            }
        };

        fetchPatient();

    }, []);

    if (!patient) {
        return <p className="text-center mt-10">Loading...</p>;
    }

    return (
        <>
            <div className="p-4 sm:p-6 md:p-10 bg-white rounded shadow-md col-span-1 md:col-span-3 text-center">

                <img
                    src={patient.img}
                    alt="Profile"
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full mx-auto object-cover"
                />

                <p className="text-xs sm:text-sm mt-2 break-all">
                    <strong>Patient ID:</strong> {patient._id}
                </p>

                <h2 className="text-lg sm:text-xl font-bold text-center mt-2">
                    {patient.name}
                </h2>

                <p className="text-center text-gray-600 text-xs sm:text-sm break-all">
                    {patient.email}
                </p>

                <div className="mt-4 text-xs sm:text-sm space-y-1">

                    <p><strong>Phone:</strong> {patient.phone}</p>

                    <p>
                        <strong>Date of Birth:</strong>{" "}
                        {new Date(patient.dob).toLocaleDateString()}
                    </p>

                    <p><strong>Gender:</strong> {patient.gender}</p>

                    <p><strong>Blood Group:</strong> {patient.bloodGroup || "Not Added"}</p>

                </div>

            </div>
        </>
    );
}

export default BasicInfo;