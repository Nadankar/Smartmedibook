import { getIo } from "../socket.js";

const emitAppointmentUpdate = (appointment, type = "updated", extra = {}) => {
  const io = getIo();

  const eventName =
    type === "created" || type === "overridden_and_created"
      ? "appointment:new"
      : "appointment:updated";

  const payload = {
    type,
    appointment,
    ...extra,
  };

  if (appointment.doctor_id?.user_id) {
    io.to(`user:${appointment.doctor_id.user_id}`).emit(eventName, payload);
    io.to(`doctor:${appointment.doctor_id.user_id}`).emit(eventName, payload);
  }

  if (appointment.patient_id?.user_id) {
    io.to(`user:${appointment.patient_id.user_id}`).emit(eventName, payload);
    io.to(`patient:${appointment.patient_id.user_id}`).emit(eventName, payload);
  }
};

export default emitAppointmentUpdate;