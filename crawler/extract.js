// 체험단 목록 페이지(HTML)에서 공고 카드를 뽑아내는 공용 로직.
// 표준 DOM API만 사용하므로 브라우저와 Node(linkedom) 양쪽에서 똑같이 동작합니다.

const SIDO = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

// 긴 이름·옛 이름 → 표준 시·도
const SIDO_ALIAS = [
  ['서울특별시', '서울'], ['서울시', '서울'], ['경기도', '경기'], ['인천광역시', '인천'],
  ['부산광역시', '부산'], ['대구광역시', '대구'], ['대전광역시', '대전'], ['광주광역시', '광주'],
  ['울산광역시', '울산'], ['세종특별자치시', '세종'], ['강원특별자치도', '강원'], ['강원도', '강원'],
  ['충청북도', '충북'], ['충청남도', '충남'], ['전북특별자치도', '전북'], ['전라북도', '전북'],
  ['전라남도', '전남'], ['전남광주', '전남'], ['경상북도', '경북'], ['경상남도', '경남'],
  ['제주특별자치도', '제주'], ['제주도', '제주'],
];

// 시·도 이름 없이 도시·동네 이름만 적힌 경우를 위한 보조 사전
const CITY_TO_SIDO = {
  경기: '수원 성남 분당 판교 용인 수지 기흥 고양 일산 부천 안양 평촌 안산 화성 동탄 평택 시흥 김포 파주 운정 의정부 광명 하남 미사 남양주 다산 별내 구리 오산 군포 의왕 이천 안성 양주 포천 여주 가평 양평 동두천 과천 연천',
  인천: '송도 청라 부평 계양 검단 영종 강화 주안 구월',
  부산: '해운대 광안리 서면 남포 기장 센텀 동래 연산 사상 영도 수영',
  대구: '동성로 수성 달서 달성 칠곡 범어 반월당',
  경남: '창원 마산 진해 김해 양산 진주 거제 통영 사천 밀양 함안 창녕 거창',
  경북: '포항 구미 경주 경산 안동 김천 영주 상주 문경 칠곡군 영천',
  충남: '천안 아산 서산 당진 논산 공주 보령 홍성 계룡 태안',
  충북: '청주 충주 제천 음성 진천 오창 오송',
  전북: '전주 군산 익산 정읍 남원 김제 완주',
  전남: '여수 순천 목포 광양 나주 무안 담양 영암 해남',
  강원: '춘천 원주 강릉 속초 동해 삼척 홍천 평창 양양',
  제주: '서귀포 애월 협재 성산',
  서울: '강남 서초 송파 강동 마포 홍대 합정 성수 용산 종로 잠실 신촌 이태원 압구정 청담 신사 여의도 영등포 구로 관악 신림 동작 노원 은평 강서 마곡 양천 목동 성북 광진 건대 동대문 중랑 도봉 강북 금천 가산 서대문 성동 왕십리 을지로 명동 망원 연남 문래 사당 교대 선릉 삼성 역삼 논현 방배 반포 한남 연희 서촌 익선 공덕 문정 천호 등촌 신당 창동 수유 미아 상봉 면목 회기 혜화 대학로 북촌 성신여대 이대 신림 봉천 낙성대 가로수길 도산 신논현 구의 자양 군자 석촌 방이 오금 길동 둔촌 고덕 상일 개포 대치 도곡 수서 일원 양재',
};
const CITY_LIST = [];
for (const [sido, words] of Object.entries(CITY_TO_SIDO)) for (const w of words.split(' ')) CITY_LIST.push([w, sido]);

const GENERIC = /^(campaign|캠페인|메인 캐러셀 링크|더보기|자세히 보기|상세보기|신청하기|바로가기|이미지|thumbnail|thumb)$/i;

function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

// 태그 경계마다 띄어쓰기를 넣어 글자를 모읍니다(블록 태그 사이 글자가 붙지 않도록)
function spacedText(el) {
  const parts = [];
  const walk = (n) => {
    for (const c of n.childNodes) {
      if (c.nodeType === 3) parts.push(c.data);
      else if (c.nodeType === 1) walk(c);
    }
  };
  walk(el);
  return clean(parts.join(' ')).replace(/\s*([\[\]])\s*/g, (m, b) => (b === '[' ? ' [' : '] ')).replace(/\s+/g, ' ').trim();
}
const squash = (s) => s.replace(/\s*([\[\]])\s*/g, '$1');

