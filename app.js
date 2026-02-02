import "dotenv/config";
import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.command("/hello", async ({ command, ack }) => {
  console.log("[ /hello ] 요청 수신:", command.user_id, command.channel_id);
  await ack({
    response_type: "ephemeral",
    text: `안녕하세요 <@${command.user_id}> 👋`,
  });
  console.log("[ /hello ] 응답 전송 완료");
});

(async () => {
  await app.start(3000);
  console.log("⚡️ Bolt app is running!");
})();
