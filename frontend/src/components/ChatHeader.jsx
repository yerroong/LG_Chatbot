import React from "react";

const ChatHeader = ({
  isConnected,
  messagesCount,
  onClearConversation,
  isStreaming,
}) => {
  return (
    <header className="app-header">
      <div>
        <h1>📱 통신사 요금제 추천 챗봇</h1>
        <small style={{ opacity: 0.8 }}>
          {isConnected ? "🟢 연결됨" : "🔴 연결 끊김"}
          {messagesCount > 0 && <span> | 📃 {messagesCount}개 메시지</span>}
        </small>
      </div>
      <button
        className="clear-btn"
        onClick={onClearConversation}
        disabled={isStreaming || !isConnected}
      >
        대화 초기화
      </button>
    </header>
  );
};

export default ChatHeader;
