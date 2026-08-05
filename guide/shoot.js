/* 실습 가이드용 스크린샷 캡처 — 기능마다 번호 하이라이트를 입혀 저장한다.
   사용: node guide/shoot.js   (docs/ 를 8788 포트로 서빙 중이어야 함) */
const { chromium } = require("/Users/jaewoochoi/.claude/skills/gstack/node_modules/playwright");
const path = require("path");

const URL = "http://localhost:8788/index.html";
const OUT = path.join(__dirname, "shots");

/* ── 실습 시나리오에 쓰는 고정 데이터 ───────────────── */
const BIZ = {
  name: "홈핏", industry: "health", model: "subscription",
  url: "https://homefit.example.com/class",
  desc: "집에서 하는 20분 홈트레이닝 온라인 클래스 구독 서비스입니다. 요가·근력·스트레칭 프로그램을 매주 새로 제공하며, 전문 트레이너가 자세를 코칭합니다.",
  price: 39000, audience: "헬스장 갈 시간이 없는 20~40대 직장인",
  exclude: "헬스장, 자격증, 채용", period: 30,
  targets: { conversions: 40, cpa: 25000, budgetTotal: 1200000 },
  conv: { enabled: true, name: "구독 신청", category: "subscribe", valueMode: "fixed", value: 39000, countMode: "one", window: 30, includeInConversions: true },
};
const AD = (n) => ({
  finalUrl: "https://homefit.example.com/class", path1: "클래스", path2: "",
  headlines: [n + " 홈핏", "집에서 20분 " + n, "홈트 온라인 강의 월 39,000원", "전문 트레이너 코칭", "지금 구독 신청", "매주 새 프로그램"],
  descriptions: ["집에서 하는 20분 홈트레이닝 클래스. 매주 새 프로그램.", "전문 트레이너가 자세를 코칭합니다."],
  sitelinks: ["프로그램 보기", "요금 안내"], callouts: ["매주 새 클래스", "전문 코칭"],
});
const CAMPAIGN = {
  name: "홈트 검색 1차", type: "search", goal: "sales", bidding: "max_clicks",
  budget: 45000, targetCpa: 49500, maxCpc: 2200,
  geo: "kr", lang: "ko", displayExpansion: false, conversionTracking: true,
  adGroups: [
    { name: "홈트 클래스", keywords: [{ text: "홈트레이닝 클래스", match: "broad" }, { text: "홈트 온라인 강의", match: "broad" }], ad: AD("홈트레이닝 클래스") },
    { name: "집에서 하는 운동", keywords: [{ text: "집에서 하는 운동", match: "phrase" }], ad: AD("집에서 하는 운동") },
  ],
  negatives: [],
  display: { targeting: "audience", frequencyCap: 3, excludedPlacements: [] },
};

/* ── 하이라이트 주입 ────────────────────────────────── */
const HL_CSS = `
.__hl-box{position:absolute;border:3px solid #d93025;border-radius:8px;pointer-events:none;z-index:99998;
  box-shadow:0 0 0 3px rgba(217,48,37,.18)}
.__hl-num{position:absolute;z-index:99999;width:30px;height:30px;border-radius:50%;background:#d93025;color:#fff;
  font:700 16px/30px system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;text-align:center;pointer-events:none;
  box-shadow:0 2px 6px rgba(0,0,0,.35)}
.__hl-note{position:absolute;z-index:99999;background:#202124;color:#fff;border-radius:6px;padding:6px 11px;
  font:500 14px/1.4 system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;pointer-events:none;white-space:nowrap;
  box-shadow:0 2px 8px rgba(0,0,0,.35)}
`;

