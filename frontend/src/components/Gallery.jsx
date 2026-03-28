import React from "react";
import gallery from "../assets/jsonData/gallery.json";

function Gallery() {
  return (
    <section className="bg-[#132440] py-16 px-4 sm:px-6">

      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white">
          Our Care in Action
        </h2>
        <p className="text-gray-100 mt-3 text-sm sm:text-base">
          A glimpse of our hospital services, facilities, and patient care
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[180px] sm:auto-rows-[200px] md:auto-rows-[220px] gap-4 sm:gap-5 max-w-6xl mx-auto">

        {gallery.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition duration-300 ${item.span}`}
          >
            <img
              src={item.img}
              alt={item.title}
              className="w-full h-full object-cover  hover:scale-105 sm:hover:scale-105 transition duration-300  "
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/35 opacity-0 hover:opacity-100 transition flex items-end hover:cursor-pointer">
              <p className="text-white text-sm sm:text-base md:text-lg font-semibold p-4">
                {item.title}
              </p>
            </div>
          </div>
        ))}

      </div>
    </section>
  );
}

export default Gallery;
