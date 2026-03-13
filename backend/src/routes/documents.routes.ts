import { Router } from "express";
import { getLatestDocument } from "../controllers/documents.controller";

const router = Router();

// GET /api/documents/latest — serves the raw PDF binary
router.get("/latest", getLatestDocument);

export default router;