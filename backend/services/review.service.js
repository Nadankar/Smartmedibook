import Review from '../models/review.model.js';

class ReviewService {
  static async createReview(data) {
    try { 
      const review = new Review(data);
      return await review.save();
    } catch (error) {
      throw error;
    }
  }

  static async getReview(id) {
    try {
      return await Review.findById(id);   
    } catch (error) { 
      throw error;
    }
  } 

  static async getAllReviews(req, res) {
    try {
 
      const reviews=await Review.find().populate("patient_id", "name img").sort({ created_at: -1 });;

      console.log(reviews);
      return reviews;
    } catch (error) {
      throw error;
    }
  }



}

export default ReviewService;







