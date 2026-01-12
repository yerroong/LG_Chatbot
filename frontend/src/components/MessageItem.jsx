import React from "react";

const MessageItem = ({ message, formatTime }) => {
  return (
    <div
      className={`message ${message.role} ${
        message.isStreaming ? "streaming" : ""
      } ${message.isTemp ? "temp" : ""}`}
    >
      <div className="message-content">
        {message.content}
        {message.isStreaming && <span className="typing-indicator">★</span>}
      </div>
      <div className="message-time">
        {formatTime(message.timestamp)}
        {message.isTemp && <span className="temp-indicator">전송중</span>}
      </div>
    </div>
  );
};

export default MessageItem;
