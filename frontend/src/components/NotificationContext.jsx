import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { socket } from "../socket";

const NotificationContext = createContext();

const STORAGE_KEY = "smartmedibook_notifications";

const formatDate = (dateValue) => {
  try {
    return new Date(dateValue).toLocaleDateString();
  } catch {
    return "";
  }
};

const getDoctorName = (appointment) => {
  const name =
    appointment?.doctor_id?.name ||
    appointment?.doctorId?.name ||
    "Doctor";

  return name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
};

const getPatientName = (appointment) => {
  return (
    appointment?.patient_id?.name ||
    appointment?.patientId?.name ||
    "Patient"
  );
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const processedEventsRef = useRef(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (message) => {
    const newNotification = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 30));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const isDuplicateEvent = (eventKey) => {
    if (!eventKey) return false;

    if (processedEventsRef.current.has(eventKey)) {
      return true;
    }

    processedEventsRef.current.add(eventKey);

    setTimeout(() => {
      processedEventsRef.current.delete(eventKey);
    }, 3000);

    return false;
  };

  useEffect(() => {
    const handleNewAppointment = (payload) => {
      const appointment = payload?.appointment || payload;
      if (!appointment?._id) return;

      const eventKey = `new_${appointment._id}`;
      if (isDuplicateEvent(eventKey)) return;

      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const doctorName = getDoctorName(appointment);
      const patientName = getPatientName(appointment);
      const dateText = formatDate(appointment.date);
      const timeText = appointment.time || "";

      if (currentUser?.role === "patient") {
        addNotification(
          `Appointment booked with ${doctorName} on ${dateText} at ${timeText}`
        );
      } else if (currentUser?.role === "doctor") {
        addNotification(
          `New appointment: ${patientName} on ${dateText} at ${timeText}`
        );
      } else {
        addNotification(`New appointment booked on ${dateText} at ${timeText}`);
      }

      window.dispatchEvent(
        new CustomEvent("appointments:refresh", {
          detail: { appointment, type: "created" },
        })
      );

      window.dispatchEvent(
        new CustomEvent("appointment:highlight-new", {
          detail: { appointmentId: appointment._id, appointment },
        })
      );
    };

    const handleUpdatedAppointment = (payload) => {
      const appointment = payload?.appointment || payload;
      const type = payload?.type || "updated";

      if (!appointment?._id) {
        window.dispatchEvent(new Event("appointments:refresh"));
        return;
      }

      const eventKey = `${type}_${appointment._id}`;
      if (isDuplicateEvent(eventKey)) return;

      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const doctorName = getDoctorName(appointment);
      const patientName = getPatientName(appointment);
      const dateText = formatDate(appointment.date);
      const timeText = appointment.time || "";

      if (type === "cancelled_by_patient") {
        if (currentUser?.role === "doctor") {
          addNotification(
            `${patientName} cancelled the appointment on ${dateText} at ${timeText}`
          );
        } else {
          addNotification(
            `Appointment cancelled on ${dateText} at ${timeText}`
          );
        }
      } else if (type === "cancelled_by_doctor") {
        if (currentUser?.role === "patient") {
          addNotification(
            `${doctorName} cancelled your appointment on ${dateText} at ${timeText}`
          );
        } else {
          addNotification(
            `Appointment cancelled on ${dateText} at ${timeText}`
          );
        }
      } else if (type === "completed") {
        if (currentUser?.role === "patient") {
          addNotification(
            `Your appointment on ${dateText} at ${timeText} was marked completed`
          );
        } else {
          addNotification(
            `Appointment on ${dateText} at ${timeText} marked completed`
          );
        }
      } else if (type === "rescheduled_required") {
        addNotification(
          `Appointment on ${dateText} at ${timeText} needs rescheduling`
        );
      } else {
        addNotification(
          `Appointment updated for ${dateText} at ${timeText}`
        );
      }

      window.dispatchEvent(
        new CustomEvent("appointments:refresh", {
          detail: { appointment, type },
        })
      );
    };

    socket.on("appointment:new", handleNewAppointment);
    socket.on("appointment:updated", handleUpdatedAppointment);

    return () => {
      socket.off("appointment:new", handleNewAppointment);
      socket.off("appointment:updated", handleUpdatedAppointment);
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}