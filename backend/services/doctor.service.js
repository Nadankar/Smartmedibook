
import mongoose from "mongoose";
import Doctor from "../models/doctor.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

class DoctorService {

  static async createDoctor(doctorData) {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

      const {
        name,
        email,
        password,
        phone,
        specialization,
        experience,
        img
      } = doctorData;

      if (!name || !email || !password || !phone || !specialization || !experience || !img) {
        throw new Error("All fields are required");
      }

      if (phone.length !== 10) {
        throw new Error("Phone should be 10 digits");
      }

      const existingUser = await User.findOne({ email }).session(session);

      if (existingUser) {
        throw new Error("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create([{
        name,
        email,
        password: hashedPassword,
        role: "doctor"
      }], { session });

      const doctor = await Doctor.create([{
        user_id: user[0]._id,
        name,
        email,
        phone,
        specialization,
        experience,
        img
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return { user: user[0], doctor: doctor[0] };

    } catch (error) {

      await session.abortTransaction();
      session.endSession();

      throw error;
    }
  }




    //Get doctor by id
    static async getDoctor(id) { 
        try {
            const doctor = await Doctor.findOne({ user_id: id });
            return doctor;
        } catch (error) {
            throw error;
        }
    }
    //Get all doctors 
    static async getAllDoctors() {
        try {
            return await Doctor.find();
        } catch (error) {
            throw error;  
        }
    }
    //Update all doctors
    static async updateDoctor(id, updateData) {
        try {
            return await Doctor.findByIdAndUpdate(id, updateData, { new: true });
        } catch (error) {
            throw error;
        }
    }

    //Delete doctor
    static async deleteDoctor(id) {
        const doctor = await Doctor.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!doctor) {
            throw new Error("Doctor not found");
        }
 
        return doctor;
    }

    //Restore doctor

    static async restoreDoctor(id) {
        const doctor = await Doctor.findByIdAndUpdate(id, { isActive: true }, { new: true });

        if (!doctor) {
            throw new Error("Doctor not found");
        }
        return doctor;
    }

}

export default DoctorService;