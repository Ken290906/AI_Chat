import express from "express";
import { chatWithAI, getPreviousSessionHistory, getFullClientHistory } from "../controllers/chatController.js";
const router = express.Router();

router.post("/", chatWithAI);

router.get("/history/previous", getPreviousSessionHistory); // Dùng query params
router.get("/history/full/:clientId", getFullClientHistory); // Dùng url param

export default router;
