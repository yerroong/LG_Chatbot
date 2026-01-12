import React from "react";
import { useState } from "react";

const MessageInput = ({
  onSendMessage,
  isStreaming,
  isConnected,
  inputRef,
}) => {
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isStreaming || !isConnected) {
      return;
    }

    onSendMessage(inputMessage);
    setInputMessage("");

    // 포커스 유지
    setTimeout(() => {
      try {
        inputRef.current?.focus();
      } catch (error) {
        console.error("포커스 오류:", error);
      }
    }, 100);
  };

  const getPlaceholder = () => {
    if (!isConnected) return "서버에 연결 중...";
    if (isStreaming) return "답변을 생성 중입니다...";
    return "메시지를 입력하세요...";
  };

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder={getPlaceholder()}
        className="message-input"
        disabled={isStreaming || !isConnected}
        autoFocus
      ></input>
      <button
        type="submit"
        className="send-button"
        disabled={isStreaming || !inputMessage.trim() || !isConnected}
      >
        {isStreaming ? "답변 중..." : "전송"}
      </button>
    </form>
  );
};

export default MessageInput;
