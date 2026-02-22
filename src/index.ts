import app from "./app";
import prisma from "./config/db";
import env from "./config/environment";

const PORT = env.PORT || 3000;

// Start server
const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("✅ Prisma connected to PostgreSQL!");
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
});

// Server errors
server.on("error", (error) => {
  console.error("❌ Server error:", error);
});

server.on("clientError", (error, socket) => {
  console.error("⚠️ Client connection error:", error);
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

// Graceful shutdown
const shutdown = async () => {
  console.log("🛑 Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled Rejection:", reason);
});

// Uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("⚠️ Uncaught Exception:", error);
});