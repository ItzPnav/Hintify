import express from "express";
import cors from "cors";
import questionsRouter from "./routes/questions.routes";
import hintsRouter from "./routes/hints.routes";
import documentsRouter from "./routes/documents.routes"; // ← add this

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/questions", questionsRouter);
app.use("/api/hints", hintsRouter);
app.use("/api/documents", documentsRouter); // ← add this

app.get("/api/health", (req, res) => res.json({ ok: true }));

export default app;