
import express from "express";
import AiController from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/auth-context", AiController.getAuthContext);
router.post("/create-patient", AiController.createPatientFromAi);
router.get("/doctors", AiController.listDoctorsForAi);

export default router;