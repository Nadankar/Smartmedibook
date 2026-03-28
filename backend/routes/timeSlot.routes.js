
import express from "express";
import TimeSlotController from "../controllers/timeSlot.controller.js";

const router = express.Router();

router.post("/", TimeSlotController.handleCreateTimeSlot);
router.get("/doctor/:id", TimeSlotController.handleGetTimeSlot);
router.get("/", TimeSlotController.handleGetAllTimeSlots);
router.put("/:id", TimeSlotController.handleUpdateTimeSlot);
router.delete("/:id", TimeSlotController.handleDeleteTimeSlot);

export default router;