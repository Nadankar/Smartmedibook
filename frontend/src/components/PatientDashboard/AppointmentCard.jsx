import React, { useEffect, useMemo, useState } from "react";


const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

function AppointmentCard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
        `${API_URL}/api/appointments/patient/${user.id}`,
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
        setAppointments(data.data);
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

  const handleCancel = async (id, status) => {
    if (status !== "pending") return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchAppointmentData(false);
      } else {
        alert(data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment", error);
      alert("Error cancelling appointment");
    }
  };

  useEffect(() => {
    fetchAppointmentData(true);

    const handleRefresh = () => {
      fetchAppointmentData(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAppointmentData(false);
      }
    };

    window.addEventListener("appointments:refresh", handleRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("appointments:refresh", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const latestAppointment = useMemo(() => {
    if (!appointments.length) return null;

    const sorted = [...appointments].sort((a, b) => {
      const aDateTime = new Date(
        `${String(a.date).slice(0, 10)}T${a.time || "00:00"}:00`
      ).getTime();

      const bDateTime = new Date(
        `${String(b.date).slice(0, 10)}T${b.time || "00:00"}:00`
      ).getTime();

      return bDateTime - aDateTime;
    });

    const active = sorted.find(
      (appt) => appt.status === "pending" || appt.status === "confirmed"
    );

    return active || sorted[0];
  }, [appointments]);

  if (loading) {
    return <p className="text-center mt-4 text-sm sm:text-base">Loading...</p>;
  }

  if (!latestAppointment) {
    return (
      <p className="text-center mt-4 text-sm sm:text-base">
        No appointments found
      </p>
    );
  }

  const statusClass =
    latestAppointment.status === "completed"
      ? "bg-green-100 text-green-700"
      : latestAppointment.status === "pending" ||
        latestAppointment.status === "confirmed"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="card bg-base-100 shadow-xl col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-3 mb-4">
      <div className="card-body p-3 sm:p-4 md:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
          <h2 className="card-title text-sm sm:text-base md:text-lg">
            Current Appointment
          </h2>

          <span
            className={`px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs md:text-sm rounded-sm shadow font-medium ${statusClass}`}
          >
            {latestAppointment.status}
          </span>
        </div>

        <div className="rounded-lg p-1 grid gap-1 sm:gap-2 mt-2">
          <p className="font-semibold text-xs sm:text-sm md:text-base">
            {latestAppointment.doctor_id?.name || "Doctor"}
          </p>

          <p className="text-xs sm:text-sm md:text-sm">
            {latestAppointment.doctor_id?.specialization || ""}
          </p>

          <p className="text-xs sm:text-sm md:text-sm break-words">
            📅 {new Date(latestAppointment.date).toLocaleDateString()} | ⏰{" "}
            {latestAppointment.time}
          </p>

          <div className="flex gap-2 mt-2 sm:mt-3">
            <button
              className="btn btn-error btn-xs sm:btn-sm md:btn-md"
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel?")) {
                  handleCancel(latestAppointment._id, latestAppointment.status);
                }
              }}
              disabled={latestAppointment.status !== "pending"}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentCard;