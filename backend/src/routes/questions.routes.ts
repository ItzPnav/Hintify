import { Router } from "express";
import multer from "multer";
import { uploadPdf, listQuestions } from "../controllers/questions.controller";

const upload = multer();
const router = Router();

router.post("/upload", upload.single("pdf"), uploadPdf);
router.get("/", listQuestions);

export default router;
