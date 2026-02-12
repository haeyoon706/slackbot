/**
 * 점심 메뉴 결정 봇 (버전 2)
 *
 * - /lunch2 → 모달(메뉴 4개 + 투표 시간 선택)
 * - 1인 1표 (다른 메뉴 클릭 시 투표 변경)
 * - 실시간 투표 현황 업데이트
 * - 투표 시간 종료 후 룰렛 애니메이션 → 최종 발표
 */

// pollId → { menus, votes: { menu: userId[] }, voters, messageTs, channel, duration }
const polls = new Map();

function createVoteBlocks(pollId, menus, votes) {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🍽️ 오늘 점심 뭐 먹을까요?",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*버튼을 눌러 원하는 메뉴에 투표하세요!*",
      },
    },
    { type: "divider" },
  ];

  menus.forEach((menu) => {
    const voteCount = votes[menu]?.length || 0;
    const voters = votes[menu]?.map((v) => `<@${v}>`).join(", ") || "아직 투표 없음";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*${menu}* (${voteCount}표)\n` +
          (voteCount > 0 ? `투표자: ${voters}` : "_아직 투표한 사람이 없어요_"),
      },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "투표", emoji: true },
        value: `${pollId}:${menu}`,
        action_id: "lunch2_vote_button",
      },
    });
  });

  blocks.push(
    { type: "divider" },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "💡 _한 번만 투표할 수 있어요. 다른 메뉴를 누르면 투표가 변경됩니다._",
        },
      ],
    }
  );

  return blocks;
}

async function endVote(client, pollId) {
  const poll = polls.get(pollId);
  if (!poll) return;

  let maxVotes = 0;
  let winners = [];

  Object.entries(poll.votes).forEach(([menu, voters]) => {
    if (voters.length > maxVotes) {
      maxVotes = voters.length;
      winners = [menu];
    } else if (voters.length === maxVotes && voters.length > 0) {
      winners.push(menu);
    }
  });

  let finalMenu;
  if (winners.length === 0) {
    finalMenu = poll.menus[Math.floor(Math.random() * poll.menus.length)];
  } else if (winners.length === 1) {
    finalMenu = winners[0];
  } else {
    finalMenu = winners[Math.floor(Math.random() * winners.length)];
  }

  // 룰렛 애니메이션 (6단계, 500ms 간격)
  const rouletteSteps = 6;
  for (let i = 0; i < rouletteSteps; i++) {
    const currentMenu = poll.menus[i % poll.menus.length];
    try {
      await client.chat.update({
        channel: poll.channel,
        ts: poll.messageTs,
        text: "🎰 룰렛 돌리는 중...",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🎰 룰렛 돌리는 중...",
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*>>> ${currentMenu} <<<*`,
            },
          },
        ],
      });
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error("룰렛 애니메이션 오류:", err);
    }
  }

  // 최종 결과 발표
  const resultBlocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎉 투표 결과 발표!",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*오늘 점심은...*\n\n>>> 🍽️ *${finalMenu}* 🍽️`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          "*투표 결과:*\n" +
          Object.entries(poll.votes)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([menu, voters]) => `• ${menu}: ${voters.length}표`)
            .join("\n"),
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `총 ${poll.voters.size}명이 투표에 참여했습니다. 맛있게 드세요! 😋`,
        },
      ],
    },
  ];

  try {
    await client.chat.update({
      channel: poll.channel,
      ts: poll.messageTs,
      text: `🎉 오늘 점심은 ${finalMenu}!`,
      blocks: resultBlocks,
    });
    polls.delete(pollId);
  } catch (err) {
    console.error("결과 발표 오류:", err);
  }
}

