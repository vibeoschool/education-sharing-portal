import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the education sharing portal and pending review card", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>오션중학교 교육자료 나눔터<\/title>/);
  assert.match(html, /수업 효율화와 업무간소화/);
  assert.match(html, /정답 보드판/);
  assert.match(html, /최은지(?:<!-- -->)? 선생님/);
  assert.match(html, /개인정보를 처리 및 보관하는 앱은 웹 배포 불가/);
  assert.match(
    html,
    /학생 혹은 교원 개인정보 관련 내용이 처리되는 경우 웹 배포 불가입니다/,
  );
  assert.match(html, /개인정보를 처리·저장하지 않는 웹앱만 등록할 수 있습니다/);
  assert.match(html, /교과 시간에 조별로 퀴즈 답을 제출하고 확인하는 수업 도구입니다\./);
  assert.match(html, /class="access-chip review">안전 검토 중<\/span>/);
  assert.match(html, /class="review-state">검토 중<\/span>/);
  assert.doesNotMatch(html, /chloechoiej|1234|학생 실명|학번 입력 금지/);
});

test("keeps review submissions non-clickable until the catalog activates them", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /id:\s*"APP-DDD053B5531F"/);
  assert.match(page, /url:\s*""/);
  assert.match(page, /status:\s*"검토 중"/);
  assert.match(page, /includeReviewMaterials/);
  assert.match(page, /material\.status !== "검토 중"/);
  assert.match(page, /catalogIds\.has\(material\.id\)/);
  assert.match(layout, /title:\s*"오션중학교 교육자료 나눔터"/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  assert.deepEqual(
    await readdir(new URL("app/_sites-preview", templateRoot)),
    [],
  );
});

test("uses a responsive four-card desktop catalog and top-aligned previews", async () => {
  const css = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /\.card-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 1120px\)[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 900px\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)[\s\S]*?\.card-grid\s*\{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(css, /object-position:\s*top center/);
});
