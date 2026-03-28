import React from "react";
import AppointmentCard from "../components/PatientDashboard/AppointmentCard";
import MedicalHistoryCard from "../components/PatientDashboard/MedicalHistoryCard";
import FeedbackForm from "../components/PatientDashboard/FeedbackForm";
import BasicInfo from "../components/PatientDashboard/BasicInfo";
import DashboardHeader from "../components/DashboardHeader";


function PatientDashboard() {
  return (
    <div className="min-h-screen bg-base-200 p-4 sm:p-6 md:p-8 ">

      {/* Header */}
      <DashboardHeader />

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Personal Profile */}

        {/* <Patient/> */}
        <BasicInfo />

        {/* Medical History */}
        <MedicalHistoryCard />

        {/* Appointments */}
        <AppointmentCard />

      </div>

      {/* feedback Form */}
      <div className="mt-6">
        <FeedbackForm />
      </div>

    </div>
  );
}

export default PatientDashboard;