export function register(app) {
  // 1. /lunch2 → 메뉴 등록 모달
  app.command("/lunch2", async ({ ack, body, client }) => {
    await ack();
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "lunch2_menu_modal",
          private_metadata: body.channel_id ?? "",
          title: { type: "plain_text", text: "점심 메뉴 등록" },
          submit: { type: "plain_text", text: "투표 시작" },
          close: { type: "plain_text", text: "취소" },
          blocks: [
            {
              type: "input",
              block_id: "menu_1",
              label: { type: "plain_text", text: "메뉴 1" },
              element: {
                type: "plain_text_input",
                action_id: "menu_input_1",
                placeholder: { type: "plain_text", text: "예: 삼겹살" },
              },
            },
            {
              type: "input",
              block_id: "menu_2",
              label: { type: "plain_text", text: "메뉴 2" },
              element: {
                type: "plain_text_input",
                action_id: "menu_input_2",
                placeholder: { type: "plain_text", text: "예: 짜장면" },
              },
            },
            {
              type: "input",
              block_id: "menu_3",
              label: { type: "plain_text", text: "메뉴 3" },
              optional: true,
              element: {
                type: "plain_text_input",
                action_id: "menu_input_3",
                placeholder: { type: "plain_text", text: "예: 김치찌개" },
              },
            },
            {
              type: "input",
              block_id: "menu_4",
              label: { type: "plain_text", text: "메뉴 4" },
              optional: true,
              element: {
                type: "plain_text_input",
                action_id: "menu_input_4",
                placeholder: { type: "plain_text", text: "예: 햄버거" },
              },
            },
            {
              type: "input",
              block_id: "vote_duration",
              label: { type: "plain_text", text: "투표 시간" },
              element: {
                type: "static_select",
                action_id: "duration_select",
                placeholder: { type: "plain_text", text: "투표 시간 선택" },
                options: [
                  { text: { type: "plain_text", text: "5분" }, value: "5" },
                  { text: { type: "plain_text", text: "10분" }, value: "10" },
                  { text: { type: "plain_text", text: "15분" }, value: "15" },
                  { text: { type: "plain_text", text: "30분" }, value: "30" },
                ],
                initial_option: { text: { type: "plain_text", text: "10분" }, value: "10" },
              },
            },
          ],
        },
      });
    } catch (err) {
      console.error("lunch2 modal 오류:", err);
    }
  });

  // 2. 모달 제출 → 투표 메시지 게시
  app.view("lunch2_menu_modal", async ({ ack, view, client }) => {
    await ack();

    const values = view.state.values;
    const menus = [];

    for (let i = 1; i <= 4; i++) {
      const menuValue = values[`menu_${i}`]?.[`menu_input_${i}`]?.value;
      if (menuValue?.trim()) {
        menus.push(menuValue.trim());
      }
    }

    if (menus.length < 2) return;

    const durationSelect = values.vote_duration?.duration_select?.selected_option?.value;
    const duration = parseInt(durationSelect ?? "10", 10) * 60 * 1000;
    const channelId = view.private_metadata || "";

    if (!channelId) return;

    const pollId = `poll_${Date.now()}`;
    const votes = menus.reduce((acc, m) => ({ ...acc, [m]: [] }), {});

    polls.set(pollId, {
      menus,
      votes,
      voters: new Set(),
      messageTs: null,
      channel: channelId,
      duration,
    });

    const blocks = createVoteBlocks(pollId, menus, votes);

    try {
      const result = await client.chat.postMessage({
        channel: channelId,
        text: "🍽️ 오늘 점심 메뉴를 투표로 결정해요!",
        blocks,
      });

      polls.get(pollId).messageTs = result.ts;
      polls.get(pollId).channel = result.channel;

      setTimeout(() => endVote(client, pollId), duration);
    } catch (err) {
      console.error("lunch2 메시지 전송 오류:", err);
    }
  });

  // 3. 투표 버튼 클릭
  app.action("lunch2_vote_button", async ({ ack, body, client }) => {
    await ack();

    const [pollId, selectedMenu] = body.actions[0].value.split(":");
    const poll = polls.get(pollId);
    if (!poll) return;

    const userId = body.user.id;

    Object.keys(poll.votes).forEach((menu) => {
      poll.votes[menu] = poll.votes[menu].filter((v) => v !== userId);
    });
    poll.votes[selectedMenu].push(userId);
    poll.voters.add(userId);

    const blocks = createVoteBlocks(pollId, poll.menus, poll.votes);

    try {
      await client.chat.update({
        channel: poll.channel,
        ts: poll.messageTs,
        text: "🍽️ 오늘 점심 메뉴를 투표로 결정해요!",
        blocks,
      });
    } catch (err) {
      console.error("lunch2 메시지 업데이트 오류:", err);
    }
  });
}
