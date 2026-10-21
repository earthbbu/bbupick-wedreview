// 체험단 공고 자동 수집기
// 사용법: node crawler/crawl.js <이전데이터.json> <저장할파일.json>
// GitHub Actions가 1시간마다 이 파일을 실행합니다.

const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');
const robotsParser = require('robots-parser');
const { extractCampaigns } = require('./extract');
const idKey = (site, id) => `${site.idSpace || site.key}:${id}`; // 같은 회사 사이트끼리(디너·뷰티·택배의여왕) 같은 공고는 한 번만
const SITES = require('./sites');

const BOT = 'ChehumAlimiBot';
const REPO = process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : 'local';
const UA = `Mozilla/5.0 (compatible; ${BOT}/1.0; +${REPO})`;
const KEEP_DAYS = 10;        // 마지막으로 목록에서 본 뒤 이 기간이 지나면 정리
const MAX_ITEMS = 9000;      // 파일이 너무 커지지 않도록 최대 보관 개수
const DELAY_MS = 1500;       // 같은 사이트에 연달아 요청할 때 쉬는 시간

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function kstDate(offsetDays = 0, base = Date.now()) {
  const d = new Date(base + 9 * 3600e3 + offsetDays * 86400e3);
  return d.toISOString().slice(0, 10);
}

async function fetchText(url, extra = {}, method = 'GET', body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9', Accept: 'text/html,*/*;q=0.8', ...extra },
      redirect: 'follow',
      signal: ctrl.signal,
      method,
      ...(body != null ? { body } : {}),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    let charset = (res.headers.get('content-type') || '').match(/charset=([\w-]+)/i)?.[1];
    if (!charset) charset = buf.subarray(0, 2048).toString('latin1').match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
    let text;
    try { text = new TextDecoder(charset || 'utf-8').decode(buf); } catch { text = buf.toString('utf8'); }
    return { status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

const robotsCache = new Map();
async function getRobots(url) {
  const origin = new URL(url).origin;
  if (!robotsCache.has(origin)) {
    const robotsUrl = origin + '/robots.txt';
    let body = '';
    let failed = false;
    try {
      const r = await fetchText(robotsUrl);
      if (r.status >= 200 && r.status < 300) body = r.text;
      else if (r.status >= 500) { body = 'User-agent: *\nDisallow: /'; failed = true; } // 서버 오류면 이번엔 쉬어갑니다
    } catch {
      body = 'User-agent: *\nDisallow: /';
      failed = true;
    }
    const parser = robotsParser(robotsUrl, body);
    parser.__failed = failed;
    robotsCache.set(origin, parser);
  }
  return robotsCache.get(origin);
}

async function crawlSite(site) {
  const report = { key: site.key, name: site.name, home: site.home, ok: false, found: 0, pages: 0, skipped: [], error: '' };
  const found = new Map();
  for (const url of site.lists) {
    const robots = await getRobots(url);
    if (robots.__failed) { report.error = '사이트에 접속하지 못해 이번 회차는 건너뛰었어요'; continue; }
    if (robots.isAllowed(url, BOT) === false) { report.skipped.push(url); continue; }
    const delay = Math.max(DELAY_MS, (robots.getCrawlDelay(BOT) || 0) * 1000);
    try {
      const { status, text } = await fetchText(url, site.headers, site.method || 'GET', site.body);
      if (status !== 200) throw new Error(`HTTP ${status}`);
      let items;
      if (site.fromJson) {
        items = site.fromJson(JSON.parse(text), url);
      } else {
        const { document } = parseHTML(text);
        items = site.parse ? site.parse(document, url) : extractCampaigns(document, url, site);
      }
      for (const it of items) if (!found.has(it.id)) found.set(it.id, it);
      report.pages++;
    } catch (e) {
      report.error = `${url} → ${e.name === 'AbortError' ? '응답 시간 초과' : e.message}`;
    }
    await sleep(delay);
  }
  report.found = found.size;
  report.ok = report.pages > 0 && found.size > 0;
  if (report.pages > 0 && found.size === 0 && !report.error) report.error = '목록은 열렸지만 공고를 찾지 못했어요 (사이트 구조가 바뀌었을 수 있어요)';
  return { report, items: [...found.values()] };
}

async function main() {
  const [prevPath, outPath] = process.argv.slice(2);
  let prev = { items: [] };
  try { prev = JSON.parse(fs.readFileSync(prevPath, 'utf8')); } catch { /* 첫 실행 */ }
  const spaceOf = Object.fromEntries(SITES.map((s) => [s.key, s.idSpace || s.key]));
  const byKey = new Map((prev.items || []).map((x) => [`${spaceOf[x.s] || x.s}:${x.id}`, x]));

  const now = new Date().toISOString();
  const today = kstDate();
  const reports = [];
  const results = await Promise.all(SITES.map((s) => crawlSite(s).catch((e) => ({ report: { key: s.key, name: s.name, home: s.home, ok: false, found: 0, pages: 0, skipped: [], error: e.message }, items: [] }))));

  for (const [i, { report, items }] of results.entries()) {
    const site = SITES[i];
    let fresh = 0;
    for (const it of items) {
      const key = idKey(site, it.id);
      const old = byKey.get(key);
      if (old && old.s !== site.key) { old.ls = now; continue; } // 자매 사이트에서 먼저 담은 공고는 그쪽 링크를 그대로 둡니다
      const dl = it.daysLeft == null ? (old?.dl ?? null) : kstDate(it.daysLeft);
      const rec = {
        s: site.key, id: it.id, u: it.url, t: it.title, d: it.desc,
        r: it.region, l: it.loc, k: it.type, dl,
        f: old?.f || now, ls: now,
      };
      if (it.rc) { rec.ap = it.ap; rec.rc = it.rc; } // 신청 인원 / 모집 인원
      if (!old) fresh++;
      byKey.set(key, rec);
    }
    report.newCount = fresh;
    reports.push(report);
    const msg = report.ok ? `${report.found}건 (새 공고 ${fresh})` : `실패 – ${report.error || '허용된 목록 없음'}`;
    console.log(`[${site.name}] ${msg}${report.skipped.length ? ` · robots.txt로 건너뜀 ${report.skipped.length}` : ''}`);
  }

  const minSeen = Date.now() - KEEP_DAYS * 86400e3;
  const yesterday = kstDate(-1);
  let items = [...byKey.values()].filter((x) => Date.parse(x.ls) >= minSeen && (!x.dl || x.dl >= yesterday));
  items.sort((a, b) => (a.f < b.f ? 1 : a.f > b.f ? -1 : 0));
  items = items.slice(0, MAX_ITEMS);

  const out = { updatedAt: now, today, sites: reports, total: items.length, items };
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out));
  console.log(`저장 완료: 총 ${items.length}건 → ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
