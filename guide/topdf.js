/* guide.html → PDF  ·  사용: node guide/topdf.js */
const { chromium } = require("/Users/jaewoochoi/.claude/skills/gstack/node_modules/playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const src = "file://" + path.join(__dirname, "guide.html");
  await page.goto(src, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const out = path.join(__dirname, "Google-Ads-실습-가이드.pdf");
  await page.pdf({
    path: out,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", right: "14mm", bottom: "16mm", left: "14mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font-size:7pt;color:#9aa0a6;padding:0 14mm;
      font-family:'Apple SD Gothic Neo',sans-serif;">Google Ads 검색·디스플레이 광고 실습 가이드</div>`,
    footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#9aa0a6;padding:0 14mm;text-align:center;
      font-family:'Apple SD Gothic Neo',sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });
  await browser.close();
  console.log("생성: " + out);
})();
