import express from 'express'
import doctorController from '../controllers/doctor.controller.js'

const router = express.Router();

//create new doctor
router.post('/', doctorController.handleCreateDoctor);
//get all doctor
router.get('/', doctorController.handleGetAllDoctor);
//get doctor by id
router.get('/:id', doctorController.handleGetDoctor);
//update doctor 
router.put('/:id', doctorController.handleUpdateDoctor); 
//delete doctor
router.delete('/:id', doctorController.handleDeleteDoctor);
//restore doctor
router.put('/restore/:id',doctorController.handleRestoreDoctor) 

export default router;     





