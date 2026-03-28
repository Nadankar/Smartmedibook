import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import patientService from "./patient.service.js";

class AuthService {
  //creating signup { patient profile}
  static async createSignup(signupData) {
    const {
      name,
      email,  
      password,
      dob,
      gender,
      phone, 
      bloodGroup,
      medicalHistory

    } = signupData;

    if (signupData.phone.length != 10) {
      throw new Error('Phone should be 10 digits'); 
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "patient",
    });
    
    await user.save();


    await patientService.createPatient({
      user_id: user._id,
      name:user.name,
      dob,
      gender,
      phone,
      email:user.email,
      bloodGroup,
      medicalHistory
    });

    return user;
  }

  //Login
  static async loginUser(loginData) {
    const { email, password } = loginData;

    const existingUser = await User.findOne({ email }).select('+password');
    if (!existingUser) {
      throw new Error("User does not exist. Please signup");
    }

    const isPasswardMatch = await bcrypt.compare(password, existingUser.password);

    if (!isPasswardMatch) {
      throw new Error('Invalid email or password.');
    }
    return existingUser;
  }
}

export default AuthService;


























