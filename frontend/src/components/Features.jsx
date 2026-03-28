
import React from 'react'
import features from "../assets/jsonData/feature.json"

function Features({ sectionRef }) {
  return (
    <>
      <div className='min-h-screen w-auto px-4 sm:px-10 md:px-20 py-10 sm:py-16 md:py-20' ref={sectionRef}>
        
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#132440]">
            Why Choose SmartMediBook?
          </h1>
          <p className="mt-2 text-[#16476A] text-sm sm:text-base">
            Smart, secure and seamless healthcare experience
          </p>
        </div>

        <div className='flex items-center justify-center w-full px-2'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 py-10 w-full max-w-6xl rounded-2xl px-2 sm:px-6 md:px-10'>
            
            {
              features.map((description) => (
                <div 
                  key={description.id} 
                  className="card bg-blue-950/80 image-full shadow-lg hover:scale-105 duration-200"
                >
                  <figure>
                    <img
                      src={description.img}
                      alt="feature"
                      className='p-6 sm:p-8 md:p-10 w-full h-full object-contain'
                    />
                  </figure>

                  <div className="card-body text-center flex justify-center">
                    <h2 className="card-title text-lg sm:text-xl md:text-2xl font-bold">
                      {description.feature}
                    </h2>
                  </div>
                </div>
              ))
            }

          </div>
        </div>

      </div>
    </>
  )
}

export default Features