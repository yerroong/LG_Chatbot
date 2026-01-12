import React from "react";

const LoadingScreen = () => {
  return (
    <div className="App">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>이전 대화를 불러오는 중...</p>
        <small style={{ marginTop: "1rem", opacity: 0.7 }}>
          연결이 오래 걸리면 자동으로 진행됩니다
        </small>
      </div>
    </div>
  );
};

export default LoadingScreen;
