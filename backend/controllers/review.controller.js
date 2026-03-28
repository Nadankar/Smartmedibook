import ReviewService from '../services/review.service.js';
  import Patient from "../models/patient.model.js"; // import

const ReviewController = {
handleCreateReview: async (req, res) => {
  try {
    const userId = req.user.id;

    const patient = await Patient.findOne({ user_id: userId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    const data = {
      ...req.body,
      patient_id: patient._id  
    };

    const review = await ReviewService.createReview(data);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
},
  handleGetReviewById: async (req, res) => {
    try {
      const review = await ReviewService.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }
      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching review',
        error: error.message
      });
    }
  },

  handleGetAllReviews: async (req, res) => {
    try {
      const filter = { review_for: 'chatbot' };
      const reviews = await ReviewService.getAllReviews(filter);
      res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
      });
    } catch (error) { 
      res.status(500).json({
        success: false,
        message: 'Error fetching reviews',
        error: error.message
      });
    }
  }

 
};

export default ReviewController;





