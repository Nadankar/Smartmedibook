import axios from "axios";
import React from "react";
import { useState } from "react";

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    rating: '',
    comment: ''
  }); 
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { 
      const token = localStorage.getItem("token");
 
        if (!token) {
            setError('Please login to submit feedback');
            return;
        } 

     // Verify token structure
    if (token) {
      const parts = token.split('.');
      console.log("Token parts:", parts.length);
    }

      const response = await axios.post('http://localhost:3000/api/reviews/', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Patient added feedback successfully.');
      setError('');
      setFormData({
        rating: '',
        comment: ''
      })

    } catch (error) {
      setError(error.response?.data?.message || error.message);
      setSuccess('')
    }

  };  

  return (
   

      <div className="bg-white shadow-2xl rounded-2xl p-8 col-span-2">

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Your Feedback Matters
        </h2>

        <p className="text-gray-500 text-center mb-6">
          Help us improve our healthcare services.
        </p>

        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Rating */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Rating
            </label>

            <div className="rating rating-lg mt-2 flex gap-1">

              <input type="radio" name="rating" className="mask mask-star-2 bg-yellow-400" value="1" onChange={handleChange} />
              <input type="radio" name="rating" className="mask mask-star-2 bg-yellow-400" value="2" onChange={handleChange} />
              <input type="radio" name="rating" className="mask mask-star-2 bg-yellow-400" value="3" onChange={handleChange} />
              <input type="radio" name="rating" className="mask mask-star-2 bg-yellow-400" value="4" onChange={handleChange} />
              <input type="radio" name="rating" className="mask mask-star-2 bg-yellow-400" value="5" onChange={handleChange} />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Message
            </label>
 
            <textarea
              rows="4"
               name="comment"
              placeholder="Write your feedback..."
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
              onChange={handleChange}
              value={formData.comment}
             
            >

            </textarea>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-200"

          >
            Submit Feedback
          </button> 

        </form>
      </div>

  );
};

export default FeedbackForm;


