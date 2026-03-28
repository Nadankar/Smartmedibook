import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true
    }, 

    phone: {
        type: String,
        required: true
    }, 

    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required:true
    },

    medicalHistory: {
        type: String,
        required:true
    }, 
    img:{
        type:String,
        default:"https://www.seekpng.com/png/full/514-5147412_default-avatar-icon.png"
    },

}, { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
