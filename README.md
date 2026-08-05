# Google Ads 검색 캠페인 실습 시뮬레이터

수강생이 본인 브랜드 정보를 입력하고 검색 캠페인을 만들어 게재하면, 30일치 성과가 즉시
시뮬레이션되고 문제 진단과 CSV 보고서가 나오는 실습 도구입니다.

의존성 없는 단일 HTML 파일입니다. 빌드 도구, 서버, 인터넷 연결 모두 필요 없습니다.

## GitHub Pages 배포

```bash
git init
git add .
git commit -m "Google Ads 실습 시뮬레이터"
git branch -M main
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

푸시한 뒤 저장소 **Settings → Pages**에서

- Source: `Deploy from a branch`
- Branch: `main` / 폴더 `/docs`

로 설정하면 1~2분 뒤 `https://<계정>.github.io/<저장소>/` 에서 열립니다.

`docs/.nojekyll` 파일은 Jekyll 처리를 건너뛰게 합니다. 지우지 마세요.

## 파일 구성

| 경로 | 용도 |
|---|---|
| `docs/index.html` | **배포본.** doctype·charset·viewport를 갖춘 완전한 HTML |
| `docs/.nojekyll` | Jekyll 비활성화 |
| `build.sh` | Artifact용 원본을 배포본으로 감싸는 빌드 스크립트 |

## 수정 후 재빌드

원본을 고친 뒤:

```bash
./build.sh /경로/google-ads-sim.html
```

`docs/index.html` 이 다시 생성됩니다. `docs/index.html` 을 직접 고쳐도 되지만,
그 경우 다음 빌드에서 덮어써집니다.

## 로컬에서 확인

```bash
python3 -m http.server 8777 --directory docs
```

`http://localhost:8777` 로 접속합니다.

## 보고서 다운로드

- 개별 CSV는 `<업체명>_campaign_daily.csv` 처럼 한글 파일명으로 저장됩니다.
- **전체 보고서 ZIP으로 받기** 는 CSV 5종을 ZIP 하나로 묶습니다. 브라우저가 한 사이트의
  연속 다운로드를 차단하기 때문에, 여러 파일을 따로 내려받지 않고 한 번에 받습니다.
- 모든 CSV는 UTF-8 BOM으로 저장되어 엑셀에서 한글이 깨지지 않습니다.

## 동작 환경

- 최신 Chrome·Safari·Firefox·Edge (데스크톱/모바일)
- 진행 상황은 브라우저 `localStorage` 에 저장되므로 수강생마다 독립적입니다
- 서버로 전송되는 데이터가 없습니다. 수강생이 입력한 브랜드 정보는 각자 브라우저에만 남습니다
- 상단 **초기화** 버튼으로 실습 데이터를 지웁니다

## 주의

`file://` 로 직접 열면 브라우저에 따라 `localStorage` 가 차단되어 진행 상황이 저장되지
않을 수 있습니다. GitHub Pages 같은 `http(s)://` 환경에서 사용하세요.
