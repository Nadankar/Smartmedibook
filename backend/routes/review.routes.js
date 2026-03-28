import express from 'express';
import ReviewController from '../controllers/review.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

 
const router = express.Router();
 
router.post('/',authMiddleware("patient"),ReviewController.handleCreateReview);
router.get('/', ReviewController.handleGetAllReviews);
router.get('/:id', ReviewController.handleGetReviewById);


export default router;
      
   