/**
 * Slack Assistant (AI 앱 구조·이벤트·UI만, LLM 없음)
 * - 앱에서 "Agents & AI Apps" 사용 시 어시스턴트 스레드(사이드 패널/DM) 제공
 * - threadStarted: 인사 + 추천 프롬프트
 * - threadContextChanged: 채널 전환 시 컨텍스트 저장
 * - userMessage: 사용자 메시지에 고정 답장 (setTitle, setStatus, say)
 * @see https://docs.slack.dev/tools/bolt-js/concepts/ai-apps
 */

import { Assistant } from "@slack/bolt";

const assistant = new Assistant({
  threadStarted: async ({ event, say, setSuggestedPrompts, saveThreadContext, logger }) => {
    try {
      await say("안녕하세요, 무엇을 도와드릴까요? (현재 LLM 없이 고정 답변만 가능해요)");
      await saveThreadContext();
      await setSuggestedPrompts({
        title: "추천 프롬프트:",
        prompts: [
          { title: "간단 인사", message: "안녕!" },
          { title: "도움 요청", message: "도움이 필요해요." },
          { title: "테스트", message: "테스트 메시지예요." },
        ],
      });
      logger.info("Assistant thread started for user:", event.user);
    } catch (err) {
      logger.error("threadStarted error:", err);
    }
  },

  threadContextChanged: async ({ saveThreadContext }) => {
    await saveThreadContext();
  },

  userMessage: async ({ event, say, setTitle, setStatus, logger }) => {
    const message = event;
    const threadTs = message.thread_ts ?? message.ts;
    if (!message.text || !threadTs) return;

    try {
      await setTitle(message.text.slice(0, 50));
      await setStatus({
        status: "thinking...",
        loading_messages: [
          "잠시만요…",
          "확인 중이에요…",
          "곧 답변할게요…",
        ],
      });
      await say(`"${message.text}" 메시지 받았어요. (현재는 고정 답변만 지원해요)`);
      logger.info("Assistant userMessage replied");
    } catch (err) {
      logger.error("userMessage error:", err);
      await say("오류가 났어요. 다시 시도해 주세요.");
    }
  },
});

export function register(app) {
  app.assistant(assistant);
}
