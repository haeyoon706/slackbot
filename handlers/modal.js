/**
 * Opening modals + Updating & pushing views 문서 예시
 * - /modal-demo → views.open 으로 모달 열기 (1번 뷰)
 * - [Update] 버튼 → views.update 로 현재 모달 내용 갱신
 * - [Push] 버튼 → views.push 로 새 뷰를 위에 쌓음 (닫으면 1번으로 복귀)
 * - Submit → view_1 제출 처리
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
            },
            {
              type: "actions",
              block_id: "modal_actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Update" },
                  action_id: "button_update",
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "Push" },
                  action_id: "button_push",
                },
              ],
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

  const sharedBlocks = [
    {
      type: "section",
      text: { type: "plain_text", text: "You updated the modal! (update)" },
    },
    {
      type: "image",
      image_url: "https://media.giphy.com/media/SVZGEcYt7brkFUyU90/giphy.gif",
      alt_text: "Yay!",
    },
  ];

  const pushedBlocks = [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: "You pushed a new view! 닫으면 이전 모달로 돌아갑니다.",
      },
    },
    {
      type: "image",
      image_url: "https://media.giphy.com/media/SVZGEcYt7brkFUyU90/giphy.gif",
      alt_text: "Yay! The modal was pushed",
    },
  ];

  // [Update] 버튼 → views.update (같은 뷰 내용만 갱신)
  app.action("button_update", async ({ ack, body, client, logger }) => {
    await ack();
    try {
      if (body.type !== "block_actions" || !body.view) return;
      await client.views.update({
        view_id: body.view.id,
        hash: body.view.hash,
        view: {
          type: "modal",
          callback_id: "view_1",
          title: { type: "plain_text", text: "Updated modal" },
          blocks: sharedBlocks,
        },
      });
    } catch (error) {
      logger.error(error);
    }
  });

  // [Push] 버튼 → views.push (새 뷰를 위에 쌓음, 닫으면 1번으로 복귀)
  app.action("button_push", async ({ ack, body, client, logger }) => {
    await ack();
    try {
      const trigger_id = body.trigger_id;
      if (trigger_id) {
        const result = await client.views.push({
          trigger_id,
          view: {
            type: "modal",
            callback_id: "view_pushed",
            title: { type: "plain_text", text: "Pushed view" },
            close: { type: "plain_text", text: "Close" },
            blocks: pushedBlocks,
          },
        });
        logger.info(result);
      }
    } catch (error) {
      logger.error(error);
    }
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
