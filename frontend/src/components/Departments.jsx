import React from "react";
import departments from "../assets/jsonData/departments.json";

function Departments() {
  return (
    <div className="py-10 sm:py-12 px-4 sm:px-6 md:px-10 bg-gradient-to-r from-[#EAF6F8] to-[#F8FBFD] overflow-hidden">
      
      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl my-6 sm:my-10 text-blue-950 font-bold">
        Our Medical Departments
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {departments.map((data) => (
          <div
            key={data.id}
            className="
              bg-white
              rounded-2xl
              overflow-hidden
              shadow-lg
              hover:shadow-2xl
              transition
              duration-300
              ease-in-out
              hover:scale-105
              cursor-pointer
            "
          >
            
            {/* Image */}
            <div className="relative h-40 sm:h-48 md:h-56">
              <img
                src={data.img}
                alt={data.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                {data.title}
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                {data.note}
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export default Departments;