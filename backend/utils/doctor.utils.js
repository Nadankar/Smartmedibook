import Doctor from "../models/doctor.model.js";

const isOverrideEligibleExistingUrgency = (urgency) => {
  return ["routine", "followup"].includes((urgency || "").toLowerCase());
};

const normalizeDoctorText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\bdr\.?\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getDoctorTokens = (value = "") =>
  normalizeDoctorText(value).split(" ").filter(Boolean);

const resolveDoctorForBooking = async ({ session, doctorId, doctorName }) => {
  if (doctorId) {
    return Doctor.findOne({ _id: doctorId, isActive: true }).session(session);
  }

  const rawName = String(doctorName || "").trim();
  if (!rawName) return null;

  const normalizedInput = normalizeDoctorText(rawName);
  const inputTokens = getDoctorTokens(rawName);

  const activeDoctors = await Doctor.find({ isActive: true }).session(session);
  if (!activeDoctors.length) return null;

  const scoredDoctors = activeDoctors
    .map((doctor) => {
      const normalizedDoctorName = normalizeDoctorText(doctor.name);
      const doctorTokens = getDoctorTokens(doctor.name);

      let score = 0;

      if (normalizedDoctorName === normalizedInput) score += 100;
      if (normalizedDoctorName.startsWith(normalizedInput)) score += 60;
      if (normalizedDoctorName.includes(normalizedInput)) score += 40;

      for (const token of inputTokens) {
        if (doctorTokens.includes(token)) score += 25;
        else if (normalizedDoctorName.includes(token)) score += 10;
      }

      return { doctor, score, normalizedDoctorName };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.normalizedDoctorName.localeCompare(b.normalizedDoctorName)
    );

  return scoredDoctors[0]?.doctor || null;
};

export {isOverrideEligibleExistingUrgency,normalizeDoctorText,getDoctorTokens,resolveDoctorForBooking} ;