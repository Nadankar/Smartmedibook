
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Feedback() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);  

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
 

        const res = await axios.get('http://localhost:3000/api/reviews', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setReviews(res.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
 
  // Helper function to render stars
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(
          <span key={i} className="text-yellow-500 text-xl sm:text-2xl md:text-3xl">
            ★
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300 text-xl sm:text-2xl md:text-3xl">
            ★
          </span>
        );
      }
    }
    return stars;
  };

  return (
    <div className=" py-14 min-h-screen flex flex-col gap-9 justify-center items-center bg-black">
      <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-medium font-serif">
        What Our Patients Say
      </h2>

      <div className="carousel carousel-vertical rounded-box h-80 sm:h-96 w-[95%] sm:w-[80%] md:w-2/3 bg-base-300 shadow-lg overflow-auto">
        {reviews.map((data) => (
          <div
            key={data._id}
            className="carousel-item h-full flex flex-col justify-center items-center gap-6 px-4 sm:px-6 md:px-10 text-center"
          >
            <div className="flex items-center gap-5">
              <img
                src={data.patient_id?.img || '/default-user.png'}
                alt={data.patient_id?.name || 'Patient'}
                className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full object-cover border-4 border-b-blue-700 border-amber-500"
              />
              <div>
                <p className="font-semibold text-black">
                  {data.patient_id?.name || 'Anonymous'}
                </p>
              </div>
            </div>

            <div>
              <p className=" text-base sm:text-lg md:text-xl font-bold text-black mt-2">{data.comment}</p>
              <div className="mt-2">{renderStars(data.rating)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Feedback;



