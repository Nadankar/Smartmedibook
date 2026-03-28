
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/config.js";
import { Server } from "socket.io";
import { setIo } from "./socket.js";

await connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

setIo(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join:user", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined room user:${userId}`);
    }
  });

  socket.on("join:doctor", (doctorUserId) => {
    if (doctorUserId) {
      socket.join(`doctor:${doctorUserId}`);
      console.log(`Socket ${socket.id} joined room doctor:${doctorUserId}`);
    }
  });

  socket.on("join:patient", (patientUserId) => {
    if (patientUserId) {
      socket.join(`patient:${patientUserId}`);
      console.log(`Socket ${socket.id} joined room patient:${patientUserId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, "Reason:", reason);
  });
});

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});