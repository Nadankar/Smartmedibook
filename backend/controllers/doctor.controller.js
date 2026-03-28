import doctorService from '../services/doctor.service.js'

const doctorController = {
    //Create new doctor
    handleCreateDoctor: async (req, res) => {
        try {
            const doctor = await doctorService.createDoctor(req.body);
            res.status(201).json({
                success: true,
                message: 'User and Doctor created successfully.',
                data: doctor
            })
        } catch (error) {
            res.status(500).json({
                success: false, 
                message: 'Error creating doctor',
                error: error.message
            })
        }
    },

    //Get all doctors 
    handleGetAllDoctor: async (req, res) => {
        try {
            const doctors = await doctorService.getAllDoctors();
            res.status(200).json({
                success: true,
                message: doctors.length,
                data: doctors
            })

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching doctors.',
                error: error.message
            })
        }
    }
    ,
    //Get doctor by id
    handleGetDoctor: async (req, res) => {
        try {
            const doctor = await doctorService.getDoctor(req.params.id);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor not found.'
                });
            }
            res.status(200).json({
                success: true,
                data: doctor
            })

        } catch (error) { 
            res.status(500).json({
                success: false,
                message: 'Error fetching doctor',
                error: error.message
            })
        }
    },
    //Update doctor
    handleUpdateDoctor: async (req, res) => {
        try {
            const doctor = await doctorService.updateDoctor(req.params.id, req.body);

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor not found',
                    data: doctor
                })
            }
            res.status(200).json({
                success: true,
                message: 'Doctor updated successfully.',
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error upadating doctor.',
                error: error.message
            })
        }
    },
    // Delete doctor (soft delete)
    handleDeleteDoctor: async (req, res) => {
        try {
            const doctor = await doctorService.deleteDoctor(req.params.id);

            res.status(200).json({
                success: true,
                message: 'Doctor deactivated successfully',
                data: doctor
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    },

    // Restore doctor
    handleRestoreDoctor: async (req, res) => {
        try {
            const doctor = await doctorService.restoreDoctor(req.params.id);

            res.status(200).json({
                success: true,
                message: 'Doctor restored successfully',
                data: doctor
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

}


export default doctorController;
