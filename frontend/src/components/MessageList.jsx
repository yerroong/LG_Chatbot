import React from "react";
import MessageItem from "./MessageItem";
import WelcomeMessage from "./WelcomeMessage";

const MessageList = ({ messages, formatTime, messagesEndRef }) => {
  return (
    <div className="messages-container">
      {messages.length === 0 ? (
        <WelcomeMessage />
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              formatTime={formatTime}
            />
          ))}
        </>
      )}
      <div ref={messagesEndRef}></div>
    </div>
  );
};

export default MessageList;
