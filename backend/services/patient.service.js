import Patient from '../models/patient.model.js'

class patientServices {
  //create new patient
  static async createPatient(patientData) {
    try {
      const patient = new Patient(patientData);
      return await patient.save();
    } catch (error) {
      throw error;
    }
  }

  //Get patient   
  static async getAllPatient() {
    try {
      return await Patient.find();
    } catch (error) {
      throw error;
    }
  }

  // Get patient by id

  static async getPatient(id) {
    try {
      const patient = await Patient.findOne({ user_id: id });
      return patient;
      
    } catch (error) {
      throw error;
    }
  }

  //Update patient

  static async updatePatient(id, updateData) {
    try {
      return await Patient.findByIdAndUpdate(id, updateData, { new: true })
    } catch (error) {
      throw error;
    }
  }

  //delete patient

  static async deletePatient(id) {
    const patient = await Patient.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!patient) {
      throw new Error("Doctor not found");
    }
    return patient;
  }
}

export default patientServices;
