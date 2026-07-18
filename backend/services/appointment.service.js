import mongoose from "mongoose";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";
import Patient from "../models/patient.model.js";
import TimeSlot from "../models/timeslot.model.js";
import { getIo } from "../socket.js";


import {
  normalizeDate,
  getIndiaNow,
  buildAppointmentDateTime,
} from "../utils/date.utils.js";

import {
  resolveDoctorForBooking,
} from "../utils/doctor.utils.js";

import emitAppointmentUpdate from "../utils/socket.utils.js";


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
    
    const doctor = await Doctor.findOne({ user_id: doctorUserId });
    if (!doctor) {
      console.log(` Doctor not found for user_id: ${doctorUserId}`);
      return [];
    }

    const appointments = await Appointment.find({
      doctor_id: doctor._id,
      status: { $nin: ["rescheduled_required"] },
    })
      .populate("patient_id")
      .sort({ date: 1, time: 1 });
    
    return appointments;
  }



  static async getAppointmentsByPatientUserId(patientUserId) {
    
    // First try to find patient by user_id
    let patient = await Patient.findOne({ user_id: patientUserId });
    
    // If not found, try to find by _id (in case patient_id was passed)
    if (!patient && mongoose.Types.ObjectId.isValid(patientUserId)) {
      patient = await Patient.findById(patientUserId);
    }
    
    if (!patient) {
      return [];
    }
  
    const appointments = await Appointment.find({
      patient_id: patient._id,
      status: { $nin: ["rescheduled_required"] },
    })
      .populate("doctor_id")
      .sort({ date: 1, time: 1 });
    
    
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
    
    
    // Try to find patient by user_id first, then by _id
    let patient = await Patient.findOne({ user_id: patientUserId });
    
    if (!patient && mongoose.Types.ObjectId.isValid(patientUserId)) {
      patient = await Patient.findById(patientUserId);
    }
    
    if (!patient) {
      throw new Error("Patient not found.");
    }

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


    if (filters.doctorName) {
      const searchDoctor = normalizeDoctorText(filters.doctorName);
      
      appointments = appointments.filter((appointment) => {
        const doctorName = normalizeDoctorText(appointment.doctor_id?.name || "");
        const matches = doctorName.includes(searchDoctor);
        if (matches) {
          console.log(`      Matched: ${appointment.doctor_id?.name}`);
        }
        return matches;
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
      
      appointments = appointments.filter((appointment) => {
        const patientName = (appointment.patient_id?.name || "").toLowerCase();
        const matches = patientName.includes(searchName);
       
        return matches;
      });
      
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

  
  // Validate inputs
  if (!appointmentId) {
    throw new Error("Appointment ID is required");
  }
  
  if (!doctorUserId) {
    throw new Error("Doctor User ID is required");
  }
  
  if (!reason || !reason.trim()) {
    throw new Error("Cancellation reason is required");
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Find the doctor
    let doctor = await Doctor.findOne({ user_id: doctorUserId }).session(session);
    
    // If not found by user_id, try finding by _id
    if (!doctor && mongoose.Types.ObjectId.isValid(doctorUserId)) {
      doctor = await Doctor.findById(doctorUserId).session(session);
    }
    
    if (!doctor) {
      throw new Error(`Doctor not found. Please ensure you are logged in as a doctor.`);
    }
  
    
    // Validate appointment ID format 
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new Error("Invalid appointment ID format");
    }
    
    const appointment = await Appointment.findById(appointmentId)
      .populate("doctor_id")
      .populate("patient_id")
      .session(session);

    if (!appointment) {
      throw new Error(`Appointment not found with ID: ${appointmentId}`);
    }

    // Step 3: Verify doctor owns this appointment
    const appointmentDoctorId = appointment.doctor_id?._id.toString();
    const currentDoctorId = doctor._id.toString();
    
  
    
    if (appointmentDoctorId !== currentDoctorId) {
      
      throw new Error("You can only cancel your own appointments.");
    }

    // Step 4: Check appointment status
    if (appointment.status === "completed") {
      throw new Error("Completed appointments cannot be cancelled.");
    }
    
    if (["cancelled_by_patient", "cancelled_by_doctor"].includes(appointment.status)) {
      throw new Error("Appointment is already cancelled.");
    }
    
  
    // Step 5: Update appointment

    appointment.status = "cancelled_by_doctor";
    appointment.cancelReason = reason.trim();
    appointment.cancelledAt = new Date();
    await appointment.save({ session });

    // Step 6: Update timeslot
    const slotDate = appointment.date;
    const slotTime = appointment.time;
    
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
    

    // Step 7: Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Step 8: Emit socket event
    try {
      emitAppointmentUpdate(appointment, "cancelled_by_doctor");
    } catch (socketError) {
      console.log(" Socket event failed:", socketError.message);
    
    }

    // Step 9: Return populated appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("doctor_id")
      .populate("patient_id");
  
    
    return populatedAppointment;
    
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