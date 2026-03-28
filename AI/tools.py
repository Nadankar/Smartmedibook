import json
import logging
import re
from datetime import datetime, timedelta
from db_driver import DatabaseDriver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = DatabaseDriver()

SPECIALIZATION_SYMPTOM_MAP = {
    "cardiology": [
        "chest pain", "heart pain", "palpitation", "palpitations",
        "shortness of breath", "bradycardia", "tachycardia",
        "heart surgery", "heart follow up", "bp", "blood pressure"
    ],
    "neurology": [
        "tremor", "tremors", "seizure", "seizures", "fits", "migraine",
        "numbness", "tingling", "stroke", "stroke-like", "weakness", "memory loss"
    ],
    "dermatology": [
        "skin rash", "rash", "itching", "acne", "pimples", "eczema", "fungal"
    ],
    "ophthalmology": [
        "eye pain", "blurred vision", "vision problem", "eye redness", "watering eyes"
    ],
    "orthopedics": [
        "joint pain", "fracture", "back pain", "knee pain", "bone pain", "shoulder pain"
    ],
    "pulmonology": [
        "cough", "wheezing", "breathing problem", "breathing difficulty", "asthma", "lung"
    ],
    "gastroenterology": [
        "abdominal pain", "stomach pain", "vomiting", "acidity", "gas", "constipation", "diarrhea"
    ],
    "ent": [
        "ear pain", "sore throat", "throat pain", "sinus", "nose block", "tonsil"
    ],
    "general medicine": [
        "fever", "cold", "flu", "general weakness", "weakness", "body pain", "general consultation"
    ],
}

EMERGENCY_KEYWORDS = {
    "chest pain": 100,
    "severe breathing difficulty": 100,
    "breathing difficulty": 95,
    "shortness of breath": 95,
    "seizure": 100,
    "seizures": 100,
    "stroke": 100,
    "stroke-like": 100,
    "severe bleeding": 100,
    "bleeding heavily": 100,
    "unconscious": 100,
    "fainting": 85,
}

URGENT_KEYWORDS = {
    "palpitations": 75,
    "abdominal pain": 70,
    "vomiting": 60,
    "asthma": 75,
    "eye pain": 60,
    "dizziness": 60,
    "infection": 60,
    "fever": 55,
}

ROUTINE_KEYWORDS = {
    "regular checkup": 15,
    "annual checkup": 10,
    "follow up": 25,
    "eye checkup": 20,
    "skin rash": 35,
    "cold": 30,
}


def _normalize_text(text: str) -> str:
    return (text or "").strip().lower()


def _score_reason(reason: str) -> dict:
    text = _normalize_text(reason)

    if not text:
        return {
            "priority_score": 20,
            "urgency_label": "routine",
            "matched_terms": [],
            "advice": "No urgency keywords found."
        }

    matched = []
    score = 20

    for key, value in EMERGENCY_KEYWORDS.items():
        if key in text:
            matched.append(key)
            score = max(score, value)

    for key, value in URGENT_KEYWORDS.items():
        if key in text:
            matched.append(key)
            score = max(score, value)

    for key, value in ROUTINE_KEYWORDS.items():
        if key in text:
            matched.append(key)
            score = max(score, value)

    if any(word in text for word in ["urgent", "emergency", "serious", "critical", "severe"]):
        score = max(score, 75)

    if score >= 90:
        urgency = "emergency"
        advice = "This appears highly urgent."
    elif score >= 60:
        urgency = "urgent"
        advice = "This appears urgent and should be prioritized."
    else:
        urgency = "routine"
        advice = "This appears non-emergency based on the provided text."

    return {
        "priority_score": int(score),
        "urgency_label": urgency,
        "matched_terms": matched,
        "advice": advice
    }


def _infer_specialization(reason: str) -> dict:
    text = _normalize_text(reason)
    best_match = "general medicine"
    best_score = 0
    matched_keywords = []

    for specialization, keywords in SPECIALIZATION_SYMPTOM_MAP.items():
        score = 0
        local_matches = []

        for keyword in keywords:
            if keyword in text:
                score += 1
                local_matches.append(keyword)

        if score > best_score:
            best_score = score
            best_match = specialization
            matched_keywords = local_matches

    return {
        "specialization": best_match,
        "matched_keywords": matched_keywords
    }


def _resolve_relative_date(input_text: str, current_date: str) -> dict:
    text = _normalize_text(input_text)
    today = datetime.strptime(current_date, "%Y-%m-%d")

    weekdays = {
        "monday": 0,
        "tuesday": 1,
        "wednesday": 2,
        "thursday": 3,
        "friday": 4,
        "saturday": 5,
        "sunday": 6,
    }

    month_formats = [
        "%d %B %Y",
        "%d %b %Y",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y-%m-%d",
    ]

    cleaned = re.sub(r"(\d)(st|nd|rd|th)", r"\1", text)

    try:
        if cleaned == "today":
            return {"success": True, "resolved_date": today.strftime("%Y-%m-%d")}

        if cleaned == "tomorrow":
            return {"success": True, "resolved_date": (today + timedelta(days=1)).strftime("%Y-%m-%d")}

        if cleaned == "day after tomorrow":
            return {"success": True, "resolved_date": (today + timedelta(days=2)).strftime("%Y-%m-%d")}

        if cleaned in weekdays:
            target = weekdays[cleaned]
            days_ahead = target - today.weekday()
            if days_ahead < 0:
                days_ahead += 7
            resolved = today + timedelta(days=days_ahead)
            return {"success": True, "resolved_date": resolved.strftime("%Y-%m-%d")}

        if cleaned.startswith("next "):
            day_name = cleaned.replace("next ", "").strip()
            if day_name in weekdays:
                target = weekdays[day_name]
                days_ahead = target - today.weekday()
                if days_ahead <= 0:
                    days_ahead += 7
                resolved = today + timedelta(days=days_ahead)
                return {"success": True, "resolved_date": resolved.strftime("%Y-%m-%d")}

        for fmt in month_formats:
            try:
                parsed = datetime.strptime(cleaned, fmt)
                return {"success": True, "resolved_date": parsed.strftime("%Y-%m-%d")}
            except ValueError:
                pass

        return {
            "success": False,
            "message": f"Could not resolve date phrase: {input_text}"
        }
    except Exception:
        return {
            "success": False,
            "message": f"Could not resolve date phrase: {input_text}"
        }


