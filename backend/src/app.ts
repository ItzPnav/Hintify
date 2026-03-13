import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import questionsRouter from "./routes/questions.routes";
import hintsRouter from "./routes/hints.routes";
import documentsRouter from "./routes/documents.routes";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

app.use("/api/questions", questionsRouter);
app.use("/api/hints", hintsRouter);
app.use("/api/documents", documentsRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

export default app;