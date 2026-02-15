/**
 * 뽀모도로 타이머 봇
 *
 * - /pomodoro [분] → 집중 타이머 시작 (기본 25분)
 * - 25% / 50% / 75% / 100% 진행률 업데이트
 * - 완료 시 알림 메시지 + 휴식 버튼
 * - 휴식 버튼 → 5분 휴식 타이머
 * - 중단 버튼으로 언제든 취소 가능
 */

const timers = new Map(); // userId → timer state

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function progressBar(ratio) {
  const filled = Math.round(ratio * 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}초`;
  return `${min}분`;
}

function buildTimerBlocks(userId, duration, ratio, status) {
  const percent = Math.round(ratio * 100);
  const remaining = Math.max(0, duration * 60 * 1000 * (1 - ratio));
  const isWork = status === "work";
  const emoji = isWork ? "🍅" : "☕";
  const label = isWork ? "집중" : "휴식";

  if (status === "done") {
    return [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} 뽀모도로 ${label} 완료!` },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<@${userId}>\n✅ *${duration}분 ${label} 완료!*\n\`${progressBar(1)}\` 100%`,
        },
      },
    ];
  }

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: `${emoji} 뽀모도로 ${label} 타이머` },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<@${userId}>\n⏱️ *${formatTime(remaining)} 남음* (${duration}분 중)\n\`${progressBar(ratio)}\` ${percent}%`,
      },
    },
    {
      type: "actions",
      block_id: "pomodoro_actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "🛑 중단" },
          action_id: "pomodoro_stop",
          style: "danger",
        },
      ],
    },
  ];

  return blocks;
}

function clearTimerIntervals(state) {
  for (const id of state.intervals) {
    clearTimeout(id);
  }
  state.intervals = [];
}

async function startTimer(client, userId, channelId, messageTs, duration, mode) {
  const totalMs = duration * 60 * 1000;
  const state = {
    channelId,
    messageTs,
    userId,
    duration,
    mode, // 'work' or 'break'
    startTime: Date.now(),
    intervals: [],
  };

  timers.set(userId, state);

  // 진행률 업데이트 (25%, 50%, 75%)
  for (const point of [0.25, 0.5, 0.75]) {
    const delay = totalMs * point;
    const timeoutId = setTimeout(async () => {
      try {
        await client.chat.update({
          channel: channelId,
          ts: messageTs,
          text: `뽀모도로 ${mode === "work" ? "집중" : "휴식"} 중...`,
          blocks: buildTimerBlocks(userId, duration, point, mode),
        });
      } catch (e) {
        /* 무시 */
      }
    }, delay);
    state.intervals.push(timeoutId);
  }

  // 완료
  const finalTimeout = setTimeout(async () => {
    try {
      // 기존 메시지 → 완료 표시
      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: `뽀모도로 ${mode === "work" ? "집중" : "휴식"} 완료!`,
        blocks: buildTimerBlocks(userId, duration, 1, "done"),
      });

      // 새 알림 메시지 (노티피케이션 발생)
      if (mode === "work") {
        await client.chat.postMessage({
          channel: channelId,
          text: `🍅 <@${userId}> ${duration}분 집중 완료! 수고했어요!`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `🎉 <@${userId}> *${duration}분 집중 완료!* 수고했어요!\n짧은 휴식을 취해보세요.`,
              },
            },
            {
              type: "actions",
              block_id: "pomodoro_break_actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "☕ 5분 휴식" },
                  action_id: "pomodoro_break",
                  value: "5",
                  style: "primary",
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "☕ 10분 휴식" },
                  action_id: "pomodoro_break_10",
                  value: "10",
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "🍅 다시 집중" },
                  action_id: "pomodoro_restart",
                  value: String(duration),
                },
              ],
            },
          ],
        });
      } else {
        await client.chat.postMessage({
          channel: channelId,
          text: `☕ <@${userId}> ${duration}분 휴식 끝! 다시 집중할 시간이에요!`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `💪 <@${userId}> *휴식 끝!* 다시 집중해볼까요?`,
              },
            },
            {
              type: "actions",
              block_id: "pomodoro_resume_actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "🍅 25분 집중" },
                  action_id: "pomodoro_restart",
                  value: "25",
                  style: "primary",
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "🍅 50분 집중" },
                  action_id: "pomodoro_restart_50",
                  value: "50",
                },
              ],
            },
          ],
        });
      }
    } catch (e) {
      /* 무시 */
    }
    timers.delete(userId);
  }, totalMs);

  state.intervals.push(finalTimeout);
}

