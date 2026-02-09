# slackbot

Slack Bolt SDK 기반 봇. 메시지, 슬래시 명령, 리액션, Shortcut, 모달 등을 지원합니다.

## 기능 요약

| 기능 | 트리거 | 동작 |
|------|--------|------|
| 인사 + 버튼 | 채널에 **hello** 입력 | Block Kit 버튼이 있는 인사 메시지 |
| 예약 발송 | **예약** 또는 **wake me up** (+ 내용) 입력 | 1분 뒤 해당 내용으로 메시지 예약 (`chat.scheduleMessage`) |
| 리마인드 날짜 | 메시지에 **📅** 리액션 | 날짜 선택 UI → 선택 시 채널에 응답 |
| 티켓 모달 | **/ticket** 슬래시 명령 | 이메일 입력 모달 → 검증(ack) 후 채널에 안내 |
| Open Modal | **Shortcut** (메시지 ⋮ 또는 검색/⚡) | 간단한 모달 열기 |
| 모달 데모 | **/modal-demo** 슬래시 명령 | 모달 열기 → [Update]/[Push] → Submit 시 `response_action: 'update'` 로 감사 뷰, view_closed 수신 |
| Select 메뉴 | **/select-demo** 슬래시 명령 | static_select 모달 → 옵션 A/B/C 선택 후 채널 전송 |
| App Home | 사이드바에서 **앱 이름** 클릭(홈 탭) | `app_home_opened` 수신 → `views.publish` 로 사용자별 홈 뷰 표시 |

## 프로젝트 구조

- **`app.js`** — 앱 생성, 핸들러 등록, 서버 시작
- **`handlers/`** — 기능별 리스너
  - `schedule.js` — 예약 / wake me up → `chat.scheduleMessage`
  - `hello.js` — "hello" 메시지 → Block Kit 버튼
  - `reminder.js` — 📅 리액션 → 날짜 선택 UI 및 액션
  - `ticket.js` — `/ticket` 모달, 이메일 검증(ack)
  - `shortcut.js` — Shortcut `open_modal` → 모달 열기
  - `modal.js` — `/modal-demo` → 모달 열기, **[Update]** views.update / **[Push]** views.push, Submit 처리
  - `selectMenu.js` — `/select-demo` → static_select 모달, 선택값 채널 전송
  - `home.js` — App Home: `app_home_opened` → `views.publish` 로 홈 탭 뷰 표시

새 기능: `handlers/` 에 `export function register(app) { ... }` 추가 후 `app.js` 에서 `registerXXX(app)` 호출.

---

## 로컬 실행 (ngrok)

### 1. 실행

```bash
npm start          # 포트 3000
ngrok http 3000    # 새 터미널에서
```

ngrok에 나온 **https 주소**를 복사해 두세요.

### 2. Slack 앱 설정

[api.slack.com/apps](https://api.slack.com/apps) → 사용 앱 선택 후 아래를 모두 설정합니다.  
Request URL은 **`https://복사한주소/slack/events`** 로 통일합니다.

| 항목 | 설정 |
|------|------|
| **Event Subscriptions** | Enable On, Request URL 등록, **Subscribe to bot events** 에 `message.channels`, `reaction_added`, `app_home_opened` 추가 |
| **Slash Commands** | `/ticket`, `/modal-demo`, `/select-demo` (필요 시 `/hello`) 생성, Request URL 동일 |
| **Interactivity & Shortcuts** | On, Request URL 동일 (버튼·날짜 선택·모달 제출용) |
| **Shortcuts** | **Create New Shortcut** → Name/Description 입력, **Callback ID**: `open_modal` (Global 또는 Messages 중 선택) |
| **OAuth & Permissions** | Bot Token Scopes: `chat:write`, `channels:history`, `commands` 등 필요 범위 추가 후 **Reinstall to Workspace** |
| **App Home** | **App Home** 메뉴에서 "Home Tab" 사용 설정 (Enable). 홈 탭 표시에 필요. |

봇을 테스트할 채널에 **앱 초대**해 두세요.

> ngrok 재시작 시 URL이 바뀌므로, Slack 앱의 Request URL을 새 주소로 다시 넣어야 합니다.

---

## 테스트 방법

아래는 봇이 **초대된 채널**에서 확인하는 방법입니다.

1. **hello + 버튼 액션**  
   채널에 `hello` 입력 → "Hey there @you" + **Click Me** 버튼 표시 확인.  
   **Click Me** 클릭 → `ack()` 후 채널에 "버튼 눌렀어요 👍" 메시지가 오는지 확인. (Interactivity Request URL 필요)

2. **예약**  
   `예약 회의 리마인드` 또는 `wake me up` 입력 → "1분 뒤에 다음 내용으로 보낼게요" 응답 후, 1분 뒤 예약 메시지가 오는지 확인.

3. **리마인드(날짜)**  
   아무 메시지에 **📅** 리액션 추가 → "Pick a date for me to remind you" + 날짜 선택 UI → 날짜 선택 시 "리마인드 날짜: YYYY-MM-DD 로 저장했어요" 응답 확인.  
   (Event Subscriptions에 `reaction_added` 필요.)

4. **/ticket**  
   `/ticket` 입력 → 티켓 모달에서 이메일 입력 후 제출 → 유효하면 "티켓이 등록되었어요" 채널 메시지, 잘못된 이메일이면 모달에 에러 표시되는지 확인.

5. **Open Modal (Shortcut)**  
   - **Message Shortcut**: 메시지에 마우스 올리고 **⋮** → **앱에 연결** → **Open Modal** 선택 → 모달이 열리는지 확인.  
   - **Global Shortcut** (API에서 Global로 등록한 경우): Slack 검색 또는 입력창 옆 **⚡** → **Open Modal** 선택 → 모달이 열리는지 확인.

6. **/modal-demo (Update / Push / view_submission / view_closed)**  
   `/modal-demo` 입력 → 모달 확인.  
   **[Update]** → `views.update` / **[Push]** → `views.push` (닫으면 1번 복귀, `notify_on_close`로 view_closed 수신).  
   **Submit** → 채널 전송 + `response_action: 'update'` 로 "Thank you!" 뷰로 갱신.  
   (Slash Commands에 `/modal-demo` 추가 필요.)

7. **/select-demo (Select menu options)**  
   `/select-demo` 입력 → "Select demo" 모달에서 드롭다운 열기 → 옵션 A/B/C 선택 후 **확인** → 해당 채널에 선택값 전송.  
   (Slash Commands에 `/select-demo` 추가 필요.)

8. **App Home (홈 탭)**  
   Slack 왼쪽 사이드바에서 **앱 이름** 클릭 → 홈 탭이 열리면 "Welcome home, @you" 및 안내 블록이 표시되는지 확인.  
   (Event Subscriptions에 `app_home_opened`, App Home에서 Home Tab 사용 설정 필요.)

---

## 환경 변수

`.env`:

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (xoxb-...)
- `SLACK_SIGNING_SECRET` — Signing Secret