def _normalize_time_input(raw_time: str) -> dict:
    value = _normalize_text(raw_time)

    patterns = ["%I %p", "%I:%M %p", "%H:%M", "%H.%M"]
    normalized = value.replace(".", ":")

    for fmt in patterns:
        try:
            parsed = datetime.strptime(normalized, fmt)
            return {
                "success": True,
                "normalized_time": parsed.strftime("%H:%M")
            }
        except ValueError:
            pass

    return {
        "success": False,
        "message": f"Could not understand time: {raw_time}"
    }


async def analyze_booking_priority(reason: str):
    return json.dumps({"success": True, "data": _score_reason(reason)})


async def recommend_specialization(reason: str):
    return json.dumps({"success": True, "data": _infer_specialization(reason)})


async def resolve_relative_date(input_text: str, current_date: str):
    return json.dumps(_resolve_relative_date(input_text, current_date))


async def normalize_time_input(input_time: str):
    return json.dumps(_normalize_time_input(input_time))


async def check_appointments(patient_user_id: str, token: str | None = None):
    data = await db.get_patient_appointments(patient_user_id, token=token)
    return json.dumps(
        data or {"success": False, "message": "Unable to fetch appointments right now."}
    )


async def list_available_doctors(specialization: str = "", search: str = ""):
    data = await db.list_doctors(specialization=specialization, search=search)
    return json.dumps(
        data or {"success": False, "message": "Could not load doctors."}
    )


async def book_new_appointment(
    patient_id: str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str,
    reason: str,
    priority_score: int = 20,
    urgency_label: str = "routine",
    token: str | None = None,
):
    result = await db.book_appointment(
        patient_id=patient_id,
        doctor_name=doctor_name,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        reason=reason,
        priority_score=priority_score,
        urgency_label=urgency_label,
        token=token,
    )
    return json.dumps(
        result or {"success": False, "message": "Unable to book appointment."}
    )


async def find_patient_cancellation_target(
    patient_user_id: str,
    doctor_name: str = "",
    appointment_date: str = "",
    appointment_time: str = "",
    token: str | None = None,
):
    data = await db.find_patient_cancellation_target(
        patient_id=patient_user_id,
        doctor_name=doctor_name,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        token=token,
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to identify appointment."}
    )


async def cancel_existing_appointment(
    appointment_id: str,
    token: str | None = None,
):
    result = await db.cancel_patient_appointment(appointment_id, token=token)
    return json.dumps(
        result or {"success": False, "message": "Unable to cancel appointment."}
    )


async def view_doctor_appointments(doctor_user_id: str, token: str | None = None):
    data = await db.get_doctor_appointments(
        doctor_user_id=doctor_user_id,
        token=token
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to fetch doctor appointments."}
    )


async def get_next_patient(doctor_user_id: str, token: str | None = None):
    data = await db.get_next_patient(
        doctor_user_id=doctor_user_id,
        token=token
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to fetch next patient."}
    )


async def get_urgent_queue(doctor_user_id: str, token: str | None = None):
    data = await db.get_urgent_queue(
        doctor_user_id=doctor_user_id,
        token=token
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to fetch urgent queue."}
    )


async def mark_doctor_appointment_completed(
    appointment_id: str,
    token: str | None = None
):
    data = await db.mark_doctor_appointment_completed(
        appointment_id=appointment_id,
        token=token
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to mark appointment completed."}
    )


async def find_doctor_cancellation_target(
    doctor_user_id: str,
    patient_name: str = "",
    appointment_date: str = "",
    appointment_time: str = "",
    token: str | None = None,
):
    data = await db.find_doctor_cancellation_target(
        doctor_user_id=doctor_user_id,
        patient_name=patient_name,
        appointment_date=appointment_date,
        appointment_time=appointment_time,
        token=token,
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to identify appointment."}
    )


async def cancel_doctor_appointment(
    appointment_id: str,
    reason: str,
    token: str | None = None
):
    data = await db.cancel_doctor_appointment(
        appointment_id=appointment_id,
        reason=reason,
        token=token
    )
    return json.dumps(
        data or {"success": False, "message": "Unable to cancel doctor appointment."}
    )


AVAILABLE_FUNCTIONS = {
    "analyze_booking_priority": analyze_booking_priority,
    "recommend_specialization": recommend_specialization,
    "resolve_relative_date": resolve_relative_date,
    "normalize_time_input": normalize_time_input,
    "check_appointments": check_appointments,
    "list_available_doctors": list_available_doctors,
    "book_new_appointment": book_new_appointment,
    "find_patient_cancellation_target": find_patient_cancellation_target,
    "cancel_existing_appointment": cancel_existing_appointment,
    "view_doctor_appointments": view_doctor_appointments,
    "get_next_patient": get_next_patient,
    "get_urgent_queue": get_urgent_queue,
    "mark_doctor_appointment_completed": mark_doctor_appointment_completed,
    "find_doctor_cancellation_target": find_doctor_cancellation_target,
    "cancel_doctor_appointment": cancel_doctor_appointment,
}