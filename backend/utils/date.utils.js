
const normalizeDate = (inputDate) => {
  const [year, month, day] = String(inputDate).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

const guessEndTime = (start) => {
  if (!start || !start.includes(":")) return "";
  const [h, m] = start.split(":").map(Number);
  const end = new Date();
  end.setHours(h, m + 30, 0, 0);
  const hh = String(end.getHours()).padStart(2, "0");
  const mm = String(end.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const getDateOnlyUTC = (dateValue) => {
  const d = new Date(dateValue);
  return d.toISOString().slice(0, 10);
};

const getIndiaNow = () => {
  const now = new Date();
  const indiaString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(indiaString);
};

const isTodayOrTomorrow = (inputDate) => {
  const target = getDateOnlyUTC(normalizeDate(inputDate));

  const indiaNow = getIndiaNow();
  const year = indiaNow.getFullYear();
  const month = String(indiaNow.getMonth() + 1).padStart(2, "0");
  const day = String(indiaNow.getDate()).padStart(2, "0");

  const today = `${year}-${month}-${day}`;

  const tomorrowDate = new Date(indiaNow);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(
    tomorrowDate.getMonth() + 1
  ).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;

  return target === today || target === tomorrow;
};

const buildAppointmentDateTime = (appointment) => {
  const datePart = getDateOnlyUTC(appointment?.date);
  const timePart = appointment?.time || "00:00";
  return new Date(`${datePart}T${timePart}:00`);
};

export {normalizeDate,guessEndTime,getDateOnlyUTC,getIndiaNow,isTodayOrTomorrow,buildAppointmentDateTime};