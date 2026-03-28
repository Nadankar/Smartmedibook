
import mongoose from "mongoose";

const timeslotSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },

    slot_date: {
      type: Date,
      required: true
    },

    start_time: {
      type: String,
      required: true
    },

    end_time: {
      type: String,
      required: false,
      default: ""
    },

    is_availability: {
      type: Boolean,
      required: true,
      default: true
    },

    is_emergency: {
      type: Boolean,
      required: true,
      default: false
    },

    status: {
      type: String,
      enum: ["available", "booked", "cancelled"],
      default: "available"
    },

    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null
    }
  },
  { timestamps: true }
);

timeslotSchema.index({ doctor_id: 1, slot_date: 1, start_time: 1 }, { unique: true });

const TimeSlot = mongoose.model("TimeSlot", timeslotSchema);
export default TimeSlot;