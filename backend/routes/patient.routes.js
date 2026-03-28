import express from 'express';
import patientController from '../controllers/patient.controller.js'

const router=express.Router();

router.get('/',patientController.handleGetAllPatient);
router.get('/:id',patientController.handleGetPatient);
router.put('/:id',patientController.handleUpdatePatient);
router.get('/:id',patientController.handleDeletePatient);

export default router;    


