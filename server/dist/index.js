import express from "express";
import cors from "cors";
import agentRouter from "./routes/agent";
const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";
app.use(cors({
    origin: (origin, callback) => {
        // Allow extension requests, curl, server-to-server, localhost, and all web origins
        if (!origin)
            return callback(null, true);
        if (origin.startsWith("chrome-extension://") ||
            origin.startsWith("moz-extension://") ||
            origin.includes("localhost") ||
            origin.includes("127.0.0.1") ||
            process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Session-ID"],
}));
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));
app.use("/api/agent", agentRouter);
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use((err, _req, res, _next) => {
    console.error("[SERVER ERROR]", err);
    res.status(500).json({ error: "Internal server error" });
});
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});
const server = app.listen(PORT, HOST, () => {
    console.log(`[Veil Server] Running on http://${HOST}:${PORT}`);
    console.log(`[Veil Server] Agent endpoint: POST http://${HOST}:${PORT}/api/agent/plan`);
    console.log(`[Veil Server] Health check: GET http://${HOST}:${PORT}/health`);
});
process.on("SIGTERM", () => {
    console.log("[Veil Server] SIGTERM received, shutting down...");
    server.close(() => {
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    console.log("[Veil Server] SIGINT received, shutting down...");
    server.close(() => {
        process.exit(0);
    });
});
export { app };
