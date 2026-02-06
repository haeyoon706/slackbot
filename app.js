import "dotenv/config";
import { App } from "@slack/bolt";
import { register as registerSchedule } from "./handlers/schedule.js";
import { register as registerHello } from "./handlers/hello.js";
import { register as registerReminder } from "./handlers/reminder.js";
import { register as registerTicket } from "./handlers/ticket.js";
import { register as registerShortcut } from "./handlers/shortcut.js";
import { register as registerModal } from "./handlers/modal.js";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// 기능별 핸들러 등록
registerSchedule(app);
registerHello(app);
registerReminder(app);
registerTicket(app);
registerShortcut(app);
registerModal(app);

const PORT = 3000;
(async () => {
  await app.start(PORT);
  console.log("⚡️ Bolt app is running! (port", PORT + ")");
})();
