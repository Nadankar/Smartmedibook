import patientServices from '../services/patient.service.js'

const patientController = {
    
    handleGetAllPatient: async (req, res) => {
        try {
            const patients = await patientServices.getAllPatient();

            res.status(200).json({
                success: true,
                count: patients.length,
                message: patients
            }) 
        } catch (error) {
            res.status(500).json({ 
                success: false,
                message: 'Error fetching patients',
                error: error.message
            })
        } 
    },

    //get patient by id 
    handleGetPatient: async (req, res) => {
        try {
            const patient = await patientServices.getPatient(req.params.id);

            if (!patient) {
                res.status(404).json({
                    message: 'Patient not found',
                    success: 'false'
                })
            }
            res.status(200).json({
                success: true,
                data: patient
            })
 
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching patient',
                error: error.message
            })
        }
    },
    //update patient

    handleUpdatePatient:async(req,res)=>{
         try {
            const patient=await patientServices.updatePatient(req.params.id,req.body);

            if(!patient){
                res.status(404).json({
                    success:false,
                    message:'Patient does not found'
                })
            }

            res.status(200).json({
                success:true,
                message:'Patient updated successfully.',
                data:patient
            })
         } catch (error) {
            res.status(505).json({
                success:false,
                message:'Error updating patient.',
                error:error.message
            })
         }
    },

    //delete patient
    handleDeletePatient:async(req,res)=>{
        try {
            const patient=patientServices.deletePatient(req.params.id);

            if(!patient){
                res.status(404).json({
                    success:false,
                    message:'Patient does not found.',
                    data:patient
                }) 
            }
            res.status(200).json({
                success:true,
                message:'Patient removed successfully.', 
            })
        } catch (error) {
            res.status(505).json({
                success:'false',
                message:'Error removing patient.',
                error:error.message
            })
        }
    }

}
export default patientController;