export function register(app) {
  // /pomodoro [분] → 타이머 시작
  app.command("/pomodoro", async ({ ack, client, command }) => {
    await ack();

    const userId = command.user_id;
    const channelId = command.channel_id;

    // 이미 실행 중인 타이머 확인
    if (timers.has(userId)) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: "⚠️ 이미 진행 중인 타이머가 있습니다. 먼저 중단하거나 완료될 때까지 기다려주세요.",
      });
      return;
    }

    // 시간 파싱 (기본 25분, 1~120분)
    const input = parseInt(command.text);
    const duration = input > 0 ? Math.min(Math.max(input, 1), 120) : 25;

    // 타이머 메시지 게시
    const msg = await client.chat.postMessage({
      channel: channelId,
      text: `뽀모도로 ${duration}분 집중 시작!`,
      blocks: buildTimerBlocks(userId, duration, 0, "work"),
    });

    await startTimer(client, userId, channelId, msg.ts, duration, "work");
  });

  // 중단 버튼
  app.action("pomodoro_stop", async ({ ack, client, body }) => {
    await ack();

    const userId = body.user.id;
    const state = timers.get(userId);
    if (!state) return;

    clearTimerIntervals(state);
    timers.delete(userId);

    const elapsed = Date.now() - state.startTime;
    const elapsedMin = Math.floor(elapsed / 60000);
    const label = state.mode === "work" ? "집중" : "휴식";

    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: "뽀모도로 중단됨",
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `⏹️ 뽀모도로 ${label} 중단` },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${userId}>\n${state.duration}분 중 *${elapsedMin}분* 진행 후 중단되었습니다.`,
          },
        },
      ],
    });
  });

  // 휴식 버튼 (5분 / 10분)
  const handleBreak = async ({ ack, client, body }) => {
    await ack();

    const userId = body.user.id;
    if (timers.has(userId)) return;

    const breakMin = parseInt(body.actions[0].value) || 5;
    const channelId = body.channel.id;

    // 원래 버튼 메시지 업데이트
    await client.chat.update({
      channel: channelId,
      ts: body.message.ts,
      text: `☕ ${breakMin}분 휴식 시작!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `☕ *${breakMin}분 휴식을 시작합니다!*`,
          },
        },
      ],
    });

    // 휴식 타이머 메시지
    const msg = await client.chat.postMessage({
      channel: channelId,
      text: `☕ ${breakMin}분 휴식 중...`,
      blocks: buildTimerBlocks(userId, breakMin, 0, "break"),
    });

    await startTimer(client, userId, channelId, msg.ts, breakMin, "break");
  };

  app.action("pomodoro_break", handleBreak);
  app.action("pomodoro_break_10", handleBreak);

  // 다시 집중 버튼
  const handleRestart = async ({ ack, client, body }) => {
    await ack();

    const userId = body.user.id;
    if (timers.has(userId)) return;

    const duration = parseInt(body.actions[0].value) || 25;
    const channelId = body.channel.id;

    // 원래 버튼 메시지 업데이트
    await client.chat.update({
      channel: channelId,
      ts: body.message.ts,
      text: `🍅 ${duration}분 집중 시작!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🍅 *${duration}분 집중을 다시 시작합니다!*`,
          },
        },
      ],
    });

    // 새 타이머 메시지
    const msg = await client.chat.postMessage({
      channel: channelId,
      text: `🍅 ${duration}분 집중 시작!`,
      blocks: buildTimerBlocks(userId, duration, 0, "work"),
    });

    await startTimer(client, userId, channelId, msg.ts, duration, "work");
  };

  app.action("pomodoro_restart", handleRestart);
  app.action("pomodoro_restart_50", handleRestart);
}
