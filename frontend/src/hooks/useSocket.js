import { useState, useEffect } from "react";
import io from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    let loadingTimeout;
    let newSocket;

    try {
      // 로딩 타임아웃 설정 (15초 후 자동으로 로딩 해제)
      loadingTimeout = setTimeout(() => {
        console.log("로딩 타임아웃 - 강제로 로딩 해제");
        setIsLoadingHistory(false);
      }, 15000);

      // 소켓 연결
      newSocket = io("http://localhost:5000", {
        forceNew: true,
        reconnection: true,
        timeout: 20000,
      });

      setSocket(newSocket);

      // 연결 이벤트
      newSocket.on("connect", () => {
        console.log("소켓 ID로 서버에 연결됨:", newSocket.id);
        setIsConnected(true);

        // 연결되면 즉시 세션 초기화 요청
        console.log(" 세션 초기화 요청 전송");
        newSocket.emit("init-session");
      });

      // 연결 해제 이벤트
      newSocket.on("disconnect", () => {
        console.log("서버에서 연결이 끊겼습니다.");
        setIsConnected(false);
      });

      // 연결 에러
      newSocket.on("connect_error", (error) => {
        console.error("연결 에러 : ", error);
        setIsConnected(false);
        setIsLoadingHistory(false);
      });

      // 로딩 타임아웃 클리어
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        // 수정필요 하단
        loadingTimeout = null;
      }
      setIsLoadingHistory(false);
    } catch (error) {
      console.error("소켓 초기화 오류:", error);
      setIsLoadingHistory(false);
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      try {
        console.log("소켓 연결 정리");
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        if (newSocket) {
          newSocket.close();
        }
      } catch (error) {
        console.error("정리 중 오류:", error);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    isLoadingHistory,
  };
};
