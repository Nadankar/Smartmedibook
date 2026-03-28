import express from 'express'

import authController from '../controllers/auth.controller.js'
import validateSignup from '../middlewares/validateSignup.js';
import validateLogin from '../middlewares/validateLogin.js';




const router = express.Router(); 

//signup
router.post('/signup', validateSignup, authController.createSignup);
 
//login 
router.post('/login', validateLogin, authController.loginUser);
 


  
export default router; 



