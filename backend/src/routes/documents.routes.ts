import { Router } from "express";
import { getLatestDocument } from "../controllers/documents.controller";

const router = Router();

router.get("/latest", getLatestDocument);
router.head("/latest", getLatestDocument); // for hasDocument() check

export default router;