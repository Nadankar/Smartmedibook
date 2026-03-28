import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AppointmentTable() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState(null);

  const getPatientId = (appointment) =>
    appointment?.patientId?._id ||
    appointment?.patientId ||
    appointment?.patient_id?._id ||
    appointment?.patient_id ||
    null;

  const getPatientName = (appointment) =>
    appointment?.patient_id?.name ||
    appointment?.patientId?.name ||
    "Patient";

  const getPatientImg = (appointment) =>
    appointment?.patient_id?.img ||
    appointment?.patientId?.img ||
    "https://via.placeholder.com/40";

  const fetchAppointmentData = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user?.id) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/appointments/doctor/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const latestPerPatient = Object.values(
          data.data.reduce((acc, curr) => {
            const patientId = getPatientId(curr);
            if (!patientId) return acc;

            if (
              !acc[patientId] ||
              new Date(curr.createdAt) > new Date(acc[patientId].createdAt)
            ) {
              acc[patientId] = curr;
            }

            return acc;
          }, {})
        );

        setAppointments(latestPerPatient);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    if (currentStatus === "completed") return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/appointments/${id}/doctor-complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchAppointmentData(false);
      } else {
        alert(data.message || "Failed to mark appointment completed");
      }
    } catch (error) {
      console.error("Error updating status", error);
      alert("Error updating appointment");
    }
  };

  useEffect(() => {
    fetchAppointmentData(true);

    const handleRefresh = () => {
      fetchAppointmentData(false);
    };

    const handleHighlightNew = (event) => {
      const appointmentId = event?.detail?.appointmentId;
      if (appointmentId) {
        setNewId(appointmentId);
        setTimeout(() => {
          setNewId((prev) => (prev === appointmentId ? null : prev));
        }, 3000);
      }

      fetchAppointmentData(false);
    };

    window.addEventListener("appointments:refresh", handleRefresh);
    window.addEventListener("appointment:highlight-new", handleHighlightNew);

    return () => {
      window.removeEventListener("appointments:refresh", handleRefresh);
      window.removeEventListener("appointment:highlight-new", handleHighlightNew);
    };
  }, []);

  if (loading) {
    return <p className="text-center mt-4 text-sm sm:text-base">Loading...</p>;
  }

  return (
    <div className="max-w-full shadow-2xl bg-white rounded-sm lg:col-span-3 p-2 sm:p-4">
      <div className="overflow-x-auto">
        <table className="table min-w-[600px]">
          <thead>
            <tr className="text-sm sm:text-lg md:text-2xl text-black">
              <th></th>
              <th>Patient</th>
              <th>
                <p>Name</p>
                <p>Diagnosis</p>
              </th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No appointments found
                </td>
              </tr>
            ) : (
              [...appointments]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((appointment) => (
                  <tr
                    key={appointment._id}
                    className={
                      appointment._id === newId
                        ? "bg-green-200 transition-all duration-500"
                        : ""
                    }
                  >
                    <th>
                      <input
                        type="checkbox"
                        className="checkbox text-green-600"
                        checked={appointment.status === "completed"}
                        onChange={() =>
                          handleStatusChange(
                            appointment._id,
                            appointment.status
                          )
                        }
                      />
                    </th>

                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle h-10 w-10 sm:h-12 sm:w-12">
                            <img src={getPatientImg(appointment)} alt="patient" />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="font-bold text-sm sm:text-base md:text-xl text-blue-800 flex items-center gap-2">
                        {getPatientName(appointment)}
                        {appointment._id === newId && (
                          <span className="badge badge-success text-white text-xs">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm opacity-50 text-black break-words">
                        {appointment.reason}
                      </div>
                    </td>

                    <td className="text-xs sm:text-sm md:text-base">
                      <p>{new Date(appointment.date).toLocaleDateString()}</p>
                      <p>{appointment.time}</p>
                    </td>

                    <td>
                      <span
                        className={`badge text-white ${
                          appointment.status === "completed"
                            ? "badge-success"
                            : appointment.status === "cancelled" ||
                              appointment.status === "cancelled_by_patient" ||
                              appointment.status === "cancelled_by_doctor"
                            ? "badge-error"
                            : "badge-warning"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppointmentTable;