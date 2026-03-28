
import React, { useEffect, useMemo, useState } from "react";
import { FaClock } from "react-icons/fa6";

function ScheduleCard() {
  const [timeslot, setTimeslot] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeslotsData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user?.id) {
          setTimeslot([]);
          return;
        }

        const response = await fetch(
          `http://localhost:3000/api/timeslots/doctor/${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setTimeslot(data.data);
        } else {
          setTimeslot([]);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        setTimeslot([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeslotsData();
  }, []);

  const todaySlots = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return timeslot
      .map((slot) => {
        const slotDate = new Date(slot.slot_date).toISOString().slice(0, 10);

        return {
          ...slot,
          _slotDate: slotDate,
        };
      })
      .filter((slot) => slot._slotDate === today)
      .sort((a, b) => {
        const aTime = a.start_time || "";
        const bTime = b.start_time || "";
        return aTime.localeCompare(bTime);
      });
  }, [timeslot]);

  return (
    <div className="card bg-base-100 shadow-xl col-span-1 lg:col-span-2">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title text-lg sm:text-xl">Today’s Schedule</h2>

        {loading ? (
          <p className="text-center mt-4 text-sm sm:text-base text-gray-500">
            Loading...
          </p>
        ) : todaySlots.length === 0 ? (
          <p className="text-center mt-4 text-sm sm:text-base text-gray-500">
            No schedule available for today
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {todaySlots.map((slot) => (
              <button
                key={slot._id}
                className={`rounded-lg px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-white ${
                  slot.is_emergency ? "bg-red-500" : "bg-violet-500"
                }`}
              >
                {slot.start_time} - {slot.end_time}
              </button>
            ))}
          </div>
        )}

        <div className="divider"></div>

        <div className="flex gap-3 sm:gap-5 items-center">
          <div className="text-3xl sm:text-5xl md:text-7xl text-blue-500">
            <FaClock />
          </div>

          <div>
            <p className="font-semibold text-sm sm:text-base">
              Today Appointments
            </p>
            <p className="text-xl sm:text-2xl font-bold">{todaySlots.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleCard;