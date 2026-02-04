# slackbot

Slack Bolt 봇. `/hello`, 예약, 리마인드(날짜 선택), `/ticket` 모달 등.

## 프로젝트 구조

- **`app.js`** — 앱 생성, 핸들러 등록, 서버 시작만 담당
- **`handlers/`** — 기능별로 나눈 리스너
  - `schedule.js` — "예약" / "wake me up" → `chat.scheduleMessage`
  - `hello.js` — "hello" 메시지 → Block Kit 버튼
  - `reminder.js` — 📅 리액션 → 날짜 선택 UI, 날짜 선택 액션
  - `ticket.js` — `/ticket` 모달, 이메일 검증(ack)

새 기능 추가 시 `handlers/` 에 파일 만들고 `export function register(app) { ... }` 로 등록한 뒤 `app.js` 에서 `registerXXX(app)` 호출.

## 로컬에서 ngrok으로 테스트하기

### 1. ngrok 설치

**macOS (Homebrew):**
```bash
brew install ngrok
```

**또는** [ngrok 다운로드](https://ngrok.com/download)에서 설치 후 `ngrok` 실행 파일을 PATH에 넣기.

### 2. 슬랙봇 실행

```bash
npm start
```

봇이 **포트 3000**에서 대기합니다.

### 3. ngrok 터널 열기

**새 터미널**을 열고:

```bash
ngrok http 3000
```

출력에 다음처럼 **HTTPS URL**이 나옵니다:
```
Forwarding   https://abcd-12-34-56-78.ngrok-free.app -> http://localhost:3000
```

이 `https://...ngrok-free.app` 주소를 복사합니다.

### 4. Slack 앱 설정에서 Request URL 등록

1. [Slack API 앱 목록](https://api.slack.com/apps) 접속 후 사용 중인 앱 선택
2. 왼쪽 메뉴에서 **Event Subscriptions** 클릭
   - **Enable Events**를 On으로 두고
   - **Request URL**에 `https://여기복사한주소.ngrok-free.app/slack/events` 입력
   - 저장 후 URL 검증(Verified)이 되면 완료
3. **Slash Commands**에서 `/hello` 명령이 있다면:
   - 해당 명령 클릭 후 **Request URL**에 같은 주소  
     `https://여기복사한주소.ngrok-free.app/slack/events` 입력 후 저장
4. **Interactivity & Shortcuts** (버튼·날짜 선택 등 사용 시 필수):
   - 왼쪽 메뉴 **Interactivity & Shortcuts** 클릭
   - **Interactivity**를 **On**으로 설정
   - **Request URL**에 `https://여기복사한주소.ngrok-free.app/slack/events` 입력 후 **Save**

> **주의:** ngrok을 다시 실행하면 URL이 바뀝니다. 무료 계정은 매번 새 주소가 부여되므로, 바뀔 때마다 Slack 앱의 Request URL을 새 주소로 다시 설정해야 합니다.

### 5. 테스트

Slack 채널에서 `/hello` 입력 후 전송하면 봇이 인사 메시지를 보냅니다.

---

## 환경 변수

`.env` 파일에 다음을 설정:

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (xoxb-...)
- `SLACK_SIGNING_SECRET` — Signing Secret
