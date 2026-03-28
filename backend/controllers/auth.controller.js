import authService from "../services/auth.service.js";
import jwt from "jsonwebtoken";

const AuthController = {

  createSignup: async (req, res) => {
    try {
      const user = await authService.createSignup(req.body);

      res.status(201).json({
        success: true,
        message: "Signup and Patient created successfully.",
        data: {
          id: user._id,
          email: user.email, 
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message, 
      });
    }
  },

  loginUser: async (req, res) => {
    try {
      const user = await authService.loginUser(req.body);

      // Generate JWT
      const token = jwt.sign({ 
        id: user._id, 
        role: user.role 
      }, 
        process.env.JWT_SECRET,           
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } 
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          token, 
        },
        
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
};
 
export default AuthController;