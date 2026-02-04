/**
 * Acknowledging requests 문서 예시: /ticket 모달 + 이메일 검증(ack)
 */
const isEmail = /^[\w\-\.]+@([\w\-]+\.)+[\w\-]+$/;

export function register(app) {
  app.command("/ticket", async ({ ack, body, client }) => {
    await ack();
    const channelId = body.channel_id ?? "";
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "ticket_submit",
        private_metadata: channelId,
        title: { type: "plain_text", text: "티켓 등록" },
        submit: { type: "plain_text", text: "제출" },
        close: { type: "plain_text", text: "취소" },
        blocks: [
          {
            type: "input",
            block_id: "email_address",
            label: { type: "plain_text", text: "이메일 주소" },
            element: {
              type: "plain_text_input",
              action_id: "input_a",
              placeholder: { type: "plain_text", text: "you@example.com" },
            },
          },
        ],
      },
    });
  });

  app.view("ticket_submit", async ({ ack, view, client }) => {
    const email = view.state.values.email_address?.input_a?.value ?? "";

    if (email && isEmail.test(email)) {
      await ack();
      const channelId = view.private_metadata;
      if (channelId) {
        try {
          await client.chat.postMessage({
            channel: channelId,
            text: `티켓이 등록되었어요. 이메일: ${email}`,
          });
        } catch (_) {}
      }
    } else {
      await ack({
        response_action: "errors",
        errors: {
          email_address: "유효한 이메일 주소를 입력해주세요.",
        },
      });
    }
  });
}
