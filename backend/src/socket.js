import { Server } from "socket.io";

let io;
const userSockets = new Map(); // userId -> [socketIds]

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("register", (userId) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
      }
      userSockets.get(userId).push(socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on("join_project", (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project room ${projectId}`);
    });

    socket.on("leave_project", (projectId) => {
      socket.leave(projectId);
      console.log(`Socket ${socket.id} left project room ${projectId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [userId, sockets] of userSockets.entries()) {
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            userSockets.delete(userId);
          }
          break;
        }
      }
    });
  });

  return io;
};

export const getIo = () => io;

export const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(projectId).emit(event, data);
    console.log(`Emitted ${event} to project ${projectId}`);
  }
};

export const emitToUser = (userId, event, data) => {
  if (io && userSockets.has(userId)) {
    const sockets = userSockets.get(userId);
    sockets.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
    console.log(`Successfully emitted ${event} to user ${userId} (${sockets.length} active sockets)`);
  } else {
    console.log(`Failed to emit ${event} to user ${userId}: User not connected via Socket.`);
  }
};
