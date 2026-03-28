import os
import re
import json
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv
from openai import AsyncOpenAI

from prompts import INSTRUCTIONS
from session_state import get_session, create_session, merge_session
from workflow import run_workflow
from db_driver import DatabaseDriver

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
db = DatabaseDriver()

SESSIONS = {}

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "analyze_booking_priority",
            "description": "Analyze symptoms and assign urgency and priority score.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string"}
                },
                "required": ["reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_specialization",
            "description": "Recommend the most suitable doctor specialization from symptoms or complaint.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {"type": "string"}
                },
                "required": ["reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "resolve_relative_date",
            "description": "Convert date phrases into YYYY-MM-DD.",
            "parameters": {
                "type": "object",
                "properties": {
                    "input_text": {"type": "string"},
                    "current_date": {"type": "string"}
                },
                "required": ["input_text", "current_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "normalize_time_input",
            "description": "Convert natural time like 6 pm or 10:30 am into 24-hour HH:MM.",
            "parameters": {
                "type": "object",
                "properties": {
                    "input_time": {"type": "string"}
                },
                "required": ["input_time"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_appointments",
            "description": "PATIENT ONLY: Check upcoming appointments for the logged-in patient.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_available_doctors",
            "description": "PATIENT ONLY: List doctors, optionally filtered by specialization.",
            "parameters": {
                "type": "object",
                "properties": {
                    "specialization": {"type": "string"},
                    "search": {"type": "string"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_new_appointment",
            "description": "PATIENT ONLY: Book a new appointment for the logged-in patient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_name": {"type": "string"},
                    "appointment_date": {"type": "string"},
                    "appointment_time": {"type": "string"},
                    "reason": {"type": "string"},
                    "priority_score": {"type": "integer"},
                    "urgency_label": {"type": "string"}
                },
                "required": ["doctor_name", "appointment_date", "appointment_time", "reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_patient_cancellation_target",
            "description": "PATIENT ONLY: Find the logged-in patient's own appointment to cancel using optional doctor name, date, or time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_name": {"type": "string"},
                    "appointment_date": {"type": "string"},
                    "appointment_time": {"type": "string"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_existing_appointment",
            "description": "PATIENT ONLY: Cancel the logged-in patient's own appointment by appointment_id.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "string"}
                },
                "required": ["appointment_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "view_doctor_appointments",
            "description": "DOCTOR ONLY: View appointments for the logged-in doctor.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_next_patient",
            "description": "DOCTOR ONLY: Get the next pending patient for the logged-in doctor.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_urgent_queue",
            "description": "DOCTOR ONLY: Get the urgent queue for the logged-in doctor.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mark_doctor_appointment_completed",
            "description": "DOCTOR ONLY: Mark one appointment from the logged-in doctor's schedule as completed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "string"}
                },
                "required": ["appointment_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_doctor_cancellation_target",
            "description": "DOCTOR ONLY: Identify the exact appointment to cancel from the doctor's own schedule using patient name/date/time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "patient_name": {"type": "string"},
                    "appointment_date": {"type": "string"},
                    "appointment_time": {"type": "string"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "cancel_doctor_appointment",
            "description": "DOCTOR ONLY: Cancel an appointment from the logged-in doctor's schedule with a required reason.",
            "parameters": {
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "string"},
                    "reason": {"type": "string"}
                },
                "required": ["reason"]
            }
        }
    }
]


def india_today() -> str:
    try:
        return datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")
    except (ZoneInfoNotFoundError, Exception):
        india_time = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        return india_time.strftime("%Y-%m-%d")


def _extract_json(tool_result: str):
    try:
        return json.loads(tool_result)
    except Exception:
        return None


def _doctor_display_name(name: str) -> str:
    cleaned = str(name or "Doctor").strip()
    lower_cleaned = cleaned.lower()
    if lower_cleaned.startswith("dr.") or lower_cleaned.startswith("dr "):
        return cleaned
    return f"Dr. {cleaned}"


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _message_has_explicit_doctor(message: str) -> bool:
    text = _normalize_text(message)
    return bool(re.search(r"\bdr\.?\s+[a-z]+(?:\s+[a-z]+){0,3}\b", text))


def _extract_explicit_doctor_name(message: str) -> str | None:
    match = re.search(
        r"\b(dr\.?\s+[a-z]+(?:\s+[a-z]+){0,3})\b",
        message,
        re.IGNORECASE
    )
    if not match:
        return None
    return match.group(1).strip()


def _looks_like_show_appointments_intent(message: str) -> bool:
    text = _normalize_text(message)
    keywords = [
        "show my appointment",
        "show my appointments",
        "show my current appointment",
        "show my current appointments",
        "my appointment",
        "my appointments",
        "upcoming appointment",
        "upcoming appointments",
        "current appointment",
        "current appointments",
        "view appointments",
        "see appointments",
        "show appointments",
    ]
    return any(k in text for k in keywords)


def _looks_like_cancel_intent(message: str) -> bool:
    text = _normalize_text(message)
    return "cancel" in text and "appointment" in text


def _extract_relative_or_absolute_date_phrase(message: str) -> str | None:
    text = _normalize_text(message)

    if "day after tomorrow" in text:
        return "day after tomorrow"
    if "tomorrow" in text:
        return "tomorrow"
    if "today" in text:
        return "today"

    date_patterns = [
        r"\b\d{4}-\d{2}-\d{2}\b",
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",
        r"\b\d{1,2}-\d{1,2}-\d{4}\b",
        r"\b\d{1,2}(st|nd|rd|th)?\s+[a-z]+\s+\d{4}\b",
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)

    return None


def _extract_time_phrase(message: str) -> str | None:
    text = _normalize_text(message)

    patterns = [
        r"\b\d{1,2}:\d{2}\s?(am|pm)?\b",
        r"\b\d{1,2}\s?(am|pm)\b",
        r"\b\d{1,2}:\d{2}\b",
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)

    return None


async def _hydrate_auth_context(
    session_id: str,
    user_id: str | None,
    role: str | None,
    token: str | None
):
    if token:
        merge_session(session_id, {"token": token})

    if not user_id and not token:
        merge_session(session_id, {"auth_checked": True})
        return

    auth_data = await db.get_auth_context(user_id=user_id, token=token)

    if auth_data and auth_data.get("success"):
        payload = auth_data.get("data", {})
        merge_session(session_id, {
            "user_id": payload.get("userId") or user_id,
            "role": payload.get("role") or role,
            "patient_id": payload.get("patientId"),
            "doctor_id": payload.get("doctorId"),
            "patient_name": payload.get("patientName"),
            "doctor_name": payload.get("doctorName"),
            "dob": payload.get("dob"),
            "phone": payload.get("phone"),
            "token": token,
            "is_authenticated": True,
            "auth_checked": True,
            "pending_patient_cancel_target": None,
            "pending_doctor_cancel_target": None,
        })
    else:
        merge_session(session_id, {
            "user_id": user_id,
            "role": role,
            "patient_id": None,
            "doctor_id": None,
            "patient_name": None,
            "doctor_name": None,
            "dob": None,
            "phone": None,
            "token": token,
            "is_authenticated": False,
            "auth_checked": True,
            "pending_patient_cancel_target": None,
            "pending_doctor_cancel_target": None,
        })


def _build_context_message(state: dict) -> str:
    parts = []

    if state.get("user_id"):
        parts.append(f"Logged-in app user ID: {state['user_id']}")
    if state.get("role"):
        parts.append(f"Logged-in role: {state['role']}")
    if state.get("patient_id"):
        parts.append(f"Patient record ID: {state['patient_id']}")
    if state.get("doctor_id"):
        parts.append(f"Doctor record ID: {state['doctor_id']}")
    if state.get("patient_name"):
        parts.append(f"Patient name: {state['patient_name']}")
    if state.get("doctor_name"):
        parts.append(f"Doctor name: {state['doctor_name']}")
    if state.get("dob"):
        parts.append(f"Patient DOB: {state['dob']}")
    if state.get("phone"):
        parts.append(f"Phone: {state['phone']}")
    if state.get("last_doctor"):
        parts.append(f"Last discussed doctor: {state['last_doctor']}")
    if state.get("last_reason"):
        parts.append(f"Last discussed reason: {state['last_reason']}")
    if state.get("last_resolved_date"):
        parts.append(f"Last resolved appointment date: {state['last_resolved_date']}")
    if state.get("last_specialization"):
        parts.append(f"Last recommended specialization: {state['last_specialization']}")

    pending_cancel = state.get("pending_doctor_cancel_target")
    if pending_cancel:
        parts.append(f"Pending doctor cancellation target appointment ID: {pending_cancel.get('_id')}")
        patient = pending_cancel.get("patient_id", {}) or {}
        if patient.get("name"):
            parts.append(f"Pending doctor cancellation target patient name: {patient.get('name')}")
        if pending_cancel.get("date"):
            parts.append(f"Pending doctor cancellation target date: {str(pending_cancel.get('date'))[:10]}")
        if pending_cancel.get("time"):
            parts.append(f"Pending doctor cancellation target time: {pending_cancel.get('time')}")

    pending_patient_cancel = state.get("pending_patient_cancel_target")
    if pending_patient_cancel:
        parts.append(f"Pending patient cancellation target appointment ID: {pending_patient_cancel.get('_id')}")
        doctor = pending_patient_cancel.get("doctor_id", {}) or {}
        if doctor.get("name"):
            parts.append(f"Pending patient cancellation target doctor name: {doctor.get('name')}")
        if pending_patient_cancel.get("date"):
            parts.append(f"Pending patient cancellation target date: {str(pending_patient_cancel.get('date'))[:10]}")
        if pending_patient_cancel.get("time"):
            parts.append(f"Pending patient cancellation target time: {pending_patient_cancel.get('time')}")

    return "\n".join(parts)


def _fmt_date(date_value):
    try:
        return datetime.fromisoformat(
            str(date_value).replace("Z", "+00:00")
        ).strftime("%Y-%m-%d")
    except Exception:
        return str(date_value)[:10]


def _format_doctor_list_reply(specialization: str, payload: dict) -> str:
    doctors = payload.get("data", []) if isinstance(payload, dict) else []
    if not doctors:
        return (
            f"I could not find any available doctors for {specialization} right now."
            if specialization
            else "I could not find any available doctors right now."
        )

    lines = [
        f"I recommend seeing a {specialization}. Here are the available doctors:"
        if specialization
        else "Here are the available doctors:"
    ]

    for i, doctor in enumerate(doctors, start=1):
        name = _doctor_display_name(doctor.get("name", "Doctor"))
        spec = doctor.get("specialization", "")
        lines.append(f"{i}. {name}" + (f" ({spec.title()})" if spec else ""))

    lines.append("")
    lines.append("Which doctor would you like to book an appointment with?")
    return "\n".join(lines)


def _format_check_appointments_reply(payload: dict) -> str:
    appointments = payload.get("data", []) if isinstance(payload, dict) else []
    if not appointments:
        return "You do not have any appointments right now."

    lines = ["Here are your appointments:"]
    for i, appt in enumerate(appointments, start=1):
        doctor = appt.get("doctor_id", {}) or {}
        doctor_name = _doctor_display_name(doctor.get("name", "Doctor"))
        lines.append(
            f"{i}. {doctor_name} on {_fmt_date(appt.get('date'))} at {appt.get('time', '')} - {appt.get('status', '')}"
        )
    return "\n".join(lines)


def _format_booking_reply(payload: dict) -> str:
    if not payload.get("success"):
        return payload.get("message", "Unable to book appointment.")

    appointment = payload.get("data", {}) or {}
    doctor = appointment.get("doctor_id", {}) or {}
    doctor_name = _doctor_display_name(doctor.get("name", "Doctor"))
    date_value = _fmt_date(appointment.get("date", ""))
    time_value = appointment.get("time", "")
    return f"Your appointment with {doctor_name} has been successfully booked for {date_value} at {time_value}."


def _format_cancel_reply(payload: dict, actor: str = "patient") -> str:
    if not payload.get("success"):
        return payload.get("message", "Unable to cancel appointment.")
    return (
        "The appointment has been cancelled and the patient has been notified."
        if actor == "doctor"
        else "Your appointment has been cancelled successfully."
    )


def _format_doctor_appointments_reply(payload: dict) -> str:
    appointments = payload.get("data", []) if isinstance(payload, dict) else []
    if not appointments:
        return "You do not have any appointments right now."

    lines = ["Here are your appointments:"]
    for i, appt in enumerate(appointments, start=1):
        patient = appt.get("patient_id", {}) or {}
        extra = []
        if appt.get("reason"):
            extra.append(appt["reason"])
        if appt.get("urgencyLabel"):
            extra.append(f"urgency: {appt['urgencyLabel']}")
        lines.append(
            f"{i}. {patient.get('name', 'Patient')} on {_fmt_date(appt.get('date'))} at {appt.get('time', '')} - {appt.get('status', '')}"
            + (f" ({', '.join(extra)})" if extra else "")
        )
    return "\n".join(lines)


def _format_next_patient_reply(payload: dict) -> str:
    if not payload.get("success"):
        return payload.get("message", "Unable to fetch the next patient right now.")

    appt = payload.get("data")
    if not appt:
        return "You do not have any upcoming pending patients."

    patient = appt.get("patient_id", {}) or {}
    return f"Your next patient is {patient.get('name', 'Patient')} on {_fmt_date(appt.get('date'))} at {appt.get('time', '')}."


def _format_urgent_queue_reply(payload: dict) -> str:
    appointments = payload.get("data", []) if isinstance(payload, dict) else []
    if not appointments:
        return "You do not have any urgent patients right now."

    lines = ["Here is your urgent queue:"]
    for i, appt in enumerate(appointments, start=1):
        patient = appt.get("patient_id", {}) or {}
        lines.append(
            f"{i}. {patient.get('name', 'Patient')} on {_fmt_date(appt.get('date'))} at {appt.get('time', '')} - {appt.get('urgencyLabel', '')} - score {appt.get('priorityScore', '')}"
        )
    return "\n".join(lines)


def _format_complete_reply(payload: dict) -> str:
    if not payload.get("success"):
        return payload.get("message", "Unable to mark appointment completed.")
    return "The appointment has been marked as completed."


def _format_doctor_cancel_target_reply(payload: dict) -> str:
    if not payload.get("success"):
        return payload.get("message", "I could not identify the appointment to cancel.")

    appt = payload.get("data")
    if not appt:
        return "I could not identify the appointment to cancel."

    patient = appt.get("patient_id", {}) or {}
    return (
        f"I found the appointment for {patient.get('name', 'the patient')} on "
        f"{_fmt_date(appt.get('date'))} at {appt.get('time', '')}. "
        f"Please provide the cancellation reason."
    )


async def _run_and_format(
    function_name: str,
    function_args: dict,
    session_id: str,
    user_message: str
):
    tool_result = await run_workflow(function_name, function_args, session_id)
    parsed_result = _extract_json(tool_result)
    messages = SESSIONS[session_id]

    if function_name == "check_appointments" and parsed_result:
        text = _format_check_appointments_reply(parsed_result)
    elif function_name == "view_doctor_appointments" and parsed_result:
        text = _format_doctor_appointments_reply(parsed_result)
    elif function_name == "get_next_patient" and parsed_result:
        text = _format_next_patient_reply(parsed_result)
    elif function_name == "get_urgent_queue" and parsed_result:
        text = _format_urgent_queue_reply(parsed_result)
    elif function_name == "cancel_existing_appointment" and parsed_result:
        text = _format_cancel_reply(parsed_result, actor="patient")
    elif function_name == "cancel_doctor_appointment" and parsed_result:
        text = _format_cancel_reply(parsed_result, actor="doctor")
    elif function_name == "mark_doctor_appointment_completed" and parsed_result:
        text = _format_complete_reply(parsed_result)
    else:
        text = parsed_result.get("message") if isinstance(parsed_result, dict) else "Done."

    messages.extend([
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": text}
    ])
    return text, session_id


async def _try_direct_role_routing(message: str, session_id: str):
    state = get_session(session_id)
    role = (state.get("role") or "").lower()
    text = _normalize_text(message)

    logger.info(
        "Direct routing | role=%s | message=%s",
        role,
        message
    )

    if role == "doctor" and _looks_like_show_appointments_intent(text):
        return await _run_and_format("view_doctor_appointments", {}, session_id, message)

    if role == "patient" and _looks_like_show_appointments_intent(text):
        return await _run_and_format("check_appointments", {}, session_id, message)

    if role == "patient" and _looks_like_cancel_intent(text):
        date_phrase = _extract_relative_or_absolute_date_phrase(message)
        time_phrase = _extract_time_phrase(message)
        doctor_name = _extract_explicit_doctor_name(message)

        resolved_date = None
        normalized_time = None

        if date_phrase:
            resolved_result = await run_workflow(
                "resolve_relative_date",
                {"input_text": date_phrase, "current_date": india_today()},
                session_id,
            )
            parsed_date = _extract_json(resolved_result)
            if parsed_date and parsed_date.get("success"):
                resolved_date = parsed_date.get("resolved_date")

        if time_phrase:
            normalized_result = await run_workflow(
                "normalize_time_input",
                {"input_time": time_phrase},
                session_id,
            )
            parsed_time = _extract_json(normalized_result)
            if parsed_time and parsed_time.get("success"):
                normalized_time = parsed_time.get("normalized_time")

        tool_result = await run_workflow(
            "find_patient_cancellation_target",
            {
                "doctor_name": doctor_name,
                "appointment_date": resolved_date,
                "appointment_time": normalized_time,
            },
            session_id,
        )
        parsed_result = _extract_json(tool_result)

        if parsed_result and parsed_result.get("success") and parsed_result.get("data"):
            merge_session(session_id, {
                "pending_patient_cancel_target": parsed_result.get("data")
            })
            appointment_id = parsed_result["data"].get("_id")
            if appointment_id:
                cancel_text, cancel_session_id = await _run_and_format(
                    "cancel_existing_appointment",
                    {"appointment_id": appointment_id},
                    session_id,
                    message,
                )
                return cancel_text, cancel_session_id

        if parsed_result:
            messages = SESSIONS[session_id]
            text_reply = parsed_result.get(
                "message",
                "I could not identify the appointment to cancel."
            )
            messages.extend([
                {"role": "user", "content": message},
                {"role": "assistant", "content": text_reply}
            ])
            return text_reply, session_id

    return None


async def process_message(
    message: str,
    user_id: str | None = None,
    session_id: str | None = None,
    patient_id: str | None = None,
    role: str | None = None,
    token: str | None = None,
) -> tuple[str, str]:
    try:
        if not session_id:
            session_id = create_session()

        if session_id not in SESSIONS:
            SESSIONS[session_id] = [{"role": "system", "content": INSTRUCTIONS}]

        await _hydrate_auth_context(session_id, user_id, role, token)

        if patient_id:
            merge_session(session_id, {
                "patient_id": patient_id,
                "is_authenticated": True
            })

        state = get_session(session_id)

        logger.info(
            "AI session hydrated | session_id=%s | role=%s | user_id=%s | patient_id=%s | doctor_id=%s",
            session_id,
            state.get("role"),
            state.get("user_id"),
            state.get("patient_id"),
            state.get("doctor_id"),
        )

        explicit_doctor = _extract_explicit_doctor_name(message)
        if explicit_doctor:
            merge_session(session_id, {"last_doctor": explicit_doctor})

        direct_result = await _try_direct_role_routing(message, session_id)
        if direct_result:
            return direct_result

        messages = SESSIONS[session_id]
        turn_messages = list(messages)

        context_message = _build_context_message(state)
        if context_message:
            turn_messages.append({"role": "system", "content": context_message})

        turn_messages.append({
            "role": "system",
            "content": (
                f"Today's date is {india_today()}. "
                "Always resolve date phrases before booking. "
                "Always normalize natural times before booking if needed. "
                "If the user explicitly provided a doctor name, never recommend other doctors before trying to book with that same doctor. "
                "If doctor role wants to cancel and gives patient/date/time, identify the target first, then ask for reason. "
                "If patient role wants to cancel and gives enough identifying details, identify that appointment and cancel it."
            )
        })

        turn_messages.append({"role": "user", "content": message})

        while True:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=turn_messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=700,
            )

            response_message = response.choices[0].message

            if response_message.tool_calls:
                turn_messages.append(response_message)

                for tool_call in response_message.tool_calls:
                    function_name = tool_call.function.name

                    try:
                        function_args = json.loads(tool_call.function.arguments or "{}")
                    except json.JSONDecodeError:
                        function_args = {}

                    if function_name == "list_available_doctors" and _message_has_explicit_doctor(message):
                        continue

                    tool_result = await run_workflow(function_name, function_args, session_id)
                    parsed_result = _extract_json(tool_result)

                    if (
                        function_name == "resolve_relative_date"
                        and parsed_result
                        and parsed_result.get("success")
                    ):
                        merge_session(session_id, {
                            "last_resolved_date": parsed_result.get("resolved_date")
                        })

                    if (
                        function_name == "recommend_specialization"
                        and parsed_result
                        and parsed_result.get("success")
                    ):
                        merge_session(session_id, {
                            "last_specialization": parsed_result.get("data", {}).get("specialization")
                        })

                    if function_name == "book_new_appointment":
                        requested_doctor = function_args.get("doctor_name")
                        requested_reason = function_args.get("reason")
                        requested_date = function_args.get("appointment_date")

                        updates = {}
                        if requested_doctor:
                            updates["last_doctor"] = requested_doctor
                        if requested_reason:
                            updates["last_reason"] = requested_reason
                        if requested_date:
                            updates["last_resolved_date"] = requested_date
                        if updates:
                            merge_session(session_id, updates)

                    if (
                        function_name == "find_doctor_cancellation_target"
                        and parsed_result
                        and parsed_result.get("success")
                        and parsed_result.get("data")
                    ):
                        merge_session(session_id, {
                            "pending_doctor_cancel_target": parsed_result.get("data")
                        })

                    if (
                        function_name == "find_patient_cancellation_target"
                        and parsed_result
                        and parsed_result.get("success")
                        and parsed_result.get("data")
                    ):
                        merge_session(session_id, {
                            "pending_patient_cancel_target": parsed_result.get("data")
                        })

                    if function_name == "cancel_doctor_appointment" and parsed_result and parsed_result.get("success"):
                        merge_session(session_id, {
                            "pending_doctor_cancel_target": None
                        })

                    if function_name == "cancel_existing_appointment" and parsed_result and parsed_result.get("success"):
                        merge_session(session_id, {
                            "pending_patient_cancel_target": None
                        })

                    turn_messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result
                    })

                    if function_name == "list_available_doctors" and parsed_result:
                        latest_state = get_session(session_id)
                        text_reply = _format_doctor_list_reply(
                            specialization=function_args.get("specialization")
                            or latest_state.get("last_specialization")
                            or "",
                            payload=parsed_result
                        )
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "check_appointments" and parsed_result:
                        text_reply = _format_check_appointments_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "book_new_appointment" and parsed_result:
                        text_reply = _format_booking_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "find_patient_cancellation_target" and parsed_result:
                        if parsed_result.get("success") and parsed_result.get("data"):
                            appointment_id = parsed_result["data"].get("_id")
                            if appointment_id:
                                cancel_result = await run_workflow(
                                    "cancel_existing_appointment",
                                    {"appointment_id": appointment_id},
                                    session_id
                                )
                                cancel_payload = _extract_json(cancel_result) or {
                                    "success": False,
                                    "message": "Unable to cancel appointment."
                                }
                                text_reply = _format_cancel_reply(cancel_payload, actor="patient")
                                messages.extend([
                                    {"role": "user", "content": message},
                                    {"role": "assistant", "content": text_reply}
                                ])
                                return text_reply, session_id

                        text_reply = parsed_result.get(
                            "message",
                            "I could not identify the appointment to cancel."
                        )
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "cancel_existing_appointment" and parsed_result:
                        text_reply = _format_cancel_reply(parsed_result, actor="patient")
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "view_doctor_appointments" and parsed_result:
                        text_reply = _format_doctor_appointments_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "get_next_patient" and parsed_result:
                        text_reply = _format_next_patient_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "get_urgent_queue" and parsed_result:
                        text_reply = _format_urgent_queue_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "mark_doctor_appointment_completed" and parsed_result:
                        text_reply = _format_complete_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "find_doctor_cancellation_target" and parsed_result:
                        text_reply = _format_doctor_cancel_target_reply(parsed_result)
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                    if function_name == "cancel_doctor_appointment" and parsed_result:
                        text_reply = _format_cancel_reply(parsed_result, actor="doctor")
                        messages.extend([
                            {"role": "user", "content": message},
                            {"role": "assistant", "content": text_reply}
                        ])
                        return text_reply, session_id

                continue

            final_text = response_message.content or "I’m here to help."
            messages.extend([
                {"role": "user", "content": message},
                {"role": "assistant", "content": final_text}
            ])
            return final_text, session_id

    except Exception:
        logger.exception("Error in process_message")
        return (
            "I'm sorry, I encountered an error while processing your request. Please try again.",
            session_id or ""
        )