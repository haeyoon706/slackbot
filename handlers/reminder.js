/**
 * 📅 리액션 → 날짜 선택 UI, 날짜 선택 시 채널에 응답
 */
export function register(app) {
  app.event("reaction_added", async ({ event, say }) => {
    if (event.reaction !== "calendar") return;
    const today = new Date().toISOString().slice(0, 10);
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
            placeholder: { type: "plain_text", text: "Select a date" },
          },
        },
      ],
    });
  });

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
}
