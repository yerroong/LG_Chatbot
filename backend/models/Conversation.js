import mongoose from "mongoose";
import crypto from "crypto";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  messages: [messageSchema],
  metadata: {
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessIP: String,
    lastAccessUserAgent: String,
    lastAccessTime: {
      type: Date,
      default: Date.now,
    },
    recommendedPlans: [String],
    // 추가 메타데이터
    sessionType: {
      type: String,
      default: "ip_based",
      enum: ["ip_based", "user_generated", "anonymous"],
    },
    totalInteractions: {
      type: Number,
      default: 0,
    },
    averageResponseTime: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 인덱스 설정
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ "metadata.ipAddress": 1 });
conversationSchema.index({ "metadata.lastAccessTime": -1 });

// 미들웨어: 업데이트 시 updatedAt 자동 갱신
conversationSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // 메시지 수 업데이트
  if (this.metadata) {
    this.metadata.totalInteractions = this.messages.length;
  }

  next();
});

// 메서드: 대화 요약 생성
conversationSchema.methods.getSummary = function () {
  return {
    sessionId: this.sessionId,
    messageCount: this.messages.length,
    firstMessage: this.messages[0]?.content || "",
    lastMessage: this.messages[this.messages.length - 1]?.content || "",
    duration: this.updatedAt - this.createdAt,
    ipAddress: this.metadata?.ipAddress || "unknown",
    lastAccess: this.metadata?.lastAccessTime || this.updatedAt,
  };
};

// 메서드: IP 기반 사용자 식별
conversationSchema.methods.isFromSameUser = function (ip, userAgent) {
  return (
    this.metadata?.ipAddress === ip && this.metadata?.userAgent === userAgent
  );
};

// 메서드: 세션 활성화 상태 확인
conversationSchema.methods.isActive = function (hoursThreshold = 24) {
  const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  return this.updatedAt > threshold;
};

// 정적 메서드: 오래된 대화 정리
conversationSchema.statics.cleanOldConversations = async function (
  daysOld = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    updatedAt: { $lt: cutoffDate },
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate: cutoffDate,
  };
};

// 정적 메서드: IP별 대화 찾기
conversationSchema.statics.findByIP = async function (ip, userAgent = "") {
  const hash = crypto
    .createHash("sha256")
    .update(ip + userAgent)
    .digest("hex");
  const sessionId = `ip_${hash.substring(0, 16)}`;

  return await this.findOne({ sessionId: sessionId });
};

// 정적 메서드: 활성 사용자 통계
conversationSchema.statics.getActiveStats = async function (
  hoursThreshold = 24
) {
  const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

  const stats = await this.aggregate([
    {
      $match: {
        updatedAt: { $gte: threshold },
      },
    },
    {
      $group: {
        _id: null,
        totalActiveConversations: { $sum: 1 },
        totalMessages: { $sum: { $size: "$messages" } },
        uniqueIPs: { $addToSet: "$metadata.ipAddress" },
        avgMessagesPerConversation: { $avg: { $size: "$messages" } },
      },
    },
    {
      $project: {
        _id: 0,
        totalActiveConversations: 1,
        totalMessages: 1,
        uniqueIPCount: { $size: "$uniqueIPs" },
        avgMessagesPerConversation: {
          $round: ["$avgMessagesPerConversation", 2],
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalActiveConversations: 0,
      totalMessages: 0,
      uniqueIPCount: 0,
      avgMessagesPerConversation: 0,
    }
  );
};

// 정적 메서드: IP별 사용 패턴 분석
conversationSchema.statics.analyzeIPUsage = async function (ip) {
  const conversations = await this.find({
    "metadata.ipAddress": ip,
  }).sort({ createdAt: -1 });

  if (conversations.length === 0) {
    return null;
  }

  const totalMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.length,
    0
  );
  const totalSessions = conversations.length;
  const firstVisit = conversations[conversations.length - 1].createdAt;
  const lastVisit = conversations[0].updatedAt;

  return {
    ip: ip,
    totalSessions: totalSessions,
    totalMessages: totalMessages,
    avgMessagesPerSession:
      Math.round((totalMessages / totalSessions) * 100) / 100,
    firstVisit: firstVisit,
    lastVisit: lastVisit,
    daysSinceFirstVisit: Math.ceil(
      (new Date() - firstVisit) / (1000 * 60 * 60 * 24)
    ),
    isReturningUser: totalSessions > 1,
  };
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;