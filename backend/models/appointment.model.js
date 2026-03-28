import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "cancelled_by_patient",
        "cancelled_by_doctor",
        "rescheduled_required"
      ],
      required: true,
      default: "pending"
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    cancelReason: {
      type: String,
      default: null,
      trim: true
    },
    time: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    priorityScore: {
      type: Number,
      default: 20
    },
    urgencyLabel: {
      type: String,
      enum: ["routine", "followup", "urgent", "emergency"],
      default: "routine"
    },
    source: {
      type: String,
      default: "web_app"
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    overrideMeta: {
      overriddenByUrgency: {
        type: String,
        default: null
      },
      overriddenByScore: {
        type: Number,
        default: null
      },
      overriddenAt: {
        type: Date,
        default: null
      },
      overriddenByAppointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        default: null
      }
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor_id: 1, date: 1, time: 1 });
appointmentSchema.index({ patient_id: 1, date: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;