import AppointmentService from "../services/appointment.service.js";

const AppointmentController = {
  handleCreateAppointment: async (req, res) => {
    try {
      const appointment = await AppointmentService.createAppointment(req.body);
      res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error creating appointment",
      });
    }
  },

  handleGetAppointmentsByDoctor: async (req, res) => {
    try {
      const doctorUserId = req.params.doctorId;
      const appointments =
        await AppointmentService.getAppointmentsByDoctorUserId(doctorUserId);

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching appointments",
        error: error.message,
      });
    }
  },

  handleGetAppointmentsByPatient: async (req, res) => {
    try {
      const patientUserId = req.params.patientId;
      const appointments =
        await AppointmentService.getAppointmentsByPatientUserId(patientUserId);

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching patient appointments",
        error: error.message,
      });
    }
  },

  handleFindPatientCancellationTarget: async (req, res) => {
    try {
      const data = await AppointmentService.findPatientCancellationTarget(
        req.params.patientId,
        {
          doctorName: req.query.doctorName || "",
          date: req.query.date || "",
          time: req.query.time || "",
        }
      );

      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error identifying patient appointment",
      });
    }
  },

  handleGetNextPatientByDoctor: async (req, res) => {
    try {
      const data = await AppointmentService.getNextPatientByDoctorUserId(
        req.params.doctorId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching next patient",
        error: error.message,
      });
    }
  },

  handleGetUrgentQueueByDoctor: async (req, res) => {
    try {
      const data = await AppointmentService.getUrgentQueueByDoctorUserId(
        req.params.doctorId
      );

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching urgent queue",
        error: error.message,
      });
    }
  },

  handleFindDoctorCancellationTarget: async (req, res) => {
    try {
      const data = await AppointmentService.findDoctorCancellationTarget(
        req.params.doctorId,
        {
          patientName: req.query.patientName || "",
          date: req.query.date || "",
          time: req.query.time || "",
        }
      );

      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error identifying appointment",
      });
    }
  },

  handleGetAppointment: async (req, res) => {
    try {
      const appointment = await AppointmentService.getAppointmentById(
        req.params.id
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching appointment",
        error: error.message,
      });
    }
  },

  handleGetAllAppointments: async (req, res) => {
    try {
      const appointments = await AppointmentService.getAllAppointments();

      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching appointments",
        error: error.message,
      });
    }
  },

  handleUpdateAppointment: async (req, res) => {
    try {
      const appointment = await AppointmentService.updateAppointment(
        req.params.id,
        req.body
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        data: appointment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating appointment",
        error: error.message,
      });
    }
  },

  handleCancelAppointment: async (req, res) => {
    try {
      const appointment = await AppointmentService.cancelAppointment(
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully",
        data: appointment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error cancelling appointment",
      });
    }
  },

  handleMarkCompletedByDoctor: async (req, res) => {
    try {
      const data = await AppointmentService.markCompletedByDoctor(
        req.params.id,
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: "Appointment marked completed",
        data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error completing appointment",
      });
    }
  },

  handleCancelByDoctor: async (req, res) => {
    try {
      const data = await AppointmentService.cancelAppointmentByDoctor(
        req.params.id,
        req.user.id,
        req.body.reason
      );

      res.status(200).json({
        success: true,
        message: "Appointment cancelled by doctor",
        data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || "Error cancelling appointment",
      });
    }
  },

  handleDeleteAppointment: async (req, res) => {
    try {
      const appointment = await AppointmentService.deleteAppointment(
        req.params.id
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting appointment",
        error: error.message,
      });
    }
  },
};

export default AppointmentController;