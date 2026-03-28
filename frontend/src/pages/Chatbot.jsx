
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AI_URL = import.meta.env.VITE_AI_URL || "http://localhost:8000";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("ai_session_id") || ""
  );

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const token = localStorage.getItem("token") || "";

  const getWelcome = () => {
    if (!storedUser) {
      return "👋 Hello! Please login first if you want help with appointments.";
    }

    if (storedUser.role === "doctor") {
      return "👋 Hello Doctor! I can help you view appointments, see the next patient, check urgent queue, complete appointments, and cancel with reason.";
    }

    return "👋 Hello! I can help you book, check, or cancel your appointments.";
  };

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: getWelcome(),
    },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const formatTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shouldRefreshAppointments = (replyText) => {
    const text = String(replyText || "").toLowerCase();

    return (
      text.includes("successfully booked") ||
      text.includes("appointment has been cancelled") ||
      text.includes("cancelled successfully") ||
      text.includes("has been cancelled") ||
      text.includes("marked as completed") ||
      text.includes("marked as completed.") ||
      text.includes("appointment has been marked as completed")
    );
  };

  const triggerDashboardRefresh = () => {
    window.dispatchEvent(new Event("appointments:refresh"));
  };

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmed,
        time: formatTime(),
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${AI_URL}/chat`, {
        message: trimmed,
        session_id: sessionId || null,
        user_id: storedUser?.id || null,
        role: storedUser?.role || null,
        token: token || null,
      });

      const newSessionId = response?.data?.session_id;
      if (newSessionId) {
        setSessionId(newSessionId);
        localStorage.setItem("ai_session_id", newSessionId);
      }

      const reply =
        response?.data?.reply ||
        "Sorry, I could not process that right now.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          time: formatTime(),
        },
      ]);

      if (shouldRefreshAppointments(reply)) {
        triggerDashboardRefresh();
      }
    } catch (error) {
      const errorText =
        error?.response?.data?.detail ||
        "AI service is not responding right now. Please make sure the AI server is running.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorText,
          time: formatTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleResetChat = async () => {
    if (!sessionId) {
      setMessages([{ role: "assistant", content: getWelcome() }]);
      return;
    }

    try {
      await axios.post(`${AI_URL}/reset?session_id=${sessionId}`);
    } catch (error) {
      console.log("Reset failed:", error);
    }

    localStorage.removeItem("ai_session_id");
    setSessionId("");
    setMessages([{ role: "assistant", content: getWelcome() }]);
  };

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-[#1b0f2e] to-black ">
      <Navbar />

      <div className="flex flex-1 relative justify-center items-center px-4">
        <div className="absolute left-4 top-24">
          <Sidebar />
        </div>

        <div className="w-full h-screen max-w-2xl flex flex-col overflow-hidden shadow-2xl rounded-xl bg-gradient-to-b from-[#3b1d5c] to-[#0f172a] border border-purple-700/40 my-20">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-950 to-pink-500">
            <div className="flex items-center gap-3">
              <img
                src="https://tse2.mm.bing.net/th/id/OIP.Xy3MEyqhqGeKjY5VznKpUgHaHa?pid=Api&P=0&h=180"
                alt="AI"
                className="h-14 w-14 rounded-full"
              />
              <div>
                <h2 className="text-white font-semibold text-xl">AI Assistant</h2>
                <p className="text-green-300 text-sm font-medium">● Online</p>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="btn btn-sm border-0 text-white bg-black/30 hover:bg-black/40"
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="text-center text-sm text-purple-200 py-2 bg-purple-500/30">
            ✨ Chat with AI Assistant — Smart Healthcare Guidance ✨
          </div>

          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 text-sm bg-gradient-to-b from-[#120821] to-[#0b1220]">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.role === "assistant"
                    ? "self-start max-w-xs sm:max-w-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-2xl shadow-md whitespace-pre-wrap"
                    : "self-end max-w-xs sm:max-w-md bg-gradient-to-r from-pink-800 to-fuchsia-600 text-white px-4 py-2 rounded-2xl shadow-md whitespace-pre-wrap"
                }
              >
                {msg.content}
                <span
                  className={`block text-[10px] mt-1 ${
                    msg.role === "assistant"
                      ? "text-purple-200"
                      : "text-pink-200 text-right"
                  }`}
                >
                  {msg.time || "Just now"}
                </span>
              </div>
            ))}

            {loading && (
              <div className="self-start max-w-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-2xl shadow-md">
                Typing...
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          <div className="p-4 bg-[#0f172a] border-t border-purple-700/40">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask me anything..."
                className="flex-1 bg-[#1b0f2e] text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <button
                className="btn flex text-white border-amber-100 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 border-0 hover:scale-105 duration-1000"
                onClick={sendMessage}
                disabled={loading}
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="rounded-full bg-gradient-to-r from-bg-cyan-500 to-pink-500 p-1 hover:rotate-45"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path
                    fill="currentColor"
                    d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                  ></path>
                </svg>
                <span className="text-white">
                  {loading ? "Sending..." : "Send"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

       <Footer />
    </div>
   
     </>
  );
}

export default Chatbot;
