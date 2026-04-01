
import express from "express";
import cors from "cors";

import appointmentRoutes from "./routes/appointment.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import authRoutes from "./routes/auth.routes.js";
import timeSlotRoutes from "./routes/timeSlot.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

app.use(
  cors({
    origin: "https://smartmedibook.onrender.com", 
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;


