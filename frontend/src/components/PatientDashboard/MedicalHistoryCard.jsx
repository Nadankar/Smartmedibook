import React, { useEffect, useState } from "react";

function MedicalHistoryCard() {
   const [patient, setPatient] = useState(null);

    useEffect(() => { 

        const fetchPatient = async () => {
            try {

                const token = localStorage.getItem("token");
                const user = JSON.parse(localStorage.getItem("user"));

                const response = await fetch(
                    `http://localhost:3000/api/patients/${user.id}`,
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
        return <p className="text-center mt-6 sm:mt-10 text-sm sm:text-base">Loading...</p>;
    }
  return (
    <>
      <div className="card bg-base-100 shadow-xl col-span-1 md:col-span-3">
         <div className="card-body p-4 sm:p-6"> 
             <h2 className="card-title text-lg sm:text-xl">Medical History</h2>
            <ul className="text-xs sm:text-sm list-disc ml-4 break-words"> 
               {patient.medicalHistory || "No history"}
            </ul>
          </div>  
        </div>
    </>
  )
}
 
export default MedicalHistoryCard
