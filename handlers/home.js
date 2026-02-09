/**
 * App Home (홈 탭) 퍼블리시
 * - 사용자가 앱 홈 탭을 열면 app_home_opened 이벤트 수신
 * - views.publish로 해당 사용자 홈 탭에 뷰 표시 (모달은 views.open, 홈은 views.publish)
 * @see https://docs.slack.dev/tools/bolt-js/concepts/publishing-views
 */

export function register(app) {
  app.event("app_home_opened", async ({ event, client, logger }) => {
    try {
      await client.views.publish({
        user_id: event.user,
        view: {
          type: "home",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Welcome home, <@${event.user}> :house:*`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "홈 탭에서 사용자별로 다른 화면을 보여줄 수 있어요. 슬래시 명령·Shortcut·모달 등은 채널/메시지에서 사용해 보세요.",
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "문서: <https://docs.slack.dev/tools/bolt-js/concepts/publishing-views|*Publishing views to App Home*>",
              },
            },
          ],
        },
      });
      logger.info("App Home published for user:", event.user);
    } catch (err) {
      logger.error("app_home_opened error:", err);
    }
  });
}
