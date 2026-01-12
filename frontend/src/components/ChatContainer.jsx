import React from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatContainer = ({
  messages,
  onSendMessage,
  isStreaming,
  isConnected,
  formatTime,
  messagesEndRef,
  inputRef,
}) => {
  return (
    <div className="chat-container">
      <MessageList
        messages={messages}
        formatTime={formatTime}
        messagesEndRef={messagesEndRef}
      />
      <MessageInput
        onSendMessage={onSendMessage}
        isStreaming={isStreaming}
        isConnected={isConnected}
        inputRef={inputRef}
      />
    </div>
  );
};

export default ChatContainer;
