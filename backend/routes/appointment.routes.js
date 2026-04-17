import express from "express";
import appointmentController from "../controllers/appointment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes (no auth required)
router.post("/", appointmentController.handleCreateAppointment);
router.get("/", appointmentController.handleGetAllAppointments);
router.get("/:id", appointmentController.handleGetAppointment);

// Patient routes (no auth required for viewing, but we may add later)
router.get(
  "/patient/:patientId",
  appointmentController.handleGetAppointmentsByPatient
);
router.get(
  "/patient/:patientId/find-target",
  appointmentController.handleFindPatientCancellationTarget
);

// Doctor routes (require doctor authentication)
router.get(
  "/doctor/:doctorId",
  authMiddleware("doctor"),
  appointmentController.handleGetAppointmentsByDoctor
);
router.get(
  "/doctor/:doctorId/next",
  authMiddleware("doctor"),
  appointmentController.handleGetNextPatientByDoctor
);
router.get(
  "/doctor/:doctorId/urgent-queue",
  authMiddleware("doctor"),
  appointmentController.handleGetUrgentQueueByDoctor
);
router.get(
  "/doctor/:doctorId/find-target",
  authMiddleware("doctor"),
  appointmentController.handleFindDoctorCancellationTarget
);

// Appointment update routes
router.put("/:id", appointmentController.handleUpdateAppointment);
router.patch("/:id/cancel", appointmentController.handleCancelAppointment);

// Doctor action routes (require doctor authentication)
router.put(
  "/:id/doctor-complete",
  authMiddleware("doctor"),
  appointmentController.handleMarkCompletedByDoctor
);
router.put(
  "/:id/doctor-cancel",
  authMiddleware("doctor"),
  appointmentController.handleCancelByDoctor
);

// Delete route (admin only - you may want to add admin middleware)
router.delete("/:id", appointmentController.handleDeleteAppointment);

// Debug route - remove in production
router.get("/debug/check", (req, res) => {
  res.json({
    message: "Appointment routes are working",
    routes: [
      "POST /",
      "GET /",
      "GET /:id",
      "GET /patient/:patientId",
      "GET /patient/:patientId/find-target",
      "GET /doctor/:doctorId",
      "GET /doctor/:doctorId/next",
      "GET /doctor/:doctorId/urgent-queue",
      "GET /doctor/:doctorId/find-target",
      "PUT /:id",
      "PATCH /:id/cancel",
      "PUT /:id/doctor-complete",
      "PUT /:id/doctor-cancel",
      "DELETE /:id"
    ]
  });
});

export default router;
