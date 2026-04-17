import json
from datetime import datetime
from tools import AVAILABLE_FUNCTIONS
from session_state import get_session, update_session, merge_session


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
    patient_id = state.get("patient_id")
    patient_user_id = state.get("user_id")
    doctor_user_id = state.get("user_id")
    token = state.get("token")

    print("=" * 60)
    print(f"WORKFLOW AUTH DEBUG:")
    print(f"  Tool: {tool_name}")
    print(f"  Role: {role}")
    print(f"  patient_id: {patient_id}")
    print(f"  patient_user_id: {patient_user_id}")
    print(f"  doctor_user_id: {doctor_user_id}")
    print(f"  token exists: {bool(token)}")
    print("=" * 60)

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

    # PATIENT CANCELLATION FLOW
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
                print(f"Storing pending patient cancel target: {data.get('data').get('_id')}")
                update_session(
                    session_id,
                    "pending_patient_cancel_target",
                    data.get("data")
                )
        except Exception as e:
            print(f"Error storing pending target: {e}")

        return result

    if tool_name == "cancel_existing_appointment":
        if not patient_user_id:
            return _auth_required_response()

        appointment_id = args.get("appointment_id")
        if not appointment_id:
            pending_target = state.get("pending_patient_cancel_target") or {}
            appointment_id = pending_target.get("_id")
            print(f"cancel_existing_appointment: Using pending target appointment_id={appointment_id}")

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
                print(f"Cancelled and cleared pending patient target")
        except Exception as e:
            print(f"Error clearing pending target: {e}")

        return result

    # DOCTOR APPOINTMENT VIEWING FLOWS
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

    # DOCTOR CANCELLATION FLOW
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

        # Store the pending target - DO NOT CLEAR IT
        try:
            data = json.loads(result)
            if data.get("success") and data.get("data"):
                print(f"Storing pending doctor cancel target: {data.get('data').get('_id')}")
                update_session(
                    session_id,
                    "pending_doctor_cancel_target",
                    data.get("data")
                )
                # Verify it was stored
                verify_state = get_session(session_id)
                print(f"Verified pending target in session: {verify_state.get('pending_doctor_cancel_target') is not None}")
        except Exception as e:
            print(f"Error storing pending target: {e}")

        return result

    if tool_name == "cancel_doctor_appointment":
        if not doctor_user_id:
            return json.dumps({
                "success": False,
                "message": "You must be logged in as a doctor to cancel appointments."
            })

        appointment_id = args.get("appointment_id")
        if not appointment_id:
            pending_target = state.get("pending_doctor_cancel_target") or {}
            appointment_id = pending_target.get("_id")
            print(f"cancel_doctor_appointment: Using pending target appointment_id={appointment_id}")

        if not appointment_id:
            return json.dumps({
                "success": False,
                "message": "I could not identify which appointment to cancel."
            })

        reason = args.get("reason")
        if not reason or not reason.strip():
            return json.dumps({
                "success": False,
                "message": "Please provide a cancellation reason."
            })

        print(f"   cancel_doctor_appointment: Cancelling appointment_id={appointment_id}")
        print(f"   Reason: {reason}")
        print(f"   Doctor User ID: {doctor_user_id}")
        
        try:
            result = await tool(
                appointment_id=appointment_id,
                reason=reason.strip(),
                token=token,
            )
            print(f"cancel_doctor_appointment result: {result[:200] if result else 'None'}")
            
            # Parse and return the result
            try:
                data = json.loads(result)
                if data.get("success"):
                    # Clear the pending target
                    update_session(session_id, "pending_doctor_cancel_target", None)
                    print(f"   Successfully cancelled and cleared pending target")
                else:
                    print(f"   Cancellation failed: {data.get('message')}")
                return result
            except json.JSONDecodeError as e:
                print(f"   JSON parse error: {e}")
                return json.dumps({
                    "success": False,
                    "message": f"Invalid response from server"
                })
        except Exception as e:
            print(f"Exception in cancel_doctor_appointment: {e}")
            import traceback
            traceback.print_exc()
            return json.dumps({
                "success": False,
                "message": f"Error cancelling appointment: {str(e)}"
            })

    return json.dumps({
        "success": False,
        "message": f"Unhandled tool {tool_name}"
    })