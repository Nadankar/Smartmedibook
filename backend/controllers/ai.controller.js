
import jwt from "jsonwebtoken";
import Patient from "../models/patient.model.js";
import User from "../models/user.model.js";
import Doctor from "../models/doctor.model.js";
import bcrypt from "bcrypt";

const normalizeDoctorText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\bdr\.?\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const AiController = {
  getAuthContext: async (req, res) => {
    try {
      let userId = req.user?.id || req.query.userId;

      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      if (!userId && token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded._id;
      }

      if (!userId) {
        return res.status(200).json({
          success: false,
          data: null,
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(200).json({
          success: false,
          data: null,
        });
      }

      // ✅ Patient should win if both records somehow exist
      const patient = await Patient.findOne({ user_id: user._id });
      let doctor = null;

      if (!patient) {
        doctor = await Doctor.findOne({ user_id: user._id });
      }

      const resolvedRole = patient ? "patient" : doctor ? "doctor" : user.role;

      return res.status(200).json({
        success: true,
        data: {
          userId: user._id,
          role: resolvedRole,
          patientId: patient?._id || null,
          doctorId: doctor?._id || null,
          patientName: patient?.name || null,
          doctorName: doctor?.name || null,
          dob: patient?.dob || null,
          phone: patient?.phone || doctor?.phone || null,
        },
      });
    } catch (error) {
      return res.status(200).json({
        success: false,
        data: null,
      });
    }
  },

  createPatientFromAi: async (req, res) => {
    try {
      const { name, dob, phone } = req.body;

      if (!name || !dob || !phone) {
        return res.status(400).json({
          success: false,
          message: "name, dob and phone are required",
        });
      }

      const email = `ai_${Date.now()}@smartmedibook.local`;
      const password = await bcrypt.hash("Temp@123456", 10);

      const user = await User.create({
        name,
        email,
        password,
        role: "patient",
      });

      const patient = await Patient.create({
        user_id: user._id,
        name,
        dob: new Date(dob),
        email,
        gender: "Other",
        phone,
        bloodGroup: "O+",
        medicalHistory: "Created by AI assistant",
      });

      return res.status(201).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  listDoctorsForAi: async (req, res) => {
    try {
      const { specialization, search } = req.query;

      const filter = { isActive: true };
      if (specialization) {
        filter.specialization = String(specialization).toLowerCase();
      }

      let doctors = await Doctor.find(filter).sort({ name: 1 });

      if (search) {
        const normalizedSearch = normalizeDoctorText(search);
        const searchTokens = normalizedSearch.split(" ").filter(Boolean);

        doctors = doctors.filter((doctor) => {
          const normalizedName = normalizeDoctorText(doctor.name);
          return (
            normalizedName.includes(normalizedSearch) ||
            searchTokens.every((token) => normalizedName.includes(token))
          );
        });
      }

      return res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default AiController;