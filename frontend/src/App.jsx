import "./App.css";
import { useSocket } from "./hooks/useSocket.js";
import { useChat } from "./hooks/useChat.js";
import { useUI } from "./hooks/useUI.js";
import LoadingScreen from "./components/LoadingScreen";
import ChatHeader from "./components/ChatHeader";
import ChatContainer from "./components/ChatContainer";

function App() {
  // 커스텀 훅들
  const { socket, isConnected, isLoadingHistory } = useSocket();
  const { messages, isStreaming, sendMessage, clearConversation } = useChat(
    socket,
    isConnected
  );
  const { messagesEndRef, inputRef, formatTime } = useUI(
    messages,
    "",
    isStreaming,
    isConnected
  );

  // 로딩 상태 표시
  if (isLoadingHistory) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <ChatHeader
        isConnected={isConnected}
        messagesCount={messages.length}
        onClearConversation={clearConversation}
        isStreaming={isStreaming}
      />
      <ChatContainer
        messages={messages}
        onSendMessage={sendMessage}
        isStreaming={isStreaming}
        isConnected={isConnected}
        formatTime={formatTime}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
      />
    </div>
  );
}

export default App;
