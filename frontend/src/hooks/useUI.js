import { useEffect, useRef } from "react";

export const useUI = (messages, streamingMessage, isStreaming, isConnected) => {
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  // 메시지 목록 끝으로 스크롤
  const scrollToBottom = () => {
    try {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("스크롤 오류:", error);
    }
  };

  // 메시지 (사용자)나 스트리밍 메시지 (openai) 변경 시 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 스트리밍 완료 후 입력창에 포커스
  useEffect(() => {
    if (!isStreaming && isConnected) {
      setTimeout(() => {
        try {
          inputRef.current?.focus();
        } catch (error) {
          console.error("포커스 오류:", error);
        }
      }, 300);
    }
  }, [isStreaming, isConnected]);

  // 메시지 시간 포맷팅
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("시간 포맷팅 오류:", error);
      return new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return {
    messageEndRef,
    inputRef,
    formatTime,
    scrollToBottom,
  };
};
