# 실습 가이드 만들기

`Google-Ads-실습-가이드.pdf` 는 아래 두 스크립트로 생성됩니다.
시뮬레이터 화면이 바뀌면 다시 돌려 스크린샷과 PDF를 갱신하세요.

```bash
# 1) 로컬 서버 (별도 터미널)
python3 -m http.server 8788 --directory docs

# 2) 스크린샷 캡처 — shots/ 에 번호 하이라이트가 입혀진 PNG 28장
node guide/shoot.js

# 3) PDF 생성
node guide/topdf.js
```

| 파일 | 용도 |
|---|---|
| `guide.html` | 가이드 본문. 여기를 고쳐 내용을 수정합니다 |
| `shoot.js` | 화면별 스크린샷 + 번호 하이라이트 자동 캡처 |
| `topdf.js` | HTML → A4 PDF 변환 (머리글·쪽번호 포함) |
| `shots/` | 캡처된 스크린샷 |

Playwright가 필요합니다. gstack에 설치된 것을 참조하도록 두 스크립트 상단 경로에 지정돼 있습니다.
다른 환경에서는 `npm i playwright` 후 그 경로로 바꾸세요.
