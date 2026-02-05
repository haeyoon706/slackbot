/**
 * Shortcuts 문서 첫 번째 예시: callback_id 'open_modal' → 간단한 모달 열기
 * (Global Shortcut / Message Shortcut 둘 다 한 핸들러로 처리)
 */
export function register(app) {
  app.shortcut("open_modal", async ({ shortcut, ack, client, logger }) => {
    try {
      await ack();

      await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: {
          type: "modal",
          title: { type: "plain_text", text: "My App" },
          close: { type: "plain_text", text: "Close" },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text:
                  "About the simplest modal you could conceive of :smile:\n\n" +
                  "Maybe <https://docs.slack.dev/block-kit/#making-things-interactive|*make the modal interactive*> or " +
                  "<https://docs.slack.dev/surfaces/modals|*learn more advanced modal use cases*>.",
              },
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text:
                    "Psssst this modal was designed using <https://api.slack.com/tools/block-kit-builder|*Block Kit Builder*>",
                },
              ],
            },
          ],
        },
      });

      logger.info("open_modal shortcut: modal opened");
    } catch (error) {
      logger.error(error);
    }
  });
}
