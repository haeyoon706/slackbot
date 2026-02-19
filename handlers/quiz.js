/**
 * 퀴즈 봇
 *
 * - /quiz → 랜덤 퀴즈 출제 (4지선다 버튼)
 * - 답 버튼 클릭 → 정답/오답 판정 + 해설
 * - 오늘의 점수 누적 표시
 * - 다음 문제 버튼으로 연속 플레이
 * - 전체 문제를 다 풀면 풀(pool) 초기화
 */

const QUESTIONS = [
  {
    q: "1GB는 몇 MB일까요?",
    choices: ["1000 MB", "1024 MB", "512 MB", "2048 MB"],
    answer: 1,
    explanation: "1GB = 2¹⁰ MB = 1024 MB 입니다. (1000 MB는 SI 단위인 1 GiB 기준)",
  },
  {
    q: "세계에서 가장 높은 산은?",
    choices: ["K2", "칸첸중가", "에베레스트", "로체"],
    answer: 2,
    explanation: "에베레스트(8,849m)는 해발 기준 세계에서 가장 높은 산입니다.",
  },
  {
    q: "HTML의 풀 네임은?",
    choices: [
      "Hyper Tool Markup Language",
      "HyperText Markup Language",
      "High Text Making Language",
      "HyperText Making Logic",
    ],
    answer: 1,
    explanation: "HTML = HyperText Markup Language. 웹 페이지 구조를 정의하는 언어입니다.",
  },
  {
    q: "빛의 속도는 약 초속 몇 km일까요?",
    choices: ["30,000 km", "300,000 km", "3,000,000 km", "3,000 km"],
    answer: 1,
    explanation: "빛의 속도는 약 299,792 km/s ≈ 초속 30만 km입니다.",
  },
  {
    q: "세계 최초의 프로그래머로 알려진 인물은?",
    choices: ["앨런 튜링", "빌 게이츠", "에이다 러브레이스", "찰스 배비지"],
    answer: 2,
    explanation:
      "에이다 러브레이스(Ada Lovelace)는 세계 최초의 프로그래머로 불리며, 해석 기관용 알고리즘을 작성했습니다.",
  },
  {
    q: "태양계에서 가장 큰 행성은?",
    choices: ["토성", "목성", "천왕성", "해왕성"],
    answer: 1,
    explanation:
      "목성은 태양계에서 가장 큰 행성으로, 지구 부피의 약 1321배에 달합니다.",
  },
  {
    q: "한국에서 처음 발명된 것은?",
    choices: ["나침반", "종이", "금속활자", "화약"],
    answer: 2,
    explanation:
      "고려시대에 세계 최초로 금속활자를 발명했습니다. 현존 최고(最古)의 금속활자 인쇄본은 직지심체요절(1377년)입니다.",
  },
  {
    q: "다음 중 컴파일 언어가 아닌 것은?",
    choices: ["C", "C++", "Python", "Go"],
    answer: 2,
    explanation:
      "Python은 인터프리터 언어입니다. 소스코드를 바로 실행하며 별도의 컴파일 과정이 없습니다.",
  },
  {
    q: "사람 몸에 있는 뼈의 개수는?",
    choices: ["196개", "206개", "216개", "186개"],
    answer: 1,
    explanation:
      "성인 인체에는 206개의 뼈가 있습니다. 신생아는 약 270~300개이지만 성장하면서 합쳐집니다.",
  },
  {
    q: "지구에서 달까지의 평균 거리는 약?",
    choices: ["38만 km", "150만 km", "8만 km", "580만 km"],
    answer: 0,
    explanation:
      "지구와 달의 평균 거리는 약 384,400km ≈ 38만 km입니다.",
  },
  {
    q: "HTTP 상태 코드 404의 의미는?",
    choices: ["서버 오류", "요청 성공", "찾을 수 없음", "권한 없음"],
    answer: 2,
    explanation:
      "404 Not Found — 요청한 리소스를 서버에서 찾을 수 없을 때 반환하는 상태 코드입니다.",
  },
  {
    q: "세계에서 가장 많이 사용되는 오픈소스 버전 관리 시스템은?",
    choices: ["SVN", "Mercurial", "Git", "CVS"],
    answer: 2,
    explanation:
      "Git은 리누스 토르발스가 2005년에 만든 분산 버전 관리 시스템으로, 현재 가장 널리 사용됩니다.",
  },
  {
    q: "커피의 원산지로 알려진 나라는?",
    choices: ["브라질", "콜롬비아", "에티오피아", "베트남"],
    answer: 2,
    explanation:
      "커피는 에티오피아 카파(Kaffa) 지역에서 유래한 것으로 알려져 있습니다.",
  },
  {
    q: "이진수(Binary) 1010을 십진수로 변환하면?",
    choices: ["8", "10", "12", "14"],
    answer: 1,
    explanation:
      "1010₂ = 1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8 + 0 + 2 + 0 = 10",
  },
  {
    q: "세계에서 가장 인구가 많은 나라는? (2024 기준)",
    choices: ["중국", "인도", "미국", "인도네시아"],
    answer: 1,
    explanation:
      "2023년부터 인도가 약 14억 2천만 명으로 중국을 넘어 세계 1위 인구 대국이 되었습니다.",
  },
  {
    q: "DNS의 역할은?",
    choices: [
      "파일을 암호화한다",
      "도메인 이름을 IP 주소로 변환한다",
      "웹 페이지를 렌더링한다",
      "네트워크 속도를 높인다",
    ],
    answer: 1,
    explanation:
      "DNS(Domain Name System)는 google.com 같은 도메인 이름을 IP 주소로 변환하는 인터넷 전화번호부 역할을 합니다.",
  },
  {
    q: "한국 최초의 한글 소설로 알려진 작품은?",
    choices: ["춘향전", "심청전", "홍길동전", "흥부전"],
    answer: 2,
    explanation:
      "홍길동전은 허균이 17세기 초에 쓴 것으로 추정되는 한국 최초의 한글 소설입니다.",
  },
  {
    q: "소수(Prime Number)가 아닌 것은?",
    choices: ["7", "11", "13", "1"],
    answer: 3,
    explanation:
      "1은 소수가 아닙니다. 소수는 1과 자기 자신으로만 나누어 떨어지는 1보다 큰 자연수입니다.",
  },
  {
    q: "가장 오래된 프로그래밍 언어 중 하나인 FORTRAN이 개발된 해는?",
    choices: ["1945년", "1957년", "1969년", "1972년"],
    answer: 1,
    explanation:
      "FORTRAN(FORmula TRANslation)은 IBM에서 1957년에 발표한 세계 최초의 고급 프로그래밍 언어 중 하나입니다.",
  },
  {
    q: "TCP/IP에서 TCP가 보장하는 것은?",
    choices: [
      "빠른 전송 속도",
      "데이터의 신뢰성 있는 전달",
      "데이터 암호화",
      "무선 연결",
    ],
    answer: 1,
    explanation:
      "TCP(Transmission Control Protocol)는 패킷의 순서 보장, 손실 재전송, 흐름 제어를 통해 신뢰성 있는 데이터 전달을 보장합니다.",
  },
];