async function inject(page) {
  await page.evaluate((css) => {
    if (document.getElementById("__hl-style")) return;
    const s = document.createElement("style");
    s.id = "__hl-style"; s.textContent = css;
    document.head.append(s);
    window.__clearHl = () => { window.__notes = []; document.querySelectorAll(".__hl-box,.__hl-num,.__hl-note").forEach(n => n.remove()); };
    window.clampN = (v, a, b) => Math.min(b, Math.max(a, v));
    window.__findEl = (spec) => {
      if (spec.startsWith("text=")) {
        const t = spec.slice(5);
        const all = [...document.querySelectorAll("button,a,h1,h2,h3,label,th,td,span,div,summary,input,select,textarea")];
        return all.find(e => (e.textContent || "").trim() === t)
          || all.find(e => (e.textContent || "").trim().startsWith(t))
          || all.find(e => (e.textContent || "").includes(t));
      }
      return document.querySelector(spec);
    };
    window.__mark = (spec, n, note, pad) => {
      const e = window.__findEl(spec);
      if (!e) return "MISS: " + spec;
      const r = e.getBoundingClientRect();
      const p = pad == null ? 4 : pad;
      const sx = window.scrollX, sy = window.scrollY;
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      /* 박스는 화면 안으로 가둔다 — 배지와 말풍선이 잘리지 않게 */
      const M = 20;
      const L = Math.max(M, r.left - p), T = Math.max(M, r.top - p);
      const R = Math.min(vw - M, r.right + p), B = Math.min(vh - M, r.bottom + p);
      if (R <= L || B <= T) return "OFFSCREEN: " + spec;
      const box = document.createElement("div");
      box.className = "__hl-box";
      box.style.left = (L + sx) + "px"; box.style.top = (T + sy) + "px";
      box.style.width = (R - L) + "px"; box.style.height = (B - T) + "px";
      document.body.append(box);

      const num = document.createElement("div");
      num.className = "__hl-num"; num.textContent = n;
      num.style.left = (Math.max(2, L - 15) + sx) + "px";
      num.style.top = (Math.max(2, T - 15) + sy) + "px";
      document.body.append(num);

      /* 넓은 영역은 번호만 남긴다 — 말풍선이 내용을 가리기 때문. 설명은 가이드 본문에서 한다. */
      if (note && (R - L) < 700) {
        const nt = document.createElement("div");
        nt.className = "__hl-note"; nt.textContent = note;
        nt.style.left = "0px"; nt.style.top = "0px";
        document.body.append(nt);
        const nr = nt.getBoundingClientRect();
        let nx, ny;
        /* 좁은 대상(주로 입력칸 라벨)은 오른쪽에 붙인다 — 아래에 두면 정작 그 입력칸을 가린다 */
        if ((R - L) < 320 && R + 12 + nr.width < vw - 6) { nx = R + 12; ny = T - 2; }
        else if ((B - T) < 46 && T - nr.height - 8 > 6) { nx = L; ny = T - nr.height - 8; }  /* 라벨류는 위쪽 여백에 */
        else {
          nx = L; ny = B + 8;
          if (ny + nr.height > vh - 6) ny = T - nr.height - 8;
          if (ny < 6) ny = B + 8;
        }
        nx = clampN(nx, 6, vw - nr.width - 6);
        ny = clampN(ny, 6, vh - nr.height - 6);
        /* 이미 놓인 말풍선과 겹치면 아래로 밀어낸다 */
        window.__notes = window.__notes || [];
        const hits = r2 => !(nx + nr.width < r2.x || r2.x + r2.w < nx || ny + nr.height < r2.y || r2.y + r2.h < ny);
        let guard = 0;
        while (window.__notes.some(hits) && guard++ < 12) ny += nr.height + 6;
        if (ny + nr.height > vh - 6) { ny = 6; nx = clampN(nx + 260, 6, vw - nr.width - 6); }
        window.__notes.push({ x: nx, y: ny, w: nr.width, h: nr.height });
        nt.style.left = (nx + sx) + "px";
        nt.style.top = (ny + sy) + "px";
      }
      return "OK";
    };
  }, HL_CSS);
}

