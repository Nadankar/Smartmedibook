import os
import httpx
from typing import Any, Dict, Optional

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:3000/api").rstrip("/")


class DatabaseDriver:
    def __init__(self):
        self.base_url = BACKEND_API_URL

    def _headers(self, token: Optional[str] = None) -> Dict[str, str]:
        headers: Dict[str, str] = {
            "Content-Type": "application/json"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def get_auth_context(
        self,
        user_id: Optional[str] = None,
        token: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        if not user_id and not token:
            return None

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/ai/auth-context",
                    params={"userId": user_id} if user_id else None,
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def get_patient_appointments(
        self,
        patient_user_id: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        print(f"📋 get_patient_appointments called with patient_user_id={patient_user_id}")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/appointments/patient/{patient_user_id}",
                    headers=self._headers(token),
                )
                print(f"📞 Response status: {response.status_code}")
                return response.json()
            except Exception as e:
                print(f"❌ Exception: {e}")
                return {"success": False, "message": str(e), "data": []}

    async def list_doctors(
        self,
        specialization: str = "",
        search: str = "",
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                params = {}
                if specialization:
                    params["specialization"] = specialization
                if search:
                    params["search"] = search

                response = await client.get(
                    f"{self.base_url}/ai/doctors",
                    params=params or None,
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def book_appointment(
        self,
        patient_id: str,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
        reason: str,
        priority_score: int,
        urgency_label: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        payload = {
            "patientId": patient_id,
            "doctorName": doctor_name,
            "date": appointment_date,
            "time": appointment_time,
            "reason": reason,
            "priorityScore": priority_score,
            "urgencyLabel": urgency_label,
            "source": "ai_chatbot",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/appointments",
                    json=payload,
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def find_patient_cancellation_target(
        self,
        patient_id: str,
        doctor_name: str = "",
        appointment_date: str = "",
        appointment_time: str = "",
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        params = {}

        if doctor_name:
            params["doctorName"] = doctor_name
        if appointment_date:
            params["date"] = appointment_date
        if appointment_time:
            params["time"] = appointment_time

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/appointments/patient/{patient_id}/find-target",
                    params=params or None,
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def cancel_patient_appointment(
        self,
        appointment_id: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.patch(
                    f"{self.base_url}/appointments/{appointment_id}/cancel",
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def get_doctor_appointments(
        self,
        doctor_user_id: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/appointments/doctor/{doctor_user_id}",
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def get_next_patient(
        self,
        doctor_user_id: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/appointments/doctor/{doctor_user_id}/next",
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def get_urgent_queue(
        self,
        doctor_user_id: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/appointments/doctor/{doctor_user_id}/urgent-queue",
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def mark_doctor_appointment_completed(
        self,
        appointment_id: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.put(
                    f"{self.base_url}/appointments/{appointment_id}/doctor-complete",
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def find_doctor_cancellation_target(
        self,
        doctor_user_id: str,
        patient_name: str = "",
        appointment_date: str = "",
        appointment_time: str = "",
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        params = {}

        if patient_name:
            params["patientName"] = patient_name
        if appointment_date:
            params["date"] = appointment_date
        if appointment_time:
            params["time"] = appointment_time

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/appointments/doctor/{doctor_user_id}/find-target",
                    params=params or None,
                    headers=self._headers(token),
                )
                return response.json()
            except Exception as e:
                return {"success": False, "message": str(e)}

    async def cancel_doctor_appointment(
        self,
        appointment_id: str,
        reason: str,
        token: str | None = None,
    ) -> Optional[Dict[str, Any]]:
        print(f"   cancel_doctor_appointment called:")
        print(f"   appointment_id={appointment_id}")
        print(f"   reason={reason}")
        print(f"   token exists={bool(token)}")
        
        if not appointment_id:
            return {"success": False, "message": "Appointment ID is required"}
        
        if not reason or not reason.strip():
            return {"success": False, "message": "Cancellation reason is required"}
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                url = f"{self.base_url}/appointments/{appointment_id}/doctor-cancel"
                headers = self._headers(token)
                payload = {"reason": reason.strip()}
                
                print(f"PUT {url}")
                print(f"payload={payload}")
                print(f"headers={headers}")
                
                response = await client.put(
                    url,
                    json=payload,
                    headers=headers,
                )
                
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.text[:500]}")
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    # Fallback to patient cancellation endpoint
                    print("Doctor cancel endpoint not found, trying patient cancel endpoint")
                    fallback_response = await client.patch(
                        f"{self.base_url}/appointments/{appointment_id}/cancel",
                        headers=headers,
                    )
                    if fallback_response.status_code == 200:
                        result = fallback_response.json()
                        if result.get("success"):
                            result["message"] = f"Appointment cancelled. Reason: {reason}"
                        return result
                    return {"success": False, "message": "Doctor cancel endpoint not available"}
                else:
                    try:
                        return response.json()
                    except:
                        return {"success": False, "message": f"Server returned status {response.status_code}"}
                        
            except httpx.TimeoutException:
                print(f"Timeout error")
                return {"success": False, "message": "Request timed out. Please try again."}
            except Exception as e:
                print(f"Exception in cancel_doctor_appointment: {e}")
                import traceback
                traceback.print_exc()
                return {"success": False, "message": str(e)}     