const LABELS = ["A", "B", "C", "D"];

// userId → { correct, total, usedIndices: Set<number> }
const userStates = new Map();

function getUserState(userId) {
  if (!userStates.has(userId)) {
    userStates.set(userId, { correct: 0, total: 0, usedIndices: new Set() });
  }
  return userStates.get(userId);
}

function pickQuestion(userId) {
  const state = getUserState(userId);

  // 전부 풀었으면 초기화
  if (state.usedIndices.size >= QUESTIONS.length) {
    state.usedIndices.clear();
  }

  const remaining = QUESTIONS.map((_, i) => i).filter(
    (i) => !state.usedIndices.has(i)
  );
  const idx = remaining[Math.floor(Math.random() * remaining.length)];
  state.usedIndices.add(idx);
  return idx;
}

function buildQuestionBlocks(userId, qIdx) {
  const q = QUESTIONS[qIdx];
  const state = getUserState(userId);
  const remaining = QUESTIONS.length - state.usedIndices.size;

  return [
    {
      type: "header",
      text: { type: "plain_text", text: "🧠 퀴즈 타임!" },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${q.q}*` },
    },
    {
      type: "actions",
      block_id: `quiz_choices_${qIdx}`,
      elements: q.choices.map((choice, i) => ({
        type: "button",
        text: { type: "plain_text", text: `${LABELS[i]}. ${choice}` },
        action_id: `quiz_answer_${i}`,
        value: `${qIdx}:${i}`,
      })),
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `📊 오늘 점수: ${state.correct}/${state.total} · 남은 문제: ${remaining}개`,
        },
      ],
    },
  ];
}

function buildResultBlocks(userId, qIdx, chosenIdx) {
  const q = QUESTIONS[qIdx];
  const state = getUserState(userId);
  const isCorrect = chosenIdx === q.answer;

  const choiceLines = q.choices
    .map((choice, i) => {
      if (i === q.answer && i === chosenIdx) return `✅ *${LABELS[i]}. ${choice}* ← 정답!`;
      if (i === q.answer) return `✅ *${LABELS[i]}. ${choice}* ← 정답`;
      if (i === chosenIdx) return `❌ ~~${LABELS[i]}. ${choice}~~`;
      return `　 ${LABELS[i]}. ${choice}`;
    })
    .join("\n");

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: isCorrect ? "🎉 정답입니다!" : "😢 오답입니다!",
      },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${q.q}*\n\n${choiceLines}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `💡 *해설:* ${q.explanation}` },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `📊 *오늘의 점수: ${state.correct}/${state.total}* (${
          state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0
        }%)`,
      },
    },
    {
      type: "actions",
      block_id: "quiz_next_actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "➡️ 다음 문제" },
          action_id: "quiz_next",
          style: "primary",
        },
      ],
    },
  ];
}

export function register(app) {
  // /quiz → 문제 출제
  app.command("/quiz", async ({ ack, client, command }) => {
    await ack();

    const userId = command.user_id;
    const qIdx = pickQuestion(userId);

    await client.chat.postMessage({
      channel: command.channel_id,
      text: "퀴즈 문제가 출제됐습니다!",
      blocks: buildQuestionBlocks(userId, qIdx),
    });
  });

  // 답 버튼 클릭
  const handleAnswer = async ({ ack, client, body }) => {
    await ack();

    const userId = body.user.id;
    const [qIdxStr, chosenIdxStr] = body.actions[0].value.split(":");
    const qIdx = parseInt(qIdxStr);
    const chosenIdx = parseInt(chosenIdxStr);
    const isCorrect = chosenIdx === QUESTIONS[qIdx].answer;

    const state = getUserState(userId);
    state.total += 1;
    if (isCorrect) state.correct += 1;

    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: isCorrect ? "정답!" : "오답!",
      blocks: buildResultBlocks(userId, qIdx, chosenIdx),
    });
  };

  // 보기 버튼 4개 등록 (A, B, C, D)
  for (let i = 0; i < 4; i++) {
    app.action(`quiz_answer_${i}`, handleAnswer);
  }

  // 다음 문제 버튼
  app.action("quiz_next", async ({ ack, client, body }) => {
    await ack();

    const userId = body.user.id;
    const qIdx = pickQuestion(userId);

    await client.chat.postMessage({
      channel: body.channel.id,
      text: "다음 퀴즈 문제입니다!",
      blocks: buildQuestionBlocks(userId, qIdx),
    });
  });
}
