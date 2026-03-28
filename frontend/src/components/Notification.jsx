import React, { useState } from "react";
import { useNotification } from "./NotificationContext";

function Notification() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
  } = useNotification();

  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    const next = !showDropdown;
    setShowDropdown(next);

    if (next) {
      markAllAsRead();
    }
  };

  return (
    <div className="relative">
      <button
        className="btn btn-ghost btn-circle"
        onClick={toggleDropdown}
        type="button"
      >
        <div className="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {unreadCount > 0 && (
            <span className="badge badge-xs badge-error indicator-item">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white shadow-xl rounded-xl p-3 z-50 border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex gap-2">
              <button
                className="text-xs text-blue-600"
                onClick={markAllAsRead}
                type="button"
              >
                Read all
              </button>
              <button
                className="text-xs text-red-600"
                onClick={clearNotifications}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications</p>
          ) : (
            notifications.map((note) => (
              <div
                key={note.id}
                className={`border-b last:border-b-0 p-2 rounded-md ${
                  note.read ? "bg-white" : "bg-purple-50"
                }`}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => markAsRead(note.id)}
                >
                  <p className="text-sm text-gray-800">{note.message}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="mt-1 flex justify-end">
                  <button
                    className="text-xs text-red-500"
                    onClick={() => removeNotification(note.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Notification;