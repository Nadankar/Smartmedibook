import React from "react";
import BasicInfo from "../components/DoctorDashboard/BasicInfoCard";
import ScheduleCard from "../components/DoctorDashboard/ScheduleCard";

 
import DashboardHeader from "../components/DashboardHeader"; 
import Table from "../components/DoctorDashboard/AppointmentTable";
 
function DoctorDashboard() {
  

  return (
 <div className="min-h-screen bg-base-200 p-4 sm:p-6 md:p-8">
      {/* Header */}
     <DashboardHeader/>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Profile Card */} 
       <BasicInfo/>
 
        {/* Schedule & Availability */} 
       <ScheduleCard/>

       {/* table */}
       <div className="sm:col-span-2 lg:col-span-3">
  <Table/>
</div>

      </div>
    </div>
  );
}

export default DoctorDashboard;



