/**
 * Opening modals 문서 예시: trigger_id + views.open 으로 모달 열기
 * - /modal-demo 슬래시 명령 → 모달 열기 (section + 버튼 + multiline input)
 * - 제출 시 view_1 수신 → 입력값 처리
 */
export function register(app) {
  // 슬래시 명령 수신 → 3초 이내 trigger_id 로 모달 열기
  app.command("/modal-demo", async ({ ack, body, client, logger }) => {
    await ack();
    const channelId = body.channel_id ?? "";

    try {
      const result = await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "view_1",
          private_metadata: channelId,
          title: { type: "plain_text", text: "Modal title" },
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Welcome to a modal with _blocks_",
              },
              accessory: {
                type: "button",
                text: { type: "plain_text", text: "Click me!" },
                action_id: "button_abc",
              },
            },
            {
              type: "input",
              block_id: "input_c",
              label: { type: "plain_text", text: "What are your hopes and dreams?" },
              element: {
                type: "plain_text_input",
                action_id: "dreamy_input",
                multiline: true,
              },
            },
          ],
          submit: { type: "plain_text", text: "Submit" },
        },
      });
      logger.info(result);
    } catch (error) {
      logger.error(error);
    }
  });

  // 모달 안 "Click me!" 버튼
  app.action("button_abc", async ({ ack }) => {
    await ack();
  });

  // 모달 제출 (Submit) 시
  app.view("view_1", async ({ ack, view, client }) => {
    await ack();
    const hopes = view.state.values.input_c?.dreamy_input?.value ?? "";
    const channelId = view.private_metadata;
    if (hopes && channelId) {
      try {
        await client.chat.postMessage({
          channel: channelId,
          text: `*Hopes and dreams:*\n${hopes}`,
        });
      } catch (_) {}
    }
  });
}
