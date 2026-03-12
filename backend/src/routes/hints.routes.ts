import { Router } from "express";
import { requestHint } from "../controllers/hints.controller";

const router = Router();
router.post("/", requestHint);
export default router;
