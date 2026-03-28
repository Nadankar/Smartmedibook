import React from 'react'

function Location() {
    return (
        <div className=" flex justify-center items-center bg-gray-100 p-4 sm:p-6">
            <div className="bg-cyan-100 rounded-xl shadow-lg p-6 w-full max-w-5xl ">

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-6">
                    Our Location
                </h2>

                <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] rounded-lg overflow-hidden min-h-screen">

                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.9308124593576!2d72.82354437387467!3d19.06677935226464!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c90ee61a46d9%3A0x632e25778a624051!2sRizvi%20College%20of%20Engineering!5e0!3m2!1sen!2sin!4v1768063718623!5m2!1sen!2sin" 
                    width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade">
                        
                    </iframe>

                </div>



                <p className="text-center text-gray-600 mt-4 text-sm sm:text-base">
                    Visit our hospital for quality and trusted healthcare services.
                </p>
            </div>
        </div>
    );
}

export default Location;

