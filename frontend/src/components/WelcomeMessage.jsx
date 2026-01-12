import React from "react";

const WelcomeMessage = () => {
  return (
    <div className="welcome-message">
      <h2>안녕하세요!</h2>
      <p>저는 통신사 요금제 추천을 도와드리는 AI 어시스턴트입니다.</p>
      <p>사용 패턴이나 예산에 맞는 최적의 요금제를 찾아드릴게요!</p>

      <div className="session-info">
        <p>
          <strong>자동 대화 저장 : </strong> 새로고침해도 대화가 유지됩니다
        </p>
        <p>
          대화를 완전히 새로 시작하시려면 상단의 "대화 초기화" 버튼을 눌러주세요
        </p>
      </div>

      <div className="example-questions">
        <p>이런 질문들을 해보세요!</p>
        <ul>
          <li>"월 5만원 이하로 데이터 많이 쓸 수 있는 요금제 있나요?"</li>
          <li>"영상 시청을 자주 해요. 어떤 요즘게자 좋을까요?</li>
          <li>"가족 4명이 함께 쓸 수 있는 요금제가 있나요?</li>
          <li>
            "해외 여행을 자주 가는데 로밍 서비스가 포함된 요금제가 있나요?
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeMessage;
