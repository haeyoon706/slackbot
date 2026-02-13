/**
 * 가위바위보 PvP 대결 게임
 *
 * - /rps → 채널에 대결 카드 게시 (가위/바위/보 버튼)
 * - 첫 번째 유저가 선택 → 선택 숨김, 대결 상대 대기
 * - 두 번째 유저가 선택 → "가위... 바위... 보!" 카운트다운 애니메이션
 * - 결과 공개 + 승패 판정
 */

const games = new Map();

const CHOICES = {
  scissors: { emoji: "✌️", name: "가위" },
  rock: { emoji: "✊", name: "바위" },
  paper: { emoji: "✋", name: "보" },
};

const WIN_DESCRIPTIONS = {
  "rock:scissors": "바위가 가위를 으스러뜨렸습니다! 💥",
  "scissors:paper": "가위가 보를 싹둑 잘랐습니다! ✂️",
  "paper:rock": "보자기가 바위를 덮어버렸습니다! 📄",
};

function getResult(choice1, choice2) {
  if (choice1 === choice2) return "draw";
  if (
    (choice1 === "rock" && choice2 === "scissors") ||
    (choice1 === "scissors" && choice2 === "paper") ||
    (choice1 === "paper" && choice2 === "rock")
  ) {
    return "player1";
  }
  return "player2";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function gameKey(channelId, messageTs) {
  return `${channelId}:${messageTs}`;
}

export function register(app) {
  // /rps → 대결 카드 게시
  app.command("/rps", async ({ ack, client, command }) => {
    await ack();

    const result = await client.chat.postMessage({
      channel: command.channel_id,
      text: "가위바위보 대결!",
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "🎮 가위바위보 대결!" },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "버튼을 눌러 선택하세요!\n두 명이 선택하면 결과가 공개됩니다. 🤫",
          },
        },
        {
          type: "actions",
          block_id: "rps_actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "✌️ 가위" },
              action_id: "rps_scissors",
              value: "scissors",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "✊ 바위" },
              action_id: "rps_rock",
              value: "rock",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "✋ 보" },
              action_id: "rps_paper",
              value: "paper",
            },
          ],
        },
      ],
    });

    games.set(gameKey(command.channel_id, result.ts), {
      channelId: command.channel_id,
      messageTs: result.ts,
      players: [],
      status: "waiting",
    });
  });

  // 가위/바위/보 버튼 핸들러
  const handleChoice = async ({ ack, client, body }) => {
    await ack();

    const channelId = body.channel.id;
    const messageTs = body.message.ts;
    const key = gameKey(channelId, messageTs);
    const game = games.get(key);

    if (!game || game.status === "finished") return;

    const userId = body.user.id;
    const choice = body.actions[0].value;

    // 이미 참가한 유저 → 선택 변경
    const existing = game.players.find((p) => p.userId === userId);
    if (existing) {
      existing.choice = choice;
      return;
    }

    // 새 플레이어 추가
    game.players.push({ userId, choice });

    // 첫 번째 플레이어 → 대기 상태
    if (game.players.length === 1) {
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: "가위바위보 대결!",
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🎮 가위바위보 대결!" },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${userId}> 준비 완료! ✅\n대결 상대를 기다리는 중...`,
            },
          },
          {
            type: "actions",
            block_id: "rps_actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "✌️ 가위" },
                action_id: "rps_scissors",
                value: "scissors",
                style: "primary",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "✊ 바위" },
                action_id: "rps_rock",
                value: "rock",
                style: "primary",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "✋ 보" },
                action_id: "rps_paper",
                value: "paper",
                style: "primary",
              },
            ],
          },
        ],
      });
      return;
    }

    // 두 번째 플레이어 → 애니메이션 + 결과 공개!
    game.status = "finished";
    const [p1, p2] = game.players;

    // 카운트다운: 가위... 바위... 보!
    const countdown = [
      { text: "가위 ...", emoji: "✌️" },
      { text: "바위 ...", emoji: "✊" },
      { text: "보 !!!", emoji: "✋" },
    ];

    for (const frame of countdown) {
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: "가위바위보!",
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🎮 가위바위보 대결!" },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${p1.userId}>  vs  <@${p2.userId}>`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\n${frame.emoji}  *${frame.text}*`,
            },
          },
        ],
      });
      await sleep(700);
    }

    // 셔플 애니메이션
    const allEmojis = ["✌️", "✊", "✋"];
    for (let i = 0; i < 3; i++) {
      const r1 = allEmojis[Math.floor(Math.random() * 3)];
      const r2 = allEmojis[Math.floor(Math.random() * 3)];
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: "가위바위보!",
        blocks: [
          {
            type: "header",
            text: { type: "plain_text", text: "🎮 가위바위보 대결!" },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${p1.userId}>  ${r1}    vs    ${r2}  <@${p2.userId}>`,
            },
          },
        ],
      });
      await sleep(300);
    }

    // 결과 판정
    const result = getResult(p1.choice, p2.choice);
    const c1 = CHOICES[p1.choice];
    const c2 = CHOICES[p2.choice];

    let resultEmoji, resultText, descText;

    if (result === "draw") {
      resultEmoji = "🤝";
      resultText = "무승부!";
      descText = "앗, 비겼습니다! 다시 한판?!";
    } else {
      const winner = result === "player1" ? p1 : p2;
      const winnerChoice = result === "player1" ? p1.choice : p2.choice;
      const loserChoice = result === "player1" ? p2.choice : p1.choice;
      resultEmoji = "🏆";
      resultText = `<@${winner.userId}> 승리!`;
      descText = WIN_DESCRIPTIONS[`${winnerChoice}:${loserChoice}`];
    }

    // 최종 결과 공개
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: `가위바위보 결과: ${resultText}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `${resultEmoji} 가위바위보 결과!` },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${p1.userId}>  ${c1.emoji} *${c1.name}*    vs    *${c2.name}* ${c2.emoji}  <@${p2.userId}>`,
          },
        },
        { type: "divider" },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*${descText}*` },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "다시 하려면 `/rps` 를 입력하세요!",
            },
          ],
        },
      ],
    });

    games.delete(key);
  };

  app.action("rps_scissors", handleChoice);
  app.action("rps_rock", handleChoice);
  app.action("rps_paper", handleChoice);
}
