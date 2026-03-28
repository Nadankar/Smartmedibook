import uuid

SESSION_DEFAULT = {
    "patient_id": None,
    "patient_name": None,
    "doctor_id": None,
    "doctor_name": None,
    "dob": None,
    "phone": None,
    "user_id": None,
    "role": None,
    "token": None,
    "is_authenticated": False,
    "auth_checked": False,
    "last_doctor": None,
    "last_appointment": None,
    "last_reason": None,
    "last_resolved_date": None,
    "last_specialization": None,
    "pending_doctor_cancel_target": None,
}

SESSION_STATE = {}


def _new_state():
    return dict(SESSION_DEFAULT)


def create_session():
    session_id = str(uuid.uuid4())
    SESSION_STATE[session_id] = _new_state()
    return session_id


def get_session(session_id):
    if session_id not in SESSION_STATE:
        SESSION_STATE[session_id] = _new_state()
    return SESSION_STATE[session_id]


def update_session(session_id, key, value):
    if session_id not in SESSION_STATE:
        SESSION_STATE[session_id] = _new_state()
    SESSION_STATE[session_id][key] = value


def merge_session(session_id, payload: dict):
    if session_id not in SESSION_STATE:
        SESSION_STATE[session_id] = _new_state()
    SESSION_STATE[session_id].update(payload)


def clear_session(session_id):
    if session_id in SESSION_STATE:
        del SESSION_STATE[session_id]