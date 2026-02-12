/**
 * 랜덤 점심 메뉴 결정 봇
 *
 * - /lunch → 모달로 메뉴 후보 등록
 * - 제출 후 투표 버튼 + 룰렛 버튼
 * - 투표 시 실시간 메시지 업데이트
 * - 룰렛 애니메이션 후 최종 결정
 */

// key: `${channel_id}:${message_ts}` → { menus: string[], votes: Record<menu, number> }
const lunchStore = new Map();

function getStoreKey(channelId, messageTs) {
  return `${channelId}:${messageTs}`;
}

function buildVoteBlocks(channelId, messageTs, menus, votes, isRouletteDone = false) {
  const storeKey = getStoreKey(channelId, messageTs);
  const data = lunchStore.get(storeKey) ?? { menus, votes: {} };
  const currentVotes = { ...data.votes };

  const blocks = [
    { type: "section", text: { type: "mrkdwn", text: "*🍽 점심 메뉴 투표*" } },
    { type: "divider" },
  ];

  menus.forEach((menu) => {
    const count = currentVotes[menu] ?? 0;
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*${menu}* — ${count}표` },
      accessory: isRouletteDone
        ? undefined
        : {
            type: "button",
            action_id: "lunch_vote",
            text: { type: "plain_text", text: "👍 투표" },
            value: menu,
          },
    });
  });

  if (!isRouletteDone) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "actions",
      block_id: "lunch_actions",
      elements: [
        {
          type: "button",
          action_id: "lunch_roulette",
          text: { type: "plain_text", text: "🎰 룰렛 돌리기" },
          value: `${channelId}|||${messageTs}`,
          style: "primary",
        },
      ],
    });
  }

  return blocks;
}

export function register(app) {
  // 1. /lunch → 메뉴 등록 모달
  app.command("/lunch", async ({ ack, body, client }) => {
    await ack();
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "lunch_menus_submit",
          private_metadata: body.channel_id ?? "",
          title: { type: "plain_text", text: "점심 메뉴 후보 등록" },
          submit: { type: "plain_text", text: "등록" },
          close: { type: "plain_text", text: "취소" },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "메뉴 후보를 *쉼표* 또는 *줄바꿈*으로 구분해 입력하세요.",
              },
            },
            {
              type: "input",
              block_id: "menus_block",
              label: { type: "plain_text", text: "메뉴 후보" },
              element: {
                type: "plain_text_input",
                action_id: "menus_input",
                placeholder: { type: "plain_text", text: "예: 김밥, 짜장면, 파스타, 삼겹살" },
                multiline: true,
              },
            },
          ],
        },
      });
    } catch (err) {
      console.error("lunch error:", err);
    }
  });

  // 2. 모달 제출 → 투표 메시지 게시
  app.view("lunch_menus_submit", async ({ ack, view, client }) => {
    await ack();

    const raw = view.state.values.menus_block?.menus_input?.value ?? "";
    const menus = raw
      .split(/[,\n]+/)
      .map((m) => m.trim())
      .filter(Boolean);

    if (menus.length === 0) {
      return;
    }

    const channelId = view.private_metadata;

    try {
      const res = await client.chat.postMessage({
        channel: channelId,
        text: "점심 메뉴 투표",
        blocks: buildVoteBlocks(channelId, "", menus, {}),
      });

      const messageTs = res.ts;
      lunchStore.set(getStoreKey(channelId, messageTs), {
        menus,
        votes: {},
      });

      // message_ts는 응답 후에 알 수 있으므로, 한 번 더 업데이트해서 올바른 value 넣기
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: "점심 메뉴 투표",
        blocks: buildVoteBlocks(channelId, messageTs, menus, {}),
      });
    } catch (err) {
      console.error("lunch post error:", err);
    }
  });

  // 3. 투표 버튼 클릭 → 실시간 업데이트
  app.action("lunch_vote", async ({ ack, body, client }) => {
    await ack();

    const channelId = body.channel?.id;
    const messageTs = body.message?.ts;
    const menu = body.actions[0]?.value;

    if (!channelId || !messageTs || !menu) return;

    const storeKey = getStoreKey(channelId, messageTs);
    const data = lunchStore.get(storeKey);
    if (!data) return;

    data.votes[menu] = (data.votes[menu] ?? 0) + 1;
    lunchStore.set(storeKey, data);

    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: "점심 메뉴 투표",
      blocks: buildVoteBlocks(channelId, messageTs, data.menus, data.votes),
    });
  });

  // 4. 룰렛 돌리기 → 애니메이션 후 결정
  app.action("lunch_roulette", async ({ ack, body, client }) => {
    await ack();

    const [channelId, messageTs] = (body.actions[0]?.value ?? "").split("|||");
    if (!channelId || !messageTs) return;

    const storeKey = getStoreKey(channelId, messageTs);
    const data = lunchStore.get(storeKey);
    if (!data || data.menus.length === 0) return;

    const { menus, votes } = data;

    // 투표 가중치: 투표수+1 (0표도 기회 있음)
    const weights = menus.map((m) => (votes[m] ?? 0) + 1);
    const total = weights.reduce((a, b) => a + b, 0);

    function pickWeighted() {
      let r = Math.random() * total;
      for (let i = 0; i < menus.length; i++) {
        r -= weights[i];
        if (r <= 0) return menus[i];
      }
      return menus[menus.length - 1];
    }

    // 룰렛 애니메이션: 8회 빠른 업데이트 후 최종
    const rounds = 8;
    const delay = 200;

    for (let i = 0; i < rounds; i++) {
      await new Promise((r) => setTimeout(r, delay));
      const current = pickWeighted();
      const animBlocks = [
        { type: "section", text: { type: "mrkdwn", text: "*🍽 점심 메뉴 투표*" } },
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: i < rounds - 1 ? `🎰 *${current}* ...` : `🎉 *오늘의 점심: ${current}*`,
          },
        },
      ];

      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `오늘의 점심: ${current}`,
        blocks: animBlocks,
      });
    }

    // 최종 메시지로 교체 (투표/룰렛 버튼 제거)
    const winner = pickWeighted();
    const finalBlocks = buildVoteBlocks(channelId, messageTs, menus, votes, true);
    finalBlocks.push({ type: "divider" });
    finalBlocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `🎉 *오늘의 점심: ${winner}*` },
    });

    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      text: `오늘의 점심: ${winner}`,
      blocks: finalBlocks,
    });
  });
}
