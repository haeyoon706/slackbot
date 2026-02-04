/**
 * "hello" 메시지 → Block Kit(버튼) 응답
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
}
