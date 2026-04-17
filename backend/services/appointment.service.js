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
    console.log(`📋 getAppointmentsByDoctorUserId: Looking for doctor with user_id: ${doctorUserId}`);
    
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) {
      console.log(`❌ Doctor not found for user_id: ${doctorUserId}`);
      return [];
    }
    
    console.log(`✅ Found doctor: ${doctor.name} (${doctor._id})`);

    const appointments = await Appointment.find({
      doctor_id: doctor._id,
      status: { $nin: ["rescheduled_required"] },
    })
      .populate("patient_id")
      .sort({ date: 1, time: 1 });
    
    console.log(`📋 Found ${appointments.length} appointments for doctor`);
    return appointments;
  }

  static async getAppointmentsByPatientUserId(patientUserId) {
    console.log(`📋 getAppointmentsByPatientUserId: Looking for patient with user_id: ${patientUserId}`);
    
    // First try to find patient by user_id
    let patient = await Patient.findOne({ user_id: patientUserId });
    
    // If not found, try to find by _id (in case patient_id was passed)
    if (!patient && mongoose.Types.ObjectId.isValid(patientUserId)) {
      console.log(`   Trying to find patient by _id: ${patientUserId}`);
      patient = await Patient.findById(patientUserId);
    }
    
    if (!patient) {
      console.log(`❌ Patient not found for user_id: ${patientUserId}`);
      return [];
    }
    
    console.log(`✅ Found patient: ${patient.name} (${patient._id})`);
    console.log(`   Patient user_id: ${patient.user_id}`);

    const appointments = await Appointment.find({
      patient_id: patient._id,
      status: { $nin: ["rescheduled_required"] },
    })
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });
    
    console.log(`📋 Found ${appointments.length} appointments for patient`);
    appointments.forEach((app, idx) => {
      console.log(`   ${idx + 1}. ${app.date} ${app.time} - ${app.doctor_id?.name} (${app.status})`);
    });
    
    return appointments;
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
    console.log(`🔍 findPatientCancellationTarget called with patientUserId: ${patientUserId}`);
    console.log(`   Filters:`, filters);
    
    // Try to find patient by user_id first, then by _id
    let patient = await Patient.findOne({ user_id: patientUserId });
    
    if (!patient && mongoose.Types.ObjectId.isValid(patientUserId)) {
      console.log(`   Trying to find patient by _id: ${patientUserId}`);
      patient = await Patient.findById(patientUserId);
    }
    
    if (!patient) {
      console.log(`❌ Patient not found for ID: ${patientUserId}`);
      throw new Error("Patient not found.");
    }
    
    console.log(`✅ Found patient: ${patient.name} (${patient._id})`);

    const query = {
      patient_id: patient._id,
      status: "pending",
    };

    if (filters.date) {
      query.date = normalizeDate(filters.date);
      console.log(`   Filtering by date: ${query.date}`);
    }

    if (filters.time) {
      query.time = filters.time;
      console.log(`   Filtering by time: ${query.time}`);
    }

    let appointments = await Appointment.find(query)
      .populate("patient_id")
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });

    console.log(`   Found ${appointments.length} appointments before doctor filter`);

    if (filters.doctorName) {
      const searchDoctor = normalizeDoctorText(filters.doctorName);
      console.log(`   Filtering by doctor name: ${searchDoctor}`);
      
      appointments = appointments.filter((appointment) => {
        const doctorName = normalizeDoctorText(appointment.doctor_id?.name || "");
        const matches = doctorName.includes(searchDoctor);
        if (matches) {
          console.log(`      Matched: ${appointment.doctor_id?.name}`);
        }
        return matches;
      });
      
      console.log(`   Found ${appointments.length} appointments after doctor filter`);
    }

    if (!appointments.length) {
      return {
        success: false,
        message: "No matching appointment found.",
      };
    }

    if (appointments.length > 1) {
      console.log(`   Multiple matches found (${appointments.length}), returning ambiguous response`);
      return {
        success: false,
        ambiguous: true,
        message: "Multiple matching appointments found. Please provide doctor name, date, or time more precisely.",
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

    console.log(`   ✅ Single match found: ${appointments[0]._id}`);
    return {
      success: true,
      data: appointments[0],
    };
  }

  static async findDoctorCancellationTarget(doctorUserId, filters = {}) {
    console.log(`🔍 findDoctorCancellationTarget called with doctorUserId: ${doctorUserId}`);
    console.log(`   Filters:`, filters);
    
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) {
      console.log(`❌ Doctor not found for user_id: ${doctorUserId}`);
      throw new Error("Doctor not found.");
    }
    
    console.log(`✅ Found doctor: ${doctor.name} (${doctor._id})`);

    const query = {
      doctor_id: doctor._id,
      status: "pending",
    };

    if (filters.date) {
      query.date = normalizeDate(filters.date);
      console.log(`   Filtering by date: ${query.date}`);
    }

    if (filters.time) {
      query.time = filters.time;
      console.log(`   Filtering by time: ${query.time}`);
    }

    let appointments = await Appointment.find(query)
      .populate("patient_id")
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });

    console.log(`   Found ${appointments.length} appointments before patient filter`);

    if (filters.patientName) {
      const searchName = filters.patientName.trim().toLowerCase();
      console.log(`   Filtering by patient name: ${searchName}`);
      
      appointments = appointments.filter((appointment) => {
        const patientName = (appointment.patient_id?.name || "").toLowerCase();
        const matches = patientName.includes(searchName);
        if (matches) {
          console.log(`      Matched: ${appointment.patient_id?.name}`);
        }
        return matches;
      });
      
      console.log(`   Found ${appointments.length} appointments after patient filter`);
    }

    if (!appointments.length) {
      return {
        success: false,
        message: "No matching appointment found in your schedule.",
      };
    }

    if (appointments.length > 1) {
      console.log(`   Multiple matches found (${appointments.length}), returning ambiguous response`);
      return {
        success: false,
        ambiguous: true,
        message: "Multiple matching appointments found. Please provide patient name, date, or time more precisely.",
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

    console.log(`   ✅ Single match found: ${appointments[0]._id}`);
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
  console.log("=" * 60);
  console.log("🚨 cancelAppointmentByDoctor START");
  console.log(`   appointmentId: ${appointmentId}`);
  console.log(`   doctorUserId: ${doctorUserId}`);
  console.log(`   reason: ${reason}`);
  console.log("=" * 60);
  
  // Validate inputs
  if (!appointmentId) {
    console.log("❌ No appointmentId provided");
    throw new Error("Appointment ID is required");
  }
  
  if (!doctorUserId) {
    console.log("❌ No doctorUserId provided");
    throw new Error("Doctor User ID is required");
  }
  
  if (!reason || !reason.trim()) {
    console.log("❌ No reason provided");
    throw new Error("Cancellation reason is required");
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Find the doctor
    console.log("📞 Looking for doctor with user_id:", doctorUserId);
    let doctor = await Doctor.findOne({ user_id: doctorUserId }).session(session);
    
    // If not found by user_id, try finding by _id
    if (!doctor && mongoose.Types.ObjectId.isValid(doctorUserId)) {
      console.log("   Doctor not found by user_id, trying by _id:", doctorUserId);
      doctor = await Doctor.findById(doctorUserId).session(session);
    }
    
    if (!doctor) {
      console.log("❌ Doctor not found for ID:", doctorUserId);
      throw new Error(`Doctor not found. Please ensure you are logged in as a doctor.`);
    }
    
    console.log(`✅ Found doctor: ${doctor.name} (${doctor._id})`);
    console.log(`   Doctor user_id: ${doctor.user_id}`);

    // Step 2: Find the appointment
    console.log("📞 Looking for appointment with ID:", appointmentId);
    
    // Validate appointment ID format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      console.log("❌ Invalid appointment ID format");
      throw new Error("Invalid appointment ID format");
    }
    
    const appointment = await Appointment.findById(appointmentId)
      .populate("doctor_id")
      .populate("patient_id")
      .session(session);

    if (!appointment) {
      console.log("❌ Appointment not found for ID:", appointmentId);
      throw new Error(`Appointment not found with ID: ${appointmentId}`);
    }
    
    console.log(`✅ Found appointment:`);
    console.log(`   Patient: ${appointment.patient_id?.name || 'Unknown'}`);
    console.log(`   Doctor: ${appointment.doctor_id?.name || 'Unknown'}`);
    console.log(`   Date: ${appointment.date}`);
    console.log(`   Time: ${appointment.time}`);
    console.log(`   Status: ${appointment.status}`);
    console.log(`   Appointment Doctor ID: ${appointment.doctor_id?._id}`);
    console.log(`   Current Doctor ID: ${doctor._id}`);

    // Step 3: Verify doctor owns this appointment
    const appointmentDoctorId = appointment.doctor_id?._id.toString();
    const currentDoctorId = doctor._id.toString();
    
    console.log(`   Comparing: ${appointmentDoctorId} === ${currentDoctorId}`);
    
    if (appointmentDoctorId !== currentDoctorId) {
      console.log("❌ Doctor does not own this appointment");
      throw new Error("You can only cancel your own appointments.");
    }
    console.log("✅ Doctor verified as owner");

    // Step 4: Check appointment status
    if (appointment.status === "completed") {
      console.log("❌ Appointment already completed");
      throw new Error("Completed appointments cannot be cancelled.");
    }
    
    if (["cancelled_by_patient", "cancelled_by_doctor"].includes(appointment.status)) {
      console.log(`❌ Appointment already cancelled (status: ${appointment.status})`);
      throw new Error("Appointment is already cancelled.");
    }
    
    console.log("✅ Appointment status is valid for cancellation");

    // Step 5: Update appointment
    console.log("📝 Updating appointment status...");
    appointment.status = "cancelled_by_doctor";
    appointment.cancelReason = reason.trim();
    appointment.cancelledAt = new Date();
    await appointment.save({ session });
    console.log("✅ Appointment updated");

    // Step 6: Update timeslot
    console.log("📝 Updating timeslot...");
    const slotDate = appointment.date;
    const slotTime = appointment.time;
    
    console.log(`   Looking for timeslot with:`);
    console.log(`   doctor_id: ${appointment.doctor_id._id}`);
    console.log(`   slot_date: ${slotDate}`);
    console.log(`   start_time: ${slotTime}`);
    
    const timeslotUpdate = await TimeSlot.findOneAndUpdate(
      {
        doctor_id: appointment.doctor_id._id,
        slot_date: slotDate,
        start_time: slotTime,
      },
      {
        status: "available",
        appointment_id: null,
        is_emergency: false,
      },
      { 
        returnDocument: "after", 
        session,
        upsert: false 
      }
    );
    
    if (timeslotUpdate) {
      console.log("✅ Timeslot updated to available");
    } else {
      console.log("⚠️ No timeslot found to update (may not exist)");
    }

    // Step 7: Commit transaction
    await session.commitTransaction();
    session.endSession();
    console.log("✅ Transaction committed successfully");

    // Step 8: Emit socket event
    try {
      emitAppointmentUpdate(appointment, "cancelled_by_doctor");
      console.log("✅ Socket event emitted");
    } catch (socketError) {
      console.log("⚠️ Socket event failed:", socketError.message);
      // Don't throw - appointment is already cancelled
    }

    // Step 9: Return populated appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("doctor_id")
      .populate("patient_id");
    
    console.log("✅ cancelAppointmentByDoctor COMPLETED SUCCESSFULLY");
    console.log("=" * 60);
    
    return populatedAppointment;
    
  } catch (error) {
    console.log("❌ ERROR in cancelAppointmentByDoctor");
    console.log(`   Error message: ${error.message}`);
    console.log(`   Error stack: ${error.stack}`);
    console.log("=" * 60);
    
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