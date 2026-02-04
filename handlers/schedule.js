/**
 * Web API 예시: "wake me up" / "예약" 메시지 → 1분 뒤 예약 발송 (chat.scheduleMessage)
 */
export function register(app) {
  app.message(/^(?:wake me up|예약)\s*(.*)$/i, async ({ message, client, say, logger }) => {
    const channel = message.channel;
    const rawText = (message.text || "").trim();
    const match = rawText.match(/^(?:wake me up|예약)\s*(.*)$/i);
    const customContent = match?.[1]?.trim();
    const scheduledText = customContent
      ? `⏰ ${customContent}`
      : "⏰ 예약 메시지가 도착했어요! (1분 전에 예약했던 거예요)";

    const postAt = Math.floor(Date.now() / 1000) + 60;
    try {
      await client.chat.scheduleMessage({
        channel,
        post_at: postAt,
        text: scheduledText,
      });
      await say({
        channel,
        text: `⏰ 1분 뒤에 이 채널에 다음 내용으로 보낼게요:\n> ${scheduledText}`,
      });
    } catch (error) {
      logger.error(error);
      await say({
        channel,
        text: `예약 실패: ${error.message}. (봇에 \`chat:write\` 권한이 있는지, 채널에 봇이 있는지 확인해주세요.)`,
      });
    }
  });
}
