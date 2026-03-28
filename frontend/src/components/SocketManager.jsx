import { useEffect } from "react";
import { socket } from "../socket";

function joinRooms(user) {
  if (!user?.id) return;

  socket.emit("join:user", user.id);

  if (user.role === "patient") {
    socket.emit("join:patient", user.id);
  }

  if (user.role === "doctor") {
    socket.emit("join:doctor", user.id);
  }
}

function connectForCurrentUser() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  if (!socket.connected) {
    socket.connect();

    socket.on("connect", () => {
      joinRooms(user);
    });
  } else {
    joinRooms(user);
  }
}

function SocketManager() {
  useEffect(() => {
    connectForCurrentUser();

    const handleStorage = (e) => {
      if (e.key === "user") {
        setTimeout(() => {
          connectForCurrentUser();
        }, 100);
      }
    };

    const handleAuthChanged = () => {
      setTimeout(() => {
        connectForCurrentUser();
      }, 100);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("auth:changed", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("auth:changed", handleAuthChanged);
      socket.off("connect");
    };
  }, []);

  return null;
}

export default SocketManager;