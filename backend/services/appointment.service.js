import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";
import Patient from "../models/patient.model.js";
import TimeSlot from "../models/timeslot.model.js";
import { getIo } from "../socket.js";

const normalizeDate = (inputDate) => {
  const [year, month, day] = String(inputDate).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const guessEndTime = (start) => {
  if (!start || !start.includes(":")) return "";
  const [h, m] = start.split(":").map(Number);
  const end = new Date();
  end.setHours(h, m + 30, 0, 0);
  const hh = String(end.getHours()).padStart(2, "0");
  const mm = String(end.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const getDateOnlyUTC = (dateValue) => {
  const d = new Date(dateValue);
  return d.toISOString().slice(0, 10);
};

const getIndiaNow = () => {
  const now = new Date();
  const indiaString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(indiaString);
};

const isTodayOrTomorrow = (inputDate) => {
  const target = getDateOnlyUTC(normalizeDate(inputDate));

  const indiaNow = getIndiaNow();
  const year = indiaNow.getFullYear();
  const month = String(indiaNow.getMonth() + 1).padStart(2, "0");
  const day = String(indiaNow.getDate()).padStart(2, "0");

  const today = `${year}-${month}-${day}`;

  const tomorrowDate = new Date(indiaNow);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(
    tomorrowDate.getMonth() + 1
  ).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;

  return target === today || target === tomorrow;
};

const isOverrideEligibleExistingUrgency = (urgency) => {
  return ["routine", "followup"].includes((urgency || "").toLowerCase());
};

const buildAppointmentDateTime = (appointment) => {
  const datePart = getDateOnlyUTC(appointment?.date);
  const timePart = appointment?.time || "00:00";
  return new Date(`${datePart}T${timePart}:00`);
};

const normalizeDoctorText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\bdr\.?\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getDoctorTokens = (value = "") =>
  normalizeDoctorText(value).split(" ").filter(Boolean);

const resolveDoctorForBooking = async ({ session, doctorId, doctorName }) => {
  if (doctorId) {
    return Doctor.findOne({ _id: doctorId, isActive: true }).session(session);
  }

  const rawName = String(doctorName || "").trim();
  if (!rawName) return null;

  const normalizedInput = normalizeDoctorText(rawName);
  const inputTokens = getDoctorTokens(rawName);

  const activeDoctors = await Doctor.find({ isActive: true }).session(session);
  if (!activeDoctors.length) return null;

  const scoredDoctors = activeDoctors
    .map((doctor) => {
      const normalizedDoctorName = normalizeDoctorText(doctor.name);
      const doctorTokens = getDoctorTokens(doctor.name);

      let score = 0;

      if (normalizedDoctorName === normalizedInput) score += 100;
      if (normalizedDoctorName.startsWith(normalizedInput)) score += 60;
      if (normalizedDoctorName.includes(normalizedInput)) score += 40;

      for (const token of inputTokens) {
        if (doctorTokens.includes(token)) score += 25;
        else if (normalizedDoctorName.includes(token)) score += 10;
      }

      return { doctor, score, normalizedDoctorName };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.normalizedDoctorName.localeCompare(b.normalizedDoctorName)
    );

  return scoredDoctors[0]?.doctor || null;
};

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



class AppointmentService {
  static async createAppointment(appointmentData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let {
        doctor_id,
        doctorId,
        doctorName,
        patient_id,
        patientId,
        status,
        reason,
        time,
        date,
        priorityScore,
        urgencyLabel,
        source,
      } = appointmentData;

      const finalPatientId = patient_id || patientId;
      const finalDoctorIdFromBody = doctor_id || doctorId;
      const finalUrgencyLabel = (urgencyLabel || "routine").toLowerCase();
      const finalPriorityScore = priorityScore ?? 20;

      if (!finalPatientId) throw new Error("patientId is required.");
      if (!reason || !time || !date) {
        throw new Error("reason, time and date are required.");
      }

      const normalizedDate = normalizeDate(date);

      const doctor = await resolveDoctorForBooking({
        session,
        doctorId: finalDoctorIdFromBody,
        doctorName,
      });

      if (!doctor) {
        throw new Error(
          "Doctor not found. Please use the exact doctor name shown in the doctors list."
        );
      }

      const patient = await Patient.findById(finalPatientId).session(session);
      if (!patient) throw new Error("Patient not found.");

      const existingAppointment = await Appointment.findOne({
        doctor_id: doctor._id,
        date: normalizedDate,
        time,
        status: { $in: ["pending", "completed"] },
      }).session(session);

      let displacedAppointment = null;

      if (existingAppointment) {
        const existingScore = existingAppointment.priorityScore ?? 20;
        const existingUrgency = (
          existingAppointment.urgencyLabel || "routine"
        ).toLowerCase();
        const overrideWindowAllowed = isTodayOrTomorrow(date);

        const canOverride =
          overrideWindowAllowed &&
          finalUrgencyLabel === "emergency" &&
          existingUrgency !== "emergency" &&
          isOverrideEligibleExistingUrgency(existingUrgency) &&
          finalPriorityScore > existingScore;

        if (!canOverride) {
          throw new Error("This doctor is already booked for the selected slot.");
        }

        existingAppointment.status = "rescheduled_required";
        existingAppointment.cancelledAt = new Date();
        existingAppointment.overrideMeta = {
          overriddenByUrgency: finalUrgencyLabel,
          overriddenByScore: finalPriorityScore,
          overriddenAt: new Date(),
          overriddenByAppointmentId: null,
        };

        await existingAppointment.save({ session });
        displacedAppointment = existingAppointment;

        await TimeSlot.findOneAndUpdate(
          {
            doctor_id: doctor._id,
            slot_date: normalizedDate,
            start_time: time,
          },
          {
            is_availability: true,
            status: "available",
            appointment_id: null,
            is_emergency: false,
          },
          { returnDocument: "after", session }
        );
      }

      const slot = await TimeSlot.findOne({
        doctor_id: doctor._id,
        slot_date: normalizedDate,
        start_time: time,
      }).session(session);

      if (
        slot &&
        slot.is_availability === false &&
        slot.status === "booked" &&
        (!displacedAppointment ||
          String(slot.appointment_id) !== String(displacedAppointment._id))
      ) {
        throw new Error("Selected timeslot is already booked.");
      }

      const appointment = await Appointment.create(
        [
          {
            doctor_id: doctor._id,
            patient_id: patient._id,
            status: status || "pending",
            reason,
            time,
            date: normalizedDate,
            priorityScore: finalPriorityScore,
            urgencyLabel: finalUrgencyLabel,
            source: source || "web_app",
          },
        ],
        { session }
      );

      if (displacedAppointment) {
        displacedAppointment.overrideMeta = {
          ...displacedAppointment.overrideMeta,
          overriddenByAppointmentId: appointment[0]._id,
        };
        await displacedAppointment.save({ session });
      }

      await TimeSlot.findOneAndUpdate(
        {
          doctor_id: doctor._id,
          slot_date: normalizedDate,
          start_time: time,
        },
        {
          doctor_id: doctor._id,
          slot_date: normalizedDate,
          start_time: time,
          end_time: guessEndTime(time),
          is_availability: false,
          is_emergency: finalUrgencyLabel === "emergency",
          status: "booked",
          appointment_id: appointment[0]._id,
        },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
          session,
        }
      );

      const populatedAppointment = await Appointment.findById(appointment[0]._id)
        .populate("doctor_id")
        .populate("patient_id")
        .session(session);

      let populatedDisplacedAppointment = null;
      if (displacedAppointment) {
        populatedDisplacedAppointment = await Appointment.findById(
          displacedAppointment._id
        )
          .populate("doctor_id")
          .populate("patient_id")
          .session(session);
      }

      await session.commitTransaction();
      session.endSession();

      emitAppointmentUpdate(
        populatedAppointment,
        displacedAppointment ? "overridden_and_created" : "created",
        { displacedAppointment: populatedDisplacedAppointment }
      );

      if (populatedDisplacedAppointment?.patient_id?.user_id) {
        emitAppointmentUpdate(
          populatedDisplacedAppointment,
          "rescheduled_required",
          { replacedBy: populatedAppointment }
        );
      }

      return populatedAppointment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getAppointmentById(id) {
    return await Appointment.findById(id)
      .populate("doctor_id")
      .populate("patient_id");
  }

  static async getAllAppointments() {
    return await Appointment.find()
      .populate("doctor_id")
      .populate("patient_id");
  }

  static async getAppointmentsByDoctorUserId(doctorUserId) {
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) return [];

    return await Appointment.find({
      doctor_id: doctor._id,
      status: { $nin: ["rescheduled_required"] },
    })
      .populate("patient_id")
      .sort({ date: 1, time: 1 });
  }

  static async getAppointmentsByPatientUserId(patientUserId) {
    const patient = await Patient.findOne({ user_id: patientUserId });
    if (!patient) return [];

    return await Appointment.find({
      patient_id: patient._id,
      status: { $nin: ["rescheduled_required"] },
    })
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });
  }

  static async getNextPatientByDoctorUserId(doctorUserId) {
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) return null;

    const now = getIndiaNow();

    const appointments = await Appointment.find({
      doctor_id: doctor._id,
      status: "pending",
    })
      .populate("patient_id")
      .sort({ date: 1, time: 1 });

    const upcomingAppointments = appointments.filter((appointment) => {
      const appointmentDateTime = buildAppointmentDateTime(appointment);
      return (
        !Number.isNaN(appointmentDateTime.getTime()) &&
        appointmentDateTime >= now
      );
    });

    return upcomingAppointments[0] || null;
  }

  static async getUrgentQueueByDoctorUserId(doctorUserId) {
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) return [];

    const now = getIndiaNow();

    const appointments = await Appointment.find({
      doctor_id: doctor._id,
      status: "pending",
      urgencyLabel: { $in: ["urgent", "emergency"] },
    })
      .populate("patient_id")
      .sort({ priorityScore: -1, date: 1, time: 1 });

    return appointments.filter((appointment) => {
      const appointmentDateTime = buildAppointmentDateTime(appointment);
      return (
        !Number.isNaN(appointmentDateTime.getTime()) &&
        appointmentDateTime >= now
      );
    });
  }

  static async findPatientCancellationTarget(patientUserId, filters = {}) {
    const patient = await Patient.findOne({ user_id: patientUserId });
    if (!patient) {
      throw new Error("Patient not found.");
    }

    const query = {
      patient_id: patient._id,
      status: "pending",
    };

    if (filters.date) {
      query.date = normalizeDate(filters.date);
    }

    if (filters.time) {
      query.time = filters.time;
    }

    let appointments = await Appointment.find(query)
      .populate("patient_id")
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });

    if (filters.doctorName) {
      const searchDoctor = normalizeDoctorText(filters.doctorName);
      appointments = appointments.filter((appointment) => {
        const doctorName = normalizeDoctorText(appointment.doctor_id?.name || "");
        return doctorName.includes(searchDoctor);
      });
    }

    if (!appointments.length) {
      return {
        success: false,
        message: "No matching appointment found.",
      };
    }

    if (appointments.length > 1) {
      return {
        success: false,
        ambiguous: true,
        message:
          "Multiple matching appointments found. Please provide doctor name, date, or time more precisely.",
        data: appointments.map((appointment) => ({
          _id: appointment._id,
          date: appointment.date,
          time: appointment.time,
          doctor_id: {
            _id: appointment.doctor_id?._id,
            name: appointment.doctor_id?.name,
          },
        })),
      };
    }

    return {
      success: true,
      data: appointments[0],
    };
  }

  static async findDoctorCancellationTarget(doctorUserId, filters = {}) {
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) {
      throw new Error("Doctor not found.");
    }

    const query = {
      doctor_id: doctor._id,
      status: "pending",
    };

    if (filters.date) {
      query.date = normalizeDate(filters.date);
    }

    if (filters.time) {
      query.time = filters.time;
    }

    let appointments = await Appointment.find(query)
      .populate("patient_id")
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });

    if (filters.patientName) {
      const searchName = filters.patientName.trim().toLowerCase();
      appointments = appointments.filter((appointment) =>
        (appointment.patient_id?.name || "").toLowerCase().includes(searchName)
      );
    }

    if (!appointments.length) {
      return {
        success: false,
        message: "No matching appointment found in your schedule.",
      };
    }

    if (appointments.length > 1) {
      return {
        success: false,
        ambiguous: true,
        message:
          "Multiple matching appointments found. Please provide patient name, date, or time more precisely.",
        data: appointments.map((appointment) => ({
          _id: appointment._id,
          date: appointment.date,
          time: appointment.time,
          patient_id: {
            _id: appointment.patient_id?._id,
            name: appointment.patient_id?.name,
          },
        })),
      };
    }

    return {
      success: true,
      data: appointments[0],
    };
  }

  static async updateAppointment(id, updateData) {
    const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
    })
      .populate("doctor_id")
      .populate("patient_id");

    if (!appointment) return null;

    emitAppointmentUpdate(appointment, "updated");
    return appointment;
  }

  static async cancelAppointment(id) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = await Appointment.findById(id).session(session);

      if (!appointment) throw new Error("Appointment not found.");

      if (
        ["cancelled_by_patient", "cancelled_by_doctor"].includes(
          appointment.status
        )
      ) {
        throw new Error("Appointment is already cancelled.");
      }

      appointment.status = "cancelled_by_patient";
      appointment.cancelledAt = new Date();
      await appointment.save({ session });

      await TimeSlot.findOneAndUpdate(
        {
          doctor_id: appointment.doctor_id,
          slot_date: appointment.date,
          start_time: appointment.time,
        },
        {
          is_availability: true,
          status: "available",
          appointment_id: null,
          is_emergency: false,
        },
        { returnDocument: "after", session }
      );

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate("doctor_id")
        .populate("patient_id")
        .session(session);

      await session.commitTransaction();
      session.endSession();

      emitAppointmentUpdate(populatedAppointment, "cancelled_by_patient");
      return populatedAppointment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async markCompletedByDoctor(appointmentId, doctorUserId) {
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) throw new Error("Doctor not found.");

    const appointment = await Appointment.findById(appointmentId)
      .populate("doctor_id")
      .populate("patient_id");

    if (!appointment) throw new Error("Appointment not found.");
    if (String(appointment.doctor_id._id) !== String(doctor._id)) {
      throw new Error("You can only complete your own appointments.");
    }
    if (appointment.status !== "pending") {
      throw new Error("Only pending appointments can be completed.");
    }

    const appointmentDateTime = buildAppointmentDateTime(appointment);
    const now = getIndiaNow();

    if (Number.isNaN(appointmentDateTime.getTime())) {
      throw new Error("Invalid appointment date/time.");
    }

    if (appointmentDateTime > now) {
      throw new Error("Future appointments cannot be marked as completed yet.");
    }

    appointment.status = "completed";
    await appointment.save();

    emitAppointmentUpdate(appointment, "completed");
    return appointment;
  }

  static async cancelAppointmentByDoctor(appointmentId, doctorUserId, reason) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const doctor = await Doctor.findOne({ user_id: doctorUserId }).session(
        session
      );
      if (!doctor) throw new Error("Doctor not found.");

      const appointment = await Appointment.findById(appointmentId)
        .populate("doctor_id")
        .populate("patient_id")
        .session(session);

      if (!appointment) throw new Error("Appointment not found.");
      if (String(appointment.doctor_id._id) !== String(doctor._id)) {
        throw new Error("You can only cancel your own appointments.");
      }
      if (appointment.status === "completed") {
        throw new Error("Completed appointments cannot be cancelled.");
      }
      if (
        ["cancelled_by_patient", "cancelled_by_doctor"].includes(
          appointment.status
        )
      ) {
        throw new Error("Appointment is already cancelled.");
      }
      if (!reason || !reason.trim()) {
        throw new Error("Cancellation reason is required.");
      }

      appointment.status = "cancelled_by_doctor";
      appointment.cancelReason = reason.trim();
      appointment.cancelledAt = new Date();
      await appointment.save({ session });

      await TimeSlot.findOneAndUpdate(
        {
          doctor_id: appointment.doctor_id._id,
          slot_date: appointment.date,
          start_time: appointment.time,
        },
        {
          is_availability: true,
          status: "available",
          appointment_id: null,
          is_emergency: false,
        },
        { returnDocument: "after", session }
      );

      await session.commitTransaction();
      session.endSession();

      emitAppointmentUpdate(appointment, "cancelled_by_doctor");
      return appointment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async deleteAppointment(id) {
    return await Appointment.findByIdAndDelete(id);
  }
}

export default AppointmentService;