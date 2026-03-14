import { Router } from "express";
import multer from "multer";
import { uploadPdf, listQuestions, getQuestionCount } from "../controllers/questions.controller";

const upload = multer(); // memory storage
const router = Router();

// /count must be registered before any /:id style routes to avoid shadowing
router.get("/count", getQuestionCount);
router.get("/", listQuestions);
router.post("/upload", upload.single("pdf"), uploadPdf);

export default router;