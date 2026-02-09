/**
 * Select 메뉴 데모 (처음부터 동작 보장)
 * - /select-demo → 모달에 static_select 사용 (옵션을 블록에 포함 → 서버 콜백 없이 바로 표시)
 * - 확인 시 선택값을 채널에 전송
 */

const OPTIONS = [
  { label: "옵션 A", value: "opt_a" },
  { label: "옵션 B", value: "opt_b" },
  { label: "옵션 C", value: "opt_c" },
];

export function register(app) {
  app.command("/select-demo", async ({ ack, body, client }) => {
    await ack();
    const channelId = body.channel_id ?? "";
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "select_demo_submit",
          private_metadata: channelId,
          title: { type: "plain_text", text: "Select demo" },
          submit: { type: "plain_text", text: "확인" },
          close: { type: "plain_text", text: "취소" },
          blocks: [
            {
              type: "input",
              block_id: "select_block",
              label: { type: "plain_text", text: "항목을 선택하세요" },
              element: {
                type: "static_select",
                action_id: "select_action",
                placeholder: { type: "plain_text", text: "선택..." },
                options: OPTIONS.map((item) => ({
                  text: { type: "plain_text", text: item.label },
                  value: item.value,
                })),
              },
            },
          ],
        },
      });
    } catch (err) {
      console.error("/select-demo error:", err);
    }
  });

  app.view("select_demo_submit", async ({ ack, view, client }) => {
    await ack();
    const selected = view.state.values.select_block?.select_action?.selected_option;
    const value = selected?.value ?? "";
    const text = selected?.text?.text ?? "";
    const channelId = view.private_metadata;

    if (value && channelId) {
      try {
        await client.chat.postMessage({
          channel: channelId,
          text: `선택: *${text}* (\`${value}\`)`,
        });
      } catch (_) {}
    }
  });
}
