/**
 * Custom Steps (Workflow Builder)
 * - app.function(callback_id, handler) 로 워크플로우 스텝 처리
 * - complete(outputs) 또는 fail(error) 로 반드시 종료
 * @see https://docs.slack.dev/tools/bolt-js/concepts/custom-steps
 *
 * Slack 앱 설정에서 Workflow Steps 추가 필요 (또는 App Manifest에 functions 정의)
 * Event Subscriptions에 function_executed 추가
 */

export function register(app) {
  // 단순 예시: message 입력 → 포맷된 출력 (complete로 즉시 종료)
  app.function("sample_custom_step", async ({ inputs, complete, fail, logger }) => {
    try {
      const { message } = inputs;
      await complete({
        outputs: {
          message: `:wave: 전달받은 메시지:\n\n> ${message}`,
        },
      });
      logger.info("sample_custom_step completed");
    } catch (error) {
      logger.error(error);
      await fail({ error: `처리 실패: ${error.message}` });
    }
  });
}
