# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 실행 방법

```bash
npm start        # 포트 3000으로 서버 시작
ngrok http 3000  # 별도 터미널에서 외부 URL 노출 (Slack 요청 수신용)
```

테스트 환경 변수는 `.env` 파일에 설정:
- `SLACK_BOT_TOKEN` — Bot User OAuth Token (`xoxb-...`)
- `SLACK_SIGNING_SECRET` — Signing Secret

## 아키텍처

**ES Module** 기반 (`"type": "module"`). `@slack/bolt` v4 사용.

### 핸들러 등록 패턴

모든 기능은 `handlers/` 디렉토리에 파일 단위로 분리되며, 동일한 패턴을 따른다:

```js
// handlers/example.js
export function register(app) {
  app.command('/example', async ({ ack, client, command }) => { ... });
  app.action('example_action', async ({ ack, client, body }) => { ... });
}
```

`app.js`에서 import 후 `registerXXX(app)` 호출로 등록한다. **새 기능 추가 시 반드시 두 파일 모두 수정**해야 한다.

### Slack Bolt 리스너 종류

| 메서드 | 용도 |
|---|---|
| `app.command('/cmd')` | 슬래시 커맨드 |
| `app.action('action_id')` | 버튼·셀렉트·데이트피커 클릭 |
| `app.view('callback_id')` | 모달 제출 |
| `app.event('event_type')` | reaction_added, app_home_opened 등 |
| `app.message('pattern')` | 채널 메시지 텍스트 매칭 |
| `app.shortcut('callback_id')` | 글로벌·메시지 숏컷 |

### 핵심 규칙

- **모든 핸들러는 3초 이내에 `await ack()`를 호출**해야 한다. Slack이 타임아웃으로 재시도하므로 ack 전에 오래 걸리는 작업을 하면 안 된다.
- 모달 제출 유효성 검사 실패 시: `ack({ response_action: 'errors', errors: { block_id: '메시지' } })`
- 메시지 실시간 업데이트: `client.chat.update({ channel, ts, blocks })`로 원본 메시지 ts를 사용해 덮어쓴다.

### 상태 관리

별도 DB 없이 **in-memory Map**으로 관리한다. 서버 재시작 시 초기화된다.

```js
const store = new Map(); // key: `${channelId}:${messageTs}` 또는 userId
```

### 모달에서 채널 ID 전달

모달은 채널 컨텍스트가 없으므로 `private_metadata`에 채널 ID를 저장한 뒤 `view` 핸들러에서 꺼낸다:

```js
// 모달 열 때
private_metadata: body.channel_id

// view 핸들러에서
const channelId = view.private_metadata;
```

### 애니메이션 패턴

`setTimeout` + `chat.update`를 반복해 메시지를 여러 번 업데이트하는 방식으로 구현한다 (`lunch.js`, `rps.js`, `pomodoro.js` 참고). Slack rate limit(Tier 3: ~50req/min)을 고려해 프레임 간격을 200ms 이상으로 유지한다.

## 구현된 기능 목록

| 파일 | 트리거 | 설명 |
|---|---|---|
| `schedule.js` | 메시지 "예약"/"wake me up" | 1분 뒤 예약 발송 |
| `hello.js` | 메시지 "hello" | 버튼 포함 인사 |
| `reminder.js` | 📅 리액션 | 날짜 선택 UI |
| `ticket.js` | `/ticket` | 이메일 검증 모달 |
| `shortcut.js` | Shortcut `open_modal` | 모달 열기 |
| `modal.js` | `/modal-demo` | Update/Push/Submit 패턴 데모 |
| `selectMenu.js` | `/select-demo` | static_select 모달 |
| `home.js` | app_home_opened | 앱 홈 탭 |
| `assistant.js` | Agents & AI Apps | Assistant 스레드 (LLM 없음) |
| `workflow.js` | Workflow Builder | 커스텀 스텝 |
| `lunch.js` | `/lunch` | 점심 투표 + 룰렛 |
| `lunch2.js` | `/lunch2` | 점심 투표 v2 (1인1표, 시간제한) |
| `rps.js` | `/rps` | 가위바위보 PvP |
| `fortune.js` | `/fortune` | 오늘의 운세 |
| `pomodoro.js` | `/pomodoro [분]` | 뽀모도로 타이머 + 일일 요약 (23:59) |
| `quiz.js` | `/quiz` | 4지선다 퀴즈 + 점수 누적 |

## Slack 앱 설정 (api.slack.com/apps)

Request URL은 `https://<ngrok주소>/slack/events`로 통일.

- **Event Subscriptions** → `message.channels`, `reaction_added`, `app_home_opened`
- **Interactivity & Shortcuts** → On
- **Slash Commands** → 각 기능에 맞게 등록
- **OAuth Scopes** → `chat:write`, `channels:history`, `commands`, `chat:write.public`