function cleanTitle(s) {
  let t = clean(s);
  t = t.replace(/^무료체험하러 가기\s*>>.*?입니다\.\s*/, '');
  t = t.replace(/\s*(신청하기|바로가기|상세보기|자세히 보기)$/, '');
  // 뒤에 붙은 D-day / 남은 기간 / 신청 현황 잘라내기
  const cut = t.search(/\s(D\s?-\s?(day|\d+)|\d+\s?일\s?남음|오늘\s?(선정\s?)?마감|마감임박|신청\s?\*{0,2}\s?[\d,]+\s?명?\s?\/)/i);
  if (cut > 4) t = t.slice(0, cut);
  return t.trim();
}

function scoreTitle(t) {
  if (!t || t.length < 2 || GENERIC.test(t) || /^https?:\/\//.test(t)) return -1;
  let s = Math.min(t.length, 40);
  if (/\[[^\]]+\]/.test(t)) s += 30;
  if (t.length > 90) s -= (t.length - 90);
  return s;
}

function findRegion(title, text) {
  const brackets = [...title.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
  const heads = [...brackets, title.slice(0, 30)];
  for (const h of heads) {
    const hit = matchSido(h);
    if (hit) return { region: hit, loc: brackets.find(b => matchSido(b)) || '' };
  }
  return { region: '', loc: '' };
}

function matchSido(h) {
  if (!h) return '';
  let best = null;
  const consider = (word, sido) => {
    const i = h.indexOf(word);
    if (i >= 0 && (best === null || i < best.i)) best = { i, sido };
  };
  for (const [a, sido] of SIDO_ALIAS) consider(a, sido);
  for (const s of SIDO) consider(s, s);
  if (best) return best.sido;
  for (const [w, sido] of CITY_LIST) consider(w, sido);
  return best ? best.sido : '';
}

function findType(text) {
  if (/기자단/.test(text)) return '기자단';
  if (/구매평/.test(text)) return '구매평';
  if (/배송형|\[배송|배송\]|재택|택배|배송딜|(^|\s)배송(\s|$)/.test(text)) return '배송';
  if (/방문형|방문딜|방문|포장|매장/.test(text)) return '방문';
  return '';
}

// 신청 인원 / 모집 인원 (경쟁률 표시용). 못 찾으면 null
function findApply(text) {
  const n = (x) => +String(x).replace(/,/g, '');
  let m = text.match(/신청\s?\*{0,2}\s?([\d,]{1,6})\s?명?\s?\/\s?(?:모집\s?)?([\d,]{1,5})\s?명?/);
  if (m) return { ap: n(m[1]), rc: n(m[2]) };
  m = text.match(/모집\s?([\d,]{1,5})\s?명?\s?[|·/,]?\s?신청\s?([\d,]{1,6})\s?명?/);
  if (m) return { ap: n(m[2]), rc: n(m[1]) };
  m = text.match(/([\d,]{1,6})\s?명?\s?신청\s?[|·/,]?\s?(?:모집\s?)?([\d,]{1,5})\s?명\s?모집/);
  if (m) return { ap: n(m[1]), rc: n(m[2]) };
  m = text.match(/모집\s?인원\s?([\d,]{1,5})\s?명?\s?[|·/,]?\s?(?:현재\s?)?신청자?\s?([\d,]{1,6})/);
  if (m) return { ap: n(m[2]), rc: n(m[1]) };
  return null;
}

function findDaysLeft(text) {
  let dd = text.match(/D\s?-\s?day\s+(\d{1,3})(?!\d)/i); // 'D-Day 2' 처럼 쓰는 사이트
  if (dd) return +dd[1];
  if (/오늘\s?(선정\s?)?마감|D\s?-\s?day|오늘까지|D-0\b/i.test(text)) return 0;
  if (/하루\s?전/.test(text)) return 1;
  // '2026/10/22 23:59:59'처럼 연도까지 적힌 마감일
  const full = text.match(/(20\d\d)[./-](\d{1,2})[./-](\d{1,2})/);
  if (full && !/(\d{1,3})\s?일\s?남음|D\s?-\s?\d/i.test(text)) {
    const today = Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
    const due = Date.UTC(+full[1], +full[2] - 1, +full[3]);
    const diff = Math.round((due - today) / 86400e3);
    if (diff >= -1 && diff < 120) return diff;
  }
  let m = text.match(/(\d{1,3})\s?일\s?남음/);
  if (m) return +m[1];
  m = text.match(/D\s?-\s?(\d{1,3})(?!\d)/i);
  if (m) return +m[1];
  return null;
}

/**
 * @param {Document} doc   파싱된 HTML 문서
 * @param {string} pageUrl 목록 페이지 주소(상대 링크 해석용)
 * @param {object} site    { detail: RegExp, titleSelector?: string }
 */
function extractCampaigns(doc, pageUrl, site) {
  for (const el of doc.querySelectorAll('script, style, noscript, template, svg')) el.remove();
  const groups = new Map();
  const idOf = new Map();
  for (const a of doc.querySelectorAll('a[href]')) {
    let u;
    try { u = new URL(a.getAttribute('href'), pageUrl).href; } catch { continue; }
    const m = u.match(site.detail);
    if (!m) continue;
    const id = m[1];
    // 공고 번호 뒤에 붙은 추적용 파라미터는 떼어냅니다
    if (!groups.has(id)) groups.set(id, { url: u.slice(0, u.indexOf(m[0]) + m[0].length), anchors: [] });
    groups.get(id).anchors.push(a);
    idOf.set(a, id);
  }

  const cardOf = (a) => {
    let card = a;
    while (card.parentElement && card.parentElement.tagName !== 'BODY' && card.parentElement.tagName !== 'HTML') {
      const p = card.parentElement;
      const ids = new Set();
      for (const x of p.querySelectorAll('a[href]')) {
        const i = idOf.get(x);
        if (i) { ids.add(i); if (ids.size > 1) break; }
      }
      if (ids.size > 1 || (p.textContent || '').length > 2500) break;
      card = p;
    }
    return card;
  };

  const items = [];
  for (const [id, g] of groups) {
    // 같은 공고가 여러 곳(배너·인기·신규)에 나오면 글자가 가장 많은 카드를 씁니다
    // 같은 공고가 여러 곳(배너·인기·신규)에 나오면, 제목 칸이 있는 카드 → 글자가 많은 카드 순으로 고릅니다
    let best = null;
    for (const a of g.anchors) {
      const c = cardOf(a);
      const len = (c.textContent || '').replace(/\s+/g, '').length;
      const hasTitle = site.titleSelector && c.querySelector(site.titleSelector) ? 1 : 0;
      if (!best || hasTitle > best.hasTitle || (hasTitle === best.hasTitle && len > best.len)) best = { card: c, len, hasTitle };
    }
    const card = best.card;
    const text = spacedText(card).replace(/무료체험하러 가기\s*>>.*?입니다\.\s*/g, '');
    if (text.length < 6) continue;
    if (/모집\s?(마감|종료)(?!\s?(임박|일|까지|\d|D\s?-))/.test(text)) continue; // 이미 마감된 카드
    if (site.closedRe && site.closedRe.test(text)) continue; // 사이트별 마감 표시
    if (site.closedSelector && card.querySelector(site.closedSelector)) continue;

    let title = '', bestScore = -1;
    if (site.titleSelector) {
      // 사이트별로 제목 위치를 알려준 경우 그 요소를 우선 사용
      // 대괄호([지역]·[브랜드])가 들어간 요소가 있으면 그것을, 없으면 첫 번째 요소를 씁니다
      const els = [...card.querySelectorAll(site.titleSelector)].map(el => cleanTitle(el.textContent)).filter(t => scoreTitle(t) >= 0);
      const t = els.find(x => /\[[^\]]+\]/.test(x)) || els[0];
      if (t) { title = t; bestScore = 1000; }
    }
    if (bestScore < 0) {
      const cands = [];
      for (const a of g.anchors) { cands.push(a.getAttribute('title')); cands.push(a.textContent); }
      for (const c of cands) {
        const t = cleanTitle(c);
        const sc = scoreTitle(t);
        if (sc > bestScore) { bestScore = sc; title = t; }
      }
    }
    if (bestScore < 0) continue;
    const baseTitle = title;
    if (site.titlePrefixFromText) {
      // 제목에 지역이 없을 때 카드 앞부분의 지역 표기를 붙여줍니다(예: 미블)
      const idx = squash(text).indexOf(squash(title));
      if (idx > 0 && !/\[/.test(title)) {
        const pre = squash(text).slice(0, idx).replace(/^(클립|릴스|배송|인스타|블로그)\s*/g, '').trim();
        if (pre && pre.length <= 25) title = `[${pre}] ${title}`;
      }
    }

    // 설명 = 카드 글자 중 제목 뒤쪽 부분
    let desc = squash(text);
    const tq = squash(baseTitle);
    const ti = desc.lastIndexOf(tq);
    if (ti >= 0) desc = desc.slice(ti + tq.length);
    desc = desc.replace(/\]/g, '] ').replace(/\s+/g, ' ');
    // 모집 인원·참여 수·해시태그 같은 군더더기는 빼고 제공 내역만 남깁니다
    desc = desc.replace(/\d+\s?인\s?(모집|참여)/g, ' ').replace(/#[^\s#]+/g, ' ').replace(/[♡♥]/g, ' ').replace(/\s+/g, ' ').trim();
    for (let k = 0; k < 3; k++) {
      desc = desc
        .replace(/^\s*(D\s?-\s?(day(\s+\d+)?|\d+)|\d+\s?일\s?남음|오늘\s?(선정\s?)?마감|오늘까지|마감임박\S*)\s*/i, '')
        .replace(/\s*(D\s?-\s?(day(\s+\d+)?|\d+)|\d+\s?일\s?남음|오늘\s?(선정\s?)?마감|마감임박\S*|신청\s?\*{0,2}[\d,]+.*)$/i, '').trim();
    }
    // 남은 기간·신청 현황·포인트가 나오는 지점부터는 잘라냅니다
    const cut = desc.search(/\s(\d+\s?일\s?남음|D\s?-\s?(day|\d)|신청\s?\d|신청마감일|\d+\s?명\s?신청|모집중|모집\s\d|모집\s?인원|\+\s?[\d,]+\s?P\b)/i);
    if (cut >= 4) desc = desc.slice(0, cut);
    desc = desc.replace(/^신청\s?대상\s?:\s?/, '대상: ').replace(/[\s|·/]+$/, '').trim();
    if (desc.length > 140) desc = desc.slice(0, 139) + '…';

    let { region, loc } = findRegion(title, text);
    if (site.regionSelector) {
      // 지역이 별도 칸에 적힌 사이트(예: 마실 '전북 부안군')
      const rt = clean(card.querySelector(site.regionSelector)?.textContent);
      const hit = matchSido(rt);
      if (hit) { region = hit; loc = ((rt.match(/\[([^\]]+)\]/) || [])[1] || rt).trim(); }
    }
    let type = site.fixedType || findType(title + ' ' + text.slice(0, 120));
    if (!type && region) type = '방문';
    // 배송·기자단·구매평은 사는 곳과 상관없이 신청할 수 있으므로 지역을 비워 둡니다
    if (type && type !== '방문' && type !== '여행지원') region = '';

    const it = { id, url: g.url, title, desc, region, loc, type, daysLeft: findDaysLeft(text) };
    const ap = findApply(text);
    if (ap && ap.rc > 0 && ap.rc < 100000) { it.ap = ap.ap; it.rc = ap.rc; }
    items.push(it);
  }
  return items;
}

const api = { extractCampaigns, cleanTitle, findRegion, findType, findDaysLeft, findApply, spacedText, SIDO };
if (typeof module !== 'undefined') module.exports = api;
if (typeof window !== 'undefined') window.__extract = api;
