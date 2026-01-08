import express from "express";
import Conversation from "../models/Conversation.js";
import { planDatabase } from "../data/planDatabase.js";
import { generateSessionId } from "../utils/helpers.js";

const router = express.Router();

// 요금제 목록 조회
router.get("/plans", (req, res) => {
  res.json(planDatabase.plans);
});

// 헬스 체크
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// IP 기반 대화 기록 조회 API
router.get("/conversations/ip/:ip", async (req, res) => {
  try {
    const clientIP = req.params.ip;
    const userAgent = req.headers["user-agent"] || "";
    const sessionId = generateSessionId(clientIP, userAgent);

    const conversation = await Conversation.findOne({
      sessionId: sessionId,
    });

    if (conversation) {
      res.json({
        sessionId: sessionId,
        messages: conversation.messages,
        metadata: conversation.metadata,
      });
    } else {
      res.json({
        sessionId: sessionId,
        messages: [],
        metadata: null,
      });
    }
  } catch (error) {
    console.error("대화 가져오기 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 기존 세션 ID로 대화 기록 조회 API (호환성 유지)
router.get("/conversations/:sessionId", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      sessionId: req.params.sessionId,
    });

    if (conversation) {
      res.json(conversation.messages);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("대화 가져오기 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 관리자용 통계 API (선택사항)
router.get("/admin/stats", async (req, res) => {
  try {
    const totalConversations = await Conversation.countDocuments();
    const activeToday = await Conversation.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalConversations,
      activeToday,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("통계 조회 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

export default router;
