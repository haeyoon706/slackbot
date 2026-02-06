/**
 * "hello" 메시지 → Block Kit(버튼) 응답
 * Actions 문서: 버튼 클릭은 app.action(action_id, ...) 로 처리
 */
export function register(app) {
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
            text: { type: "plain_text", text: "Click Me" },
            action_id: "button_click",
          },
        },
      ],
      text: `Hey there <@${message.user}>!`,
    });
  });

  // 버튼 클릭 시 응답 (ack 필수, say로 채널에 메시지)
  app.action("button_click", async ({ ack, say, body }) => {
    await ack();
    await say(`<@${body.user.id}> 버튼 눌렀어요 👍`);
  });
}
