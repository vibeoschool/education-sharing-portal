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
