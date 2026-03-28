import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    isActive: {
        type: Boolean,
        default: true,
    },
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true,
    },

    experience: {
        type:Number,
        required: true,
        min: 0
    },

    specialization: {
        type: String,
        enum: [
        "emergency",
        "icu",
        "general",
        "surgery",
        "cardiology",
        "neurology",
        "obgyn",
        "pediatrics", 
        "nicu",
        "orthopedics",
        "oncology",
        "dermatology",
        "ent",
        "psychiatry",
        "radiology",
        "pathology",
        "microbiology",
        "blood_bank",
        "pharmacy",
        "physiotherapy",
        "rehabilitation",
        "anesthesiology",
        "administration",
        "obstetrics & gynecology"
    ],
        required: true,
        trim: true,
         lowercase: true,
    },
    img:{
        type:String,
        required:true
    }
},
{ timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
