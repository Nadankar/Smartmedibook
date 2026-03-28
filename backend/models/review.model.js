import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({

    patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true 
    },
    rating: { 
        type: Number,
        required: true 
    }, 
    comment: {
        type: String,
        required: true
    }, 
    created_at: {
        type: Date,
        default: Date.now
    },
    review_for: {
        type: String,
        default: 'chatbot'
    },
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;




