# slackbot

Slack Bolt 봇. `/hello` 명령으로 인사 메시지를 보냅니다.

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

> **주의:** ngrok을 다시 실행하면 URL이 바뀝니다. 무료 계정은 매번 새 주소가 부여되므로, 바뀔 때마다 Slack 앱의 Request URL을 새 주소로 다시 설정해야 합니다.

### 5. 테스트

Slack 채널에서 `/hello` 입력 후 전송하면 봇이 인사 메시지를 보냅니다.

---

## 환경 변수

`.env` 파일에 다음을 설정:

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (xoxb-...)
- `SLACK_SIGNING_SECRET` — Signing Secret
