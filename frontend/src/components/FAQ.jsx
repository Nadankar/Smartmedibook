import React from 'react'
import faqs from "../assets/jsonData/faq.json"

function FAQ() {
  return (
    <div className="flex flex-col md:flex-row justify-center py-8 sm:py-10 gap-8 sm:gap-10 font-serif px-4 sm:px-6">
      
      <div className='md:w-1/3'>
        <p className='text-lg sm:text-2xl mb-4 sm:mb-6'>FAQ</p>
        <h2 className='text-2xl sm:text-3xl md:text-5xl mb-3 sm:mb-4'>Got Quetions ?</h2>
        <p className='text-sm sm:text-base font-light'>
          We have got answers.Here are some common queries.
        </p>
      </div>

      <div className="w-full md:w-[60%]">
        {
          faqs.map((data) => (
            <div key={data.id} className="collapse collapse-arrow border border-gray-300 rounded-xl mb-3 shadow-md">
              <input type="checkbox" />

              <div className="collapse-title font-medium text-base sm:text-lg text-[#132440] bg-base-300">
                {data.question}
              </div>

              <div className="collapse-content text-gray-600 bg-base-300 text-sm sm:text-base">
                {data.answer}
              </div>
            </div>
          ))
        }
      </div>

    </div>
  );
}

export default FAQ;