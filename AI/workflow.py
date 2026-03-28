import json
from datetime import datetime
from tools import AVAILABLE_FUNCTIONS
from session_state import get_session, update_session


def _auth_required_response():
    return json.dumps({
        "success": False,
        "auth_required": True,
        "message": "Please login first to continue."
    })


async def run_workflow(tool_name, args, session_id):
    state = get_session(session_id)
    tool = AVAILABLE_FUNCTIONS.get(tool_name)

    if not tool:
        return json.dumps({
            "success": False,
            "message": f"Unknown tool {tool_name}"
        })

    role = state.get("role")
    patient_id = state.get("patient_id")          # Patient collection _id
    patient_user_id = state.get("user_id")        # User collection _id
    doctor_user_id = state.get("user_id")
    token = state.get("token")

    general_tools = {
        "analyze_booking_priority",
        "recommend_specialization",
        "resolve_relative_date",
        "normalize_time_input",
    }

    patient_tools = {
        "check_appointments",
        "list_available_doctors",
        "book_new_appointment",
        "find_patient_cancellation_target",
        "cancel_existing_appointment",
    }

    doctor_tools = {
        "view_doctor_appointments",
        "get_next_patient",
        "get_urgent_queue",
        "mark_doctor_appointment_completed",
        "find_doctor_cancellation_target",
        "cancel_doctor_appointment",
    }

    if tool_name in general_tools:
        if tool_name == "resolve_relative_date" and not args.get("current_date"):
            args["current_date"] = datetime.now().strftime("%Y-%m-%d")
        return await tool(**args)

    if tool_name in patient_tools and role != "patient":
        return json.dumps({
            "success": False,
            "message": "This action is available only for logged-in patients."
        })

    if tool_name in doctor_tools and role != "doctor":
        return json.dumps({
            "success": False,
            "message": "This action is available only for logged-in doctors."
        })

    if tool_name == "check_appointments":
        if not patient_user_id:
            return _auth_required_response()
        return await tool(patient_user_id=patient_user_id, token=token)

    if tool_name == "list_available_doctors":
        return await tool(**args)

    if tool_name == "book_new_appointment":
        if not patient_id:
            return _auth_required_response()

        args["patient_id"] = patient_id
        args["token"] = token

        if not args.get("doctor_name"):
            return json.dumps({
                "success": False,
                "message": "Doctor name is required."
            })
        if not args.get("appointment_date"):
            return json.dumps({
                "success": False,
                "message": "Appointment date is required."
            })
        if not args.get("appointment_time"):
            return json.dumps({
                "success": False,
                "message": "Appointment time is required."
            })
        if not args.get("reason"):
            return json.dumps({
                "success": False,
                "message": "Booking reason is required."
            })

        result = await tool(**args)

        try:
            data = json.loads(result)
            if data.get("success"):
                appointment = data.get("data", {})
                if isinstance(appointment, dict):
                    update_session(session_id, "last_appointment", appointment.get("_id"))
                update_session(session_id, "last_doctor", args.get("doctor_name"))
                update_session(session_id, "last_reason", args.get("reason"))
                update_session(session_id, "last_resolved_date", args.get("appointment_date"))
        except Exception:
            pass

        return result

    if tool_name == "find_patient_cancellation_target":
        if not patient_user_id:
            return _auth_required_response()

        result = await tool(
            patient_user_id=patient_user_id,
            doctor_name=args.get("doctor_name", ""),
            appointment_date=args.get("appointment_date", ""),
            appointment_time=args.get("appointment_time", ""),
            token=token,
        )

        try:
            data = json.loads(result)
            if data.get("success") and data.get("data"):
                update_session(
                    session_id,
                    "pending_patient_cancel_target",
                    data.get("data")
                )
        except Exception:
            pass

        return result

    if tool_name == "cancel_existing_appointment":
        if not patient_user_id:
            return _auth_required_response()

        appointment_id = args.get("appointment_id")
        if not appointment_id:
            pending_target = state.get("pending_patient_cancel_target") or {}
            appointment_id = pending_target.get("_id")

        if not appointment_id:
            return json.dumps({
                "success": False,
                "message": "I could not identify which appointment to cancel."
            })

        result = await tool(appointment_id=appointment_id, token=token)

        try:
            data = json.loads(result)
            if data.get("success"):
                update_session(session_id, "last_appointment", None)
                update_session(session_id, "pending_patient_cancel_target", None)
        except Exception:
            pass

        return result

    if tool_name in {"view_doctor_appointments", "get_next_patient", "get_urgent_queue"}:
        if not doctor_user_id:
            return _auth_required_response()
        return await tool(doctor_user_id=doctor_user_id, token=token)

    if tool_name == "mark_doctor_appointment_completed":
        if not doctor_user_id:
            return _auth_required_response()
        return await tool(
            appointment_id=args.get("appointment_id"),
            token=token
        )

    if tool_name == "find_doctor_cancellation_target":
        if not doctor_user_id:
            return _auth_required_response()

        result = await tool(
            doctor_user_id=doctor_user_id,
            patient_name=args.get("patient_name", ""),
            appointment_date=args.get("appointment_date", ""),
            appointment_time=args.get("appointment_time", ""),
            token=token,
        )

        try:
            data = json.loads(result)
            if data.get("success") and data.get("data"):
                update_session(
                    session_id,
                    "pending_doctor_cancel_target",
                    data.get("data")
                )
        except Exception:
            pass

        return result

    if tool_name == "cancel_doctor_appointment":
        if not doctor_user_id:
            return _auth_required_response()

        appointment_id = args.get("appointment_id")
        if not appointment_id:
            pending_target = state.get("pending_doctor_cancel_target") or {}
            appointment_id = pending_target.get("_id")

        if not appointment_id:
            return json.dumps({
                "success": False,
                "message": "I could not identify which appointment to cancel."
            })

        if not args.get("reason"):
            return json.dumps({
                "success": False,
                "message": "Cancellation reason is required."
            })

        result = await tool(
            appointment_id=appointment_id,
            reason=args.get("reason"),
            token=token,
        )

        try:
            data = json.loads(result)
            if data.get("success"):
                update_session(session_id, "pending_doctor_cancel_target", None)
        except Exception:
            pass

        return result

    return json.dumps({
        "success": False,
        "message": f"Unhandled tool {tool_name}"
    })