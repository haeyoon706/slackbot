import "dotenv/config";
import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Web API 예시: "wake me up" 또는 "예약" 입력 시 1분 뒤 메시지 예약 발송
app.message(/wake me up|예약/i, async ({ message, client, say, logger }) => {
  const channel = message.channel;
  const postAt = Math.floor(Date.now() / 1000) + 60; // 1분 후 (Unix epoch)
  try {
    await client.chat.scheduleMessage({
      channel,
      post_at: postAt,
      text: "⏰ 예약 메시지가 도착했어요! (1분 전에 예약했던 거예요)",
    });
    await say({
      channel,
      text: `⏰ 1분 뒤에 이 채널에 예약 메시지를 보낼게요. (Web API \`chat.scheduleMessage\` 사용)`,
    });
  } catch (error) {
    logger.error(error);
    await say({
      channel,
      text: `예약 실패: ${error.message}. (봇에 \`chat:write\` 권한이 있는지, 채널에 봇이 있는지 확인해주세요.)`,
    });
  }
});

app.message("hello", async ({ message, say }) => {
  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hey there <@${message.user}>!`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me",
          },
          action_id: "button_click",
        },
      },
    ],
    text: `Hey there <@${message.user}>!`,
  });
});

// 누군가 메시지에 📅(calendar) 이모지 리액션을 달면 → 날짜 선택 UI 보여줌
app.event("reaction_added", async ({ event, say }) => {
  if (event.reaction === "calendar") {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await say({
      channel: event.channel,
      text: "Pick a date for me to remind you",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Pick a date for me to remind you",
          },
          accessory: {
            type: "datepicker",
            action_id: "datepicker_remind",
            initial_date: today,
            placeholder: {
              type: "plain_text",
              text: "Select a date",
            },
          },
        },
      ],
    });
  }
});

// 날짜 선택 시 동작 (Interactivity & Shortcuts Request URL 설정 필요)
app.action("datepicker_remind", async ({ ack, body, say }) => {
  await ack();
  const selectedDate = body.actions?.[0]?.selected_date;
  if (selectedDate) {
    await say({
      channel: body.channel?.id,
      text: `<@${body.user.id}> 리마인드 날짜: ${selectedDate} 로 저장했어요 📅`,
    });
  }
});

(async () => {
  await app.start(3000);
  console.log("⚡️ Bolt app is running!");
})();
