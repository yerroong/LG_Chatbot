import OpenAI from "openai";
import Conversation from "../models/Conversation.js";
import { getClientIP, generateSessionId } from "../utils/helpers.js";
import { systemPrompt } from "../data/planDatabase.js";

// OpenAI 클라이언트를 lazy하게 초기화
let openai = null;

const getOpenAIClient = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요."
      );
    }
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai;
};

// 세션 초기화 핸들러
export const handleInitSession = async (
  socket,
  sessionId,
  clientIP,
  userAgent
) => {
  console.log("세션 초기화 시작:", sessionId);

  try {
    const conversation = await Conversation.findOne({
      sessionId: sessionId,
    });

    if (conversation && conversation.messages.length > 0) {
      console.log(
        `기존 대화를 찾았습니다 (Session: ${sessionId}):`,
        conversation.messages.length,
        "messages"
      );

      // 메타데이터 업데이트
      conversation.metadata = {
        ...conversation.metadata,
        lastAccessIP: clientIP,
        lastAccessUserAgent: userAgent,
        lastAccessTime: new Date(),
      };
      await conversation.save();

      // 기존 대화 기록을 클라이언트에 전송
      socket.emit("conversation-history", conversation.messages);
    } else {
      console.log("기존 대화를 찾을 수 없습니다 (새 사용자)");
      socket.emit("conversation-history", []);
    }
  } catch (error) {
    console.error("대화를 로드하는 중 오류:", error);
    socket.emit("conversation-history", []);
  }
};

// 사용자 메시지 처리 핸들러
export const handleUserMessage = async (
  socket,
  message,
  sessionId,
  clientIP,
  userAgent
) => {
  try {
    console.log(`수신된 메시지 (Session: ${sessionId}):`, message);

    // 대화 기록 가져오기 또는 새로 생성
    let conversation = await Conversation.findOne({
      sessionId: sessionId,
    });

    if (!conversation) {
      conversation = new Conversation({
        sessionId: sessionId,
        messages: [],
        metadata: {
          ipAddress: clientIP,
          userAgent: userAgent,
          createdAt: new Date(),
          lastAccessIP: clientIP,
          lastAccessUserAgent: userAgent,
          lastAccessTime: new Date(),
        },
      });
      console.log("새로운 대화 생성 (Session ID):", sessionId);
    } else {
      // 기존 대화의 메타데이터 업데이트
      conversation.metadata = {
        ...conversation.metadata,
        lastAccessIP: clientIP,
        lastAccessUserAgent: userAgent,
        lastAccessTime: new Date(),
      };
    }

    // 사용자 메시지 생성 및 저장
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    conversation.messages.push(userMessage);
    await conversation.save();

    // 사용자 메시지를 클라이언트에 전송
    socket.emit("user-message-confirmed", {
      ...userMessage,
      id: conversation.messages[conversation.messages.length - 1]._id,
    });

    // OpenAI API 호출을 위한 메시지 배열 준비
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // 스트리밍용 임시 메시지 ID 생성
    const tempMessageId =
      "temp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);

    // 스트리밍 시작 알림
    socket.emit("stream-start", {
      messageId: tempMessageId,
      timestamp: new Date().toISOString(),
    });

    // OpenAI 스트리밍 응답
    const openaiClient = getOpenAIClient();
    // 모델을 환경 변수에서 가져오거나 기본값으로 gpt-4o-mini 사용
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const stream = await openaiClient.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    let fullResponse = "";

    // 스트리밍 처리
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        socket.emit("stream-chunk", content);
      }
    }

    // AI 응답 저장
    const assistantMessage = {
      role: "assistant",
      content: fullResponse,
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();
    await conversation.save();

    // 스트리밍 완료 및 최종 메시지 전송
    socket.emit("stream-end", {
      message: {
        ...assistantMessage,
        id: conversation.messages[conversation.messages.length - 1]._id,
      },
    });

    console.log(`메시지가 성공적으로 처리됨 (IP: ${clientIP})`);
  } catch (error) {
    console.error("메시지 처리 중 오류:", error);
    socket.emit("error", {
      message: "메시지 처리 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
};

// 대화 초기화 핸들러
export const handleClearConversation = async (socket, sessionId, clientIP) => {
  try {
    await Conversation.deleteOne({ sessionId: sessionId });
    socket.emit("conversation-cleared");
    console.log(
      `세션에 대한 대화가 지워졌습니다 (IP: ${clientIP}):`,
      sessionId
    );
  } catch (error) {
    console.error("대화 초기화 중 오류:", error);
    socket.emit("error", {
      message: "대화 초기화 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
};

// 소켓 연결 설정
export const setupSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("새 클라이언트 연결:", socket.id);

    // 클라이언트 정보 수집
    const clientIP = getClientIP(socket);
    const userAgent = socket.handshake.headers["user-agent"] || "";
    const sessionId = generateSessionId(clientIP, userAgent);

    socket.sessionId = sessionId;
    socket.clientIP = clientIP;

    console.log(`클라이언트 정보:
      - Socket ID: ${socket.id}
      - IP: ${clientIP}
      - Session ID: ${sessionId}
      - User-Agent: ${userAgent.substring(0, 50)}...`);

    // 이벤트 리스너 등록
    socket.on("init-session", () => {
      handleInitSession(socket, sessionId, clientIP, userAgent);
    });

    socket.on("user-message", (message) => {
      handleUserMessage(socket, message, sessionId, clientIP, userAgent);
    });

    socket.on("clear-conversation", () => {
      handleClearConversation(socket, sessionId, clientIP);
    });

    socket.on("disconnect", () => {
      console.log(`클라이언트 연결 끊김 (IP: ${clientIP}):`, socket.id);
    });
  });
};
