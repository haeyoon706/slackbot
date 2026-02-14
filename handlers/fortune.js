/**
 * 오늘의 운세 봇
 *
 * - /fortune → 수정구슬 애니메이션 후 운세 공개
 * - 종합운 / 연애운 / 금전운 / 업무운 별점
 * - 행운의 숫자, 색, 음식
 * - 오늘의 조언
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 가중치 랜덤: 중간값이 더 자주 나오도록
function randomStars() {
  const weights = [5, 15, 35, 30, 15]; // 1~5성 확률
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i + 1;
  }
  return 3;
}

function starsText(n) {
  return "⭐".repeat(n) + "\u2009".repeat(5 - n);
}

const LABELS = {
  1: "흉 😰",
  2: "소흉 😟",
  3: "보통 😐",
  4: "길 😊",
  5: "대길 🤩",
};

const COLORS = [
  "빨간색 🔴",
  "주황색 🟠",
  "노란색 🟡",
  "초록색 🟢",
  "파란색 🔵",
  "보라색 🟣",
  "분홍색 💗",
  "흰색 ⚪",
  "금색 ✨",
];

const FOODS = [
  "치킨 🍗",
  "피자 🍕",
  "삼겹살 🥓",
  "초밥 🍣",
  "파스타 🍝",
  "짜장면 🥡",
  "떡볶이 🌶️",
  "김밥 🍙",
  "햄버거 🍔",
  "라멘 🍜",
  "카레 🍛",
  "샐러드 🥗",
  "스테이크 🥩",
  "칼국수 🍲",
  "타코야키 🐙",
];

const ADVICE = [
  "오늘은 과감한 결정이 좋은 결과를 가져올 것입니다.",
  "주변 사람들에게 감사를 표현해보세요.",
  "점심은 든든하게 먹는 것이 행운을 부릅니다.",
  "오후에 예상치 못한 좋은 소식이 올 수 있습니다.",
  "오늘은 새로운 것을 배우기 좋은 날입니다.",
  "잠시 산책하며 머리를 식히면 좋은 아이디어가 떠오릅니다.",
  "오늘 만나는 사람이 중요한 인연이 될 수 있습니다.",
  "급하게 서두르지 마세요. 천천히 가면 더 멀리 갑니다.",
  "커피 한 잔의 여유가 오늘 하루를 바꿀 수 있습니다.",
  "오늘은 평소 미뤄뒀던 일을 시작하기 좋은 날입니다.",
  "작은 변화가 큰 행운을 부를 수 있습니다.",
  "직감을 믿으세요. 오늘은 직감이 잘 맞는 날입니다.",
  "웃는 얼굴에 복이 온다! 오늘 하루 활짝 웃어보세요.",
  "무리하지 말고 충분히 쉬는 것도 실력입니다.",
  "오늘은 팀원에게 칭찬 한마디 건네보세요.",
];

const LOADING_FRAMES = [
  { emoji: "🔮", text: "수정구슬을 들여다보는 중" },
  { emoji: "✨", text: "별자리를 읽는 중" },
  { emoji: "🌙", text: "운명의 흐름을 해석하는 중" },
  { emoji: "🃏", text: "운세 카드를 뒤집는 중" },
];

export function register(app) {
  app.command("/fortune", async ({ ack, client, command }) => {
    await ack();

    const userId = command.user_id;

    // 초기 메시지
    const msg = await client.chat.postMessage({
      channel: command.channel_id,
      text: "운세를 확인하는 중...",
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: "🔮 *운세를 준비하고 있습니다...*" },
        },
      ],
    });

    // 로딩 애니메이션
    for (const frame of LOADING_FRAMES) {
      await sleep(700);
      const dots = ".".repeat(Math.floor(Math.random() * 3) + 1);
      await client.chat.update({
        channel: command.channel_id,
        ts: msg.ts,
        text: "운세를 확인하는 중...",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${frame.emoji} *${frame.text}${dots}*`,
            },
          },
        ],
      });
    }

    await sleep(500);

    // 운세 생성
    const overall = randomStars();
    const love = randomStars();
    const money = randomStars();
    const work = randomStars();
    const luckyNumber = Math.floor(Math.random() * 99) + 1;
    const luckyColor = pick(COLORS);
    const luckyFood = pick(FOODS);
    const advice = pick(ADVICE);

    const avg = (overall + love + money + work) / 4;
    let summaryEmoji;
    if (avg >= 4) summaryEmoji = "🌟";
    else if (avg >= 3) summaryEmoji = "☀️";
    else if (avg >= 2) summaryEmoji = "🌤️";
    else summaryEmoji = "🌧️";

    // 결과 공개
    await client.chat.update({
      channel: command.channel_id,
      ts: msg.ts,
      text: `오늘의 운세 — ${LABELS[overall]}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${summaryEmoji} 오늘의 운세`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `<@${userId}>님의 운세`,
            },
          ],
        },
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `*종합운*\u2003${starsText(overall)}\u2003${LABELS[overall]}`,
              `*연애운*\u2003${starsText(love)}\u2003${LABELS[love]}`,
              `*금전운*\u2003${starsText(money)}\u2003${LABELS[money]}`,
              `*업무운*\u2003${starsText(work)}\u2003${LABELS[work]}`,
            ].join("\n"),
          },
        },
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `🔢  *행운의 숫자*\u2003${luckyNumber}`,
              `🎨  *행운의 색*\u2003\u2003${luckyColor}`,
              `🍽️  *행운의 음식*\u2003${luckyFood}`,
            ].join("\n"),
          },
        },
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `💬 _"${advice}"_`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "다시 보려면 `/fortune` 을 입력하세요!",
            },
          ],
        },
      ],
    });
  });
}
