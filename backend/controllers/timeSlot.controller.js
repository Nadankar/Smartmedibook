import TimeSlotService from "../services/timeSlot.service.js";

const TimeSlotController = {
  handleCreateTimeSlot: async (req, res) => {
    try {
      const timeSlot = await TimeSlotService.createTimeSlot(req.body);
      res.status(201).json({
        success: true,
        message: "TimeSlot created successfully",
        data: timeSlot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating TimeSlot",
        error: error.message,
      });
    }
  },

  handleGetTimeSlot: async (req, res) => {
    try {
      const { id } = req.params;
      const timeSlots = await TimeSlotService.getTimeSlot(id);

      res.status(200).json({
        success: true,
        data: Array.isArray(timeSlots) ? timeSlots : [],
        count: Array.isArray(timeSlots) ? timeSlots.length : 0,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching TimeSlot",
        error: error.message,
      });
    }
  },

  handleGetAllTimeSlots: async (req, res) => {
    try {
      const timeSlots = await TimeSlotService.getAllTimeSlots();
      res.status(200).json({
        success: true,
        count: timeSlots.length,
        data: timeSlots,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching TimeSlots",
        error: error.message,
      });
    }
  },

  handleUpdateTimeSlot: async (req, res) => {
    try {
      const timeSlot = await TimeSlotService.updateTimeSlot(req.params.id, req.body);

      if (!timeSlot) {
        return res.status(404).json({
          success: false,
          message: "TimeSlot not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "TimeSlot updated successfully",
        data: timeSlot,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating TimeSlot",
        error: error.message,
      });
    }
  },

  handleDeleteTimeSlot: async (req, res) => {
    try {
      const timeSlot = await TimeSlotService.deleteTimeSlot(req.params.id);

      if (!timeSlot) {
        return res.status(404).json({
          success: false,
          message: "TimeSlot not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "TimeSlot deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting TimeSlot",
        error: error.message,
      });
    }
  },
};

export default TimeSlotController;