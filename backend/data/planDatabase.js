export const planDatabase = {
  plans: [
    {
      name: "5G 프리미엄",
      data: "무제한",
      call: "무제한",
      price: 89000,
      features: ["고화질 스트리밍", "5G 속도", "해외 로밍 포함"],
    },
    {
      name: "5G 스탠다드",
      data: "110GB",
      call: "무제한",
      price: 69000,
      features: ["5G 속도", "초과 시 3Mbps"],
    },
    {
      name: "LTE 베이직",
      data: "10GB",
      call: "200분",
      price: 35000,
      features: ["LTE 속도", "문자 무제한"],
    },
    {
      name: "데이터 중심형",
      data: "50GB",
      call: "100분",
      price: 45000,
      features: ["영상 스트리밍 최적화", "SNS 무제한"],
    },
  ],
};

export const systemPrompt = `당신은 친절한 통신사 요금제 추천 전문가입니다. 
사용자의 통신 사용 패턴과 요구사항을 분석하여 최적의 요금제를 추천해주세요.

사용 가능한 요금제 정보:
${JSON.stringify(planDatabase.plans, null, 2)}

추천 시 고려사항:
1. 사용자의 데이터 사용량 (영상 시청, SNS, 웹서핑 등)
2. 통화 사용량
3. 예산
4. 특별한 요구사항 (해외 로밍, 가족 결합 등)

자연스럽고 친근한 톤으로 대화하며, 추천 이유를 명확히 설명해주세요.`;
