import { useState, useEffect, useRef } from "react";

export const useChat = (socket, isConnected) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState(null);

  // Refs
  const streamingMessageIdRef = useRef(null);

  // streamingMessageId 와 ref 동기화
  useEffect(() => {
    streamingMessageIdRef.current = streamingMessageId;
  }, [streamingMessageId]);

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return;

    // 대화 기록 수신
    const handleConversationHistory = (history) => {
      try {
        console.log("대화기록 수신:", history?.length || 0, "messages");

        if (Array.isArray(history) && history.length > 0) {
          const formattedHistory = history.map((msg, index) => ({
            role: msg.role || "user",
            content: msg.content || "",
            timestamp: msg.timestamp || new Date().toISOString(),
            id: msg._id || `msg-${Date.now()}-${index}`,
            isStreaming: false,
          }));
          setMessages(formattedHistory);
          console.log(
            "대화 복원(불러오기) 완료:",
            formattedHistory.length,
            "개"
          );
        } else {
          setMessages([]);
          console.log("새로운 대화 시작");
        }
      } catch (error) {
        console.error("대화 기록 처리 중 오류:", error);
        setMessages([]);
      }
    };

    // 사용자 메시지 확인
    const handleUserMessageConfirmed = (message) => {
      try {
        console.log("사용자 메시지 확인 : ", message);

        if (!message || !message.content) {
          console.error("잘못된 메시지 형식:", message);
          return;
        }

        const formattedMessage = {
          role: "user",
          content: message.content,
          timestamp: message.timestamp || new Date().toISOString(),
          id:
            message.id || message._id || `user-${Date.now()}-${Math.random()}`,
          isStreaming: false,
        };

        setMessages((prev) => {
          // 임시 메시지를 실제 메시지로 교체
          const updated = prev.map((msg) => {
            if (
              msg.isTemp &&
              msg.role === "user" &&
              msg.content === formattedMessage.content
            ) {
              return { ...formattedMessage, isTemp: false };
            }
            return msg;
          });

          // 교체되지 않다면 새로 추가
          const hasReplaced = updated.some(
            (msg) => msg.content === formattedMessage.content && !msg.isTemp
          );

          if (!hasReplaced) {
            updated.push(formattedMessage);
          }

          return updated;
        });
      } catch (error) {
        console.error("사용자 메시지 처리 오류 : ", error);
      }
    };

    // 스트리밍 시작
    const handleStreamStart = (data = {}) => {
      try {
        console.log("스트리밍 시작", data);
        setIsStreaming(true);
        setStreamingMessage("");

        const messageId =
          data.messageId || `temp-${Date.now()}-${Math.random()}`;
        setStreamingMessageId(messageId);

        const streamingPlaceholder = {
          id: messageId,
          role: "assistant",
          content: "",
          timestamp: data.timestamp || new Date().toISOString(),
          isStreaming: true,
        };

        setMessages((prev) => [...prev, streamingPlaceholder]);
      } catch (error) {
        console.error("스트리밍 시작 오류:", error);
      }
    };

    // 스트리밍 청크 수신
    const handleStreamChunk = (chunk) => {
      try {
        if (chunk && streamingMessageIdRef.current) {
          setStreamingMessage((prev) => prev + chunk);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("스트리밍 청크 처리 오류 : ", error);
      }
    };

    // 스트리밍 종료
    const handleStreamEnd = (data = {}) => {
      try {
        console.log("스트리밍 종료:", data);
        setIsStreaming(false);
        setStreamingMessage("");

        if (data.message && streamingMessageIdRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? {
                    ...data.message,
                    id:
                      data.message.id ||
                      data.message._id ||
                      streamingMessageIdRef.current,
                    isStreaming: false,
                  }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, isStreaming: false }
                : msg
            )
          );
        }

        setStreamingMessageId(null);
      } catch (error) {
        console.error("스트리밍 종료 처리 오류:", error);
      }
    };

    // 대화 초기화 완료
    const handleConversationCleared = () => {
      try {
        console.log("대화 초기화 완료");
        setMessages([]);
        setStreamingMessage("");
        setIsStreaming(false);
        setStreamingMessageId(null);
      } catch (error) {
        console.error("대화 초기화 처리 오류 : ", error);
      }
    };

    // 에러 처리
    const handleError = (error) => {
      console.error("소켓 에러 : ", error);

      // 에러 발생 시 모슨 스트리밍 상태 초기화
      setIsStreaming(false);
      setStreamingMessage("");
      setStreamingMessageId(null);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
    };

    // 이벤트 리스너 등록
    socket.on("conversation-history", handleConversationHistory);
    socket.on("user-message-confirmed", handleUserMessageConfirmed);
    socket.on("stream-start", handleStreamStart);
    socket.on("stream-chunk", handleStreamChunk);
    socket.on("stream-end", handleStreamEnd);
    socket.on("conversation-cleared", handleConversationCleared);
    socket.on("error", handleError);

    // 정리
    return () => {
      socket.off("conversation-history", handleConversationHistory);
      socket.off("user-message-confirmed", handleUserMessageConfirmed);
      socket.off("stream-start", handleStreamStart);
      socket.off("stream-chunk", handleStreamChunk);
      socket.off("stream-end", handleStreamEnd);
      socket.off("conversation-cleared", handleConversationCleared);
      socket.off("error", handleError);
    };
  }, [socket]);

  // 메시지 전송
  const sendMessage = (messageContent) => {
    try {
      if (!messageContent.trim() || isStreaming || !socket || !isConnected) {
        return;
      }

      const messageToSend = messageContent.trim();
      console.log("메시지 전송: ", messageToSend);

      // 임시 사용자 메시지 표시
      const tempUserMessage = {
        id: `temp-user-${Date.now()}-${Math.random()}`,
        role: "user",
        content: messageToSend,
        timestamp: new Date().toISOString(),
        isStreaming: false,
        isTemp: true,
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      socket.emit("user-message", messageToSend);
    } catch (error) {
      console.error("메시지 전송 오류:", error);
    }
  };

  // 대화 초기화
  const clearConversation = () => {
    try {
      if (window.confirm("모든 대화 내용을 삭제하시겠습니까?")) {
        console.log("대화 초기화 요청");
        socket?.emit("clear-conversation");
      }
    } catch (error) {
      console.error("대화 초기화 오류 : ", error);
    }
  };

  return {
    messages,
    isStreaming,
    streamingMessage,
    sendMessage,
    clearConversation,
  };
};
