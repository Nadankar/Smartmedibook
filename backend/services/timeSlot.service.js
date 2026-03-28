
import TimeSlot from "../models/timeslot.model.js";
import Doctor from "../models/doctor.model.js";

class TimeSlotService {
  static async createTimeSlot(data) {
    try {
      const timeSlot = new TimeSlot(data);
      return await timeSlot.save();
    } catch (error) {
      throw error;
    }
  }

  static async getTimeSlot(doctorUserId) {
    try {
      const doctor = await Doctor.findOne({ user_id: doctorUserId });

      if (!doctor) {
        return [];
      }

      return await TimeSlot.find({ doctor_id: doctor._id }).sort({
        slot_date: 1,
        start_time: 1,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getAllTimeSlots() {
    try {
      return await TimeSlot.find().sort({ slot_date: 1, start_time: 1 });
    } catch (error) {
      throw error;
    }
  }

  static async updateTimeSlot(id, updateData) {
    try {
      return await TimeSlot.findByIdAndUpdate(id, updateData, {
        returnDocument: "after",
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteTimeSlot(id) {
    try {
      return await TimeSlot.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }
}

export default TimeSlotService;