async function shot(page, file, opts = {}) {
  const { marks = [], full = false, clip = null, scroll = 0, setup = null, scrollEl = null } = opts;
  if (setup) await page.evaluate(setup);
  if (scrollEl) {
    await inject(page);
    await page.evaluate((sel) => {
      const e = window.__findEl(sel);
      /* 마법사 본문은 .wiz-main 이 내부 스크롤이라 window.scrollTo 가 듣지 않는다 */
      if (e) e.scrollIntoView({ block: "center", inline: "nearest" });
    }, scrollEl);
  } else {
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
  }
  await page.waitForTimeout(260);
  await inject(page);
  await page.evaluate(() => window.__clearHl());
  const misses = [];
  for (const m of marks) {
    const r = await page.evaluate(([s, n, note, pad]) => window.__mark(s, n, note, pad), [m[0], m[1], m[2] || "", m[3]]);
    if (r !== "OK") misses.push(r);
  }
  await page.waitForTimeout(120);
  const p = path.join(OUT, file);
  if (clip) await page.screenshot({ path: p, clip });
  else await page.screenshot({ path: p, fullPage: full });
  await page.evaluate(() => window.__clearHl());
  console.log((misses.length ? "⚠ " : "✓ ") + file + (misses.length ? "  " + misses.join(" / ") : ""));
  return misses;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
  const allMiss = [];
  const M = (...a) => allMiss.push(...a.filter(Boolean));

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
  await page.reload({ waitUntil: "networkidle" });

  /* 01 · 첫 화면 */
  M(...await shot(page, "01-overview-empty.png", {
    marks: [
      [".rail", 1, "주요 메뉴 (구글 애즈와 동일 구조)", 2],
      ["#navCol", 2, "세부 메뉴", 2],
      [".main .card", 3, "실습 4단계 체크리스트", 2],
      ["#btnReset", 4, "실습 데이터 초기화", 4],
    ],
  }));

  /* 02 · 비즈니스 정보 (빈 화면) */
  await page.evaluate(() => go("business"));
  M(...await shot(page, "02-business-empty.png", {
    marks: [
      ["text=업체 이름", 1],
      ["text=업종", 2, "시장 단가·경쟁·고객 아닌 검색을 결정"],
      ["text=상품 유형", 3],
      ["text=객단가 (원)", 4, "ROAS 계산 기준"],
    ],
  }));

  /* 03 · 비즈니스 정보 (채운 뒤 아래쪽) */
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll("button")];
    bs.find(b => b.textContent.trim() === "예시로 채우기").click();
  });
  M(...await shot(page, "03-business-filled.png", {
    scroll: 420,
    marks: [
      ["text=비즈니스 설명", 1, "여기 쓴 단어가 키워드 적합도의 기준"],
      ["text=우리 고객이 아닌 검색 (쉼표로 구분)", 2, "무관 검색어 판정에 사용"],
      ["text=목표 전환수 (건)", 3, "채점 기준"],
    ],
  }));

  /* 상태를 코드로 확정 */
  await page.evaluate((biz) => {
    state.biz = biz; save(); go("conversions");
  }, BIZ);

  /* 04 · 전환 액션 */
  M(...await shot(page, "04-conversions.png", {
    marks: [
      ["text=전환 액션 이름", 1],
      ["text=카테고리", 2, "무엇이 일어나면 성공인가"],
      ["text=횟수", 3],
      ["text=전환 추적 기간", 4, "짧으면 늦은 전환을 놓침"],
      ["text=이 전환 액션 사용", 5],
      ["text='전환수' 열에 포함", 6, "끄면 자동 입찰이 학습 못 함"],
    ],
  }));

  /* 05 · 전환 카테고리 비교표 */
  M(...await shot(page, "05-conversion-categories.png", {
    scroll: 900,
    marks: [["text=카테고리를 바꾸면 무엇이 달라지나", 1, "쉬운 전환일수록 숫자만 커진다"]],
  }));

  /* ── 마법사 ── */
  await page.evaluate(() => { go("overview"); startWizard(); });

  M(...await shot(page, "06-wizard-goal.png", {
    marks: [[".wiz-steps", 1, "9단계 진행 표시", 6], ["text=판매", 2], ["text=리드", 3]],
  }));

  await page.evaluate(() => { state.step = 1; renderWizard(); });
  M(...await shot(page, "07-wizard-type.png", {
    marks: [["text=검색", 1, "이번 실습의 기본"], ["text=디스플레이", 2, "8단계에서 다룸"]],
  }));

  await page.evaluate(() => { state.step = 2; renderWizard(); });
  M(...await shot(page, "08-wizard-settings.png", {
    marks: [["text=캠페인 이름", 1], ["text=위치", 2, "서비스 가능 지역만"], ["text=언어", 3],
      ["text=전환 추적 사용", 4, "꺼보면 전환이 0으로 나온다"]],
  }));

  await page.evaluate(() => { state.step = 3; state.draft.budget = 45000; state.draft.maxCpc = 2200; renderWizard(); });
  M(...await shot(page, "09-wizard-budget.png", {
    marks: [["text=일일 예산 (원)", 1], ["text=클릭수 최대화", 2], ["text=타겟 CPA", 3, "선택하면 권장 범위가 뜬다"]],
  }));

  await page.evaluate(() => { state.step = 3; state.draft.bidding = "target_cpa"; renderWizard(); });
  M(...await shot(page, "10-wizard-targetcpa.png", {
    scrollEl: "text=타겟 CPA (원)",
    marks: [["text=타겟 CPA (원)", 1, "직접 입력"], [".chips", 2, "권장값 / 채점 목표 바로 적용", 6]],
  }));

  await page.evaluate(() => { state.draft.bidding = "max_clicks"; state.step = 4; renderWizard(); });
  M(...await shot(page, "11-wizard-bidadj.png", {
    marks: [["text=기기", 1, "업종별 실제 트래픽 비중이 옆에 표시된다"], ["text=시간대", 2]],
  }));

  await page.evaluate((c) => {
    state.draft.adGroups = JSON.parse(JSON.stringify(c.adGroups));
    state.draft.name = c.name; state.draft.budget = c.budget; state.draft.maxCpc = c.maxCpc;
    state.step = 5; renderWizard();
  }, CAMPAIGN);
  M(...await shot(page, "12-wizard-groups.png", {
    marks: [[".wiz-main .card-head input", 1, "광고그룹 이름"], [".wiz-main textarea", 2, "키워드 · 한 줄에 하나"],
      [".wiz-main .tbl-wrap", 3, "입력 즉시 검색량·경쟁·적합도 표시", 6]],
  }));

  M(...await shot(page, "13-wizard-keyword-diag.png", {
    scrollEl: ".wiz-main .tbl-wrap",
    marks: [["text=판정", 1, "브랜드 검색 / 적합 / 관련 약함 / 고객 아님"]],
  }));

  await page.evaluate(() => { state.step = 6; state.agTab = 0; renderWizard(); });
  M(...await shot(page, "14-wizard-ad.png", {
    marks: [[".tabs", 1, "광고그룹마다 다른 광고", 6], ["text=최종 URL", 2],
      ["text=제목 (6/15)", 3, "제목은 8개 이상 권장"]],
  }));
  M(...await shot(page, "14b-wizard-ad-preview.png", {
    scrollEl: ".serp",
    marks: [[".serp", 1, "검색 결과에 이렇게 보인다", 6]],
  }));

  await page.evaluate(() => { state.step = 7; renderWizard(); });
  M(...await shot(page, "15-wizard-negatives.png", {
    marks: [[".wiz-main textarea", 1, "제외 키워드"], ["text=이 업종에서 흔히 제외하는 표현", 2, "클릭하면 추가"]],
  }));

  await page.evaluate(() => { state.step = 8; renderWizard(); });
  M(...await shot(page, "16-wizard-review.png", {
    marks: [[".kv", 1, "설정 요약", 6], [".banner-warn", 2, "게재 전 경고", 6]],
  }));

  /* ── 게재 후 ── */
  await page.evaluate(() => publish());
  await page.waitForTimeout(300);

  M(...await shot(page, "17-diagnostics.png", {
    marks: [[".verdict", 1, "점수와 한 줄 판정", 6], [".stat-row", 2, "핵심 지표", 6],
      [".diag", 3, "문제 · 근거 · 조치", 6]],
  }));

  M(...await shot(page, "18-diagnostics-detail.png", {
    scroll: 620,
    marks: [["text=조치", 1, "무엇을 어떻게 바꿀지"]],
  }));

  await page.evaluate(() => { go("overview"); });
  M(...await shot(page, "19-overview-chart.png", {
    scroll: 430,
    marks: [[".metric-switch", 1, "지표 전환", 6], [".chart-wrap svg", 2, "일별 추이 · 학습 기간 음영", 6]],
  }));

  await page.evaluate(() => go("adgroups"));
  M(...await shot(page, "20-adgroups.png", {
    marks: [["text=평균 품질평가점수", 1, "그룹별로 다르게 매겨진다"]],
  }));

  await page.evaluate(() => go("keywords"));
  M(...await shot(page, "21-keywords.png", {
    marks: [["text=품질평가점수", 1], ["text=광고 관련성", 2, "세 가지 구성요소"], ["text=광고그룹", 3]],
  }));

  await page.evaluate(() => go("searchterms"));
  M(...await shot(page, "22-searchterms.png", {
    marks: [[".banner-warn", 1, "낭비 비중", 6], [".chart-wrap svg", 2, "비용이 어디로 갔는가", 6],
      ["text=제외 키워드로", 3, "여기서 바로 제외"]],
  }));

  /* 무관 검색어 6개를 실제로 제외 대기에 넣는다 */
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".tbl tbody tr")];
    let n = 0;
    rows.forEach(r => {
      const tag = r.querySelector(".tag");
      if (!tag) return;
      if ((tag.textContent === "무관" || tag.textContent === "느슨함") && n < 6) {
        const b = r.querySelector("button"); if (b && !b.disabled) { b.click(); n++; }
      }
    });
  });
  await page.waitForTimeout(200);
  M(...await shot(page, "23-searchterms-queued.png", {
    scroll: 1500,
    marks: [["text=제외 키워드 적용해 다시 게재", 1, "루프의 시작"]],
  }));

  await page.evaluate(() => go("negatives"));
  M(...await shot(page, "24-negatives.png", {
    marks: [["text=추가 대기", 1, "재게재해야 반영된다", 6]],
  }));

  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(x => x.textContent.includes("제외 키워드 적용해 다시 게재"));
    b.click();
  });
  await page.waitForTimeout(300);
  M(...await shot(page, "25-compare.png", {
    marks: [["text=나란히 보기", 1, "지표 비교", 6], ["text=달라진 설정", 2, "무엇을 바꿨는지", 6]],
  }));

  /* ── 디스플레이 ── */
  await page.evaluate((c) => {
    startWizard();
    const d = state.draft;
    d.name = "홈트 디스플레이"; d.type = "display"; d.budget = 45000;
    d.adGroups = [{ name: "디스플레이", keywords: [], ad: JSON.parse(JSON.stringify(c.adGroups[0].ad)) }];
    state.step = 5; renderWizard();
  }, CAMPAIGN);
  M(...await shot(page, "26-display-targeting.png", {
    marks: [["text=잠재고객 (관심분야·구매의도)", 1, "넓지만 무관 지면이 많다"],
      ["text=게재위치 직접 지정", 2, "정확하지만 물량이 적다"],
      ["text=노출 빈도 한도 (1인당 하루 최대 노출 횟수)", 3]],
  }));

  await page.evaluate(() => publish());
  await page.waitForTimeout(300);
  await page.evaluate(() => go("placements"));
  M(...await shot(page, "27-placements.png", {
    marks: [[".banner-warn", 1, "무관 앱은 CTR이 오히려 높다", 6],
      ["text=관련도", 2], ["text=제외", 3, "여기서 지면 제외"]],
  }));

  await page.evaluate(() => go("reports"));
  M(...await shot(page, "28-reports.png", {
    marks: [["text=전체 보고서 ZIP으로 받기", 1, "CSV 7종을 한 번에"],
      ["text=일별 실적 미리보기", 2, "실제 다운로드와 같은 열 구성", 6]],
  }));

  await browser.close();
  console.log(allMiss.length ? "\n놓친 요소: " + allMiss.length + "건\n" + allMiss.join("\n") : "\n모든 하이라이트 적용됨");
})();
