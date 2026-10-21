// 수집할 체험단 사이트 목록
// - lists : 새 공고가 올라오는 "목록" 페이지 주소들 (상세 페이지는 열지 않습니다)
// - detail: 공고 상세 링크 모양. 괄호 ( ) 안의 숫자가 공고 번호가 됩니다.
// - titleSelector: (선택) 카드 안에서 제목이 들어 있는 태그
// 각 사이트의 robots.txt 규칙은 수집할 때마다 자동으로 확인하고, 막혀 있는 주소는 건너뜁니다.

const { findRegion, findDaysLeft, findApply, spacedText, cleanTitle } = require('./extract');

// 오늘(한국 날짜)부터 'YYYY-MM-DD…' 날짜까지 남은 날
const kstToday = () => Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
const daysTo = (d) => (d ? Math.round((Date.parse(String(d).slice(0, 10)) - kstToday()) / 86400e3) : null);
const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
// '[지역] 이름' 형태 제목 만들기 (방문형만 지역을 붙여요)
function placeTitle(place, name, type) {
  const p = String(place || '').replace(/\s*·\s*/g, ' ').trim();
  return type === '방문' && p && !/^\[/.test(name) ? `[${p}] ${name}` : name;
}
function finish(it) {
  const r = findRegion(it.title, '');
  if (!it.region) { it.region = r.region; it.loc = it.loc || r.loc; }
  if (it.type !== '방문') it.region = '';
  it.desc = String(it.desc || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  return it;
}

const gangnamPages = [1, 2, 3].map(
  (p) => `https://xn--939au0g4vj8sq.net/theme/go/_list_cmp_tpl.php?sst=wr_datetime&sod=desc&rpage=${p}&row_num=28`
);

module.exports = [
  {
    key: 'reviewnote',
    name: '리뷰노트',
    home: 'https://www.reviewnote.co.kr',
    lists: ['https://www.reviewnote.co.kr/campaigns?s=new'],
    detail: /reviewnote\.co\.kr\/campaigns\/(\d+)/,
  },
  {
    key: 'gangnam',
    name: '강남맛집',
    home: 'https://강남맛집.net',
    lists: gangnamPages,
    detail: /xn--939au0g4vj8sq\.net\/cp\/\?id=(\d+)/,
  },
  {
    key: 'dinnerqueen',
    name: '디너의여왕',
    home: 'https://dinnerqueen.net',
    lists: ['https://dinnerqueen.net/taste?order=new'],
    detail: /dinnerqueen\.net\/taste\/(\d+)/,
    idSpace: 'queens',
  },
  {
    key: 'bqueens',
    name: '뷰티의여왕',
    home: 'https://bqueens.net',
    lists: ['https://bqueens.net/taste?order=new'],
    detail: /bqueens\.net\/taste\/(\d+)/,
    titleSelector: 'h5',
    idSpace: 'queens',
  },
  {
    key: 'tqueens',
    name: '택배의여왕',
    home: 'https://tqueens.net',
    lists: ['https://tqueens.net/taste?order=new'],
    detail: /tqueens\.net\/taste\/(\d+)/,
    idSpace: 'queens',
  },
  {
    key: 'seoulouba',
    name: '서울오빠',
    home: 'https://www.seoulouba.co.kr',
    // robots.txt가 첫 화면만 허용하므로 첫 화면(오늘 오픈 · MD추천 등)만 봅니다
    lists: ['https://www.seoulouba.co.kr/'],
    detail: /seoulouba\.co\.kr\/campaign\/\?c=(\d+)/,
  },
  {
    key: 'ringble',
    name: '링블',
    home: 'https://www.ringble.co.kr',
    lists: ['https://www.ringble.co.kr/'],
    detail: /ringble\.co\.kr\/detail\.php\?number=(\d+)/,
  },
  {
    key: 'mrblog',
    name: '미블',
    home: 'https://www.mrblog.net',
    lists: ['https://www.mrblog.net/'],
    detail: /mrblog\.net\/campaigns\/(\d+)/,
    titleSelector: 'strong',
    titlePrefixFromText: true,
  },
  {
    key: 'cometoplay',
    name: '놀러와체험단',
    home: 'https://www.cometoplay.kr',
    lists: [
      'https://www.cometoplay.kr/',
      'https://www.cometoplay.kr/item_list.php?category_id=001',
      'https://www.cometoplay.kr/item_list.php?category_id=002',
    ],
    detail: /cometoplay\.kr\/item\.php\?it_id=(\d+)/,
  },
  {
    key: '4blog',
    name: '포블로그',
    home: 'https://4blog.net',
    lists: ['https://4blog.net/', 'https://4blog.net/list/all/local', 'https://4blog.net/list/all/deliv'],
    detail: /4blog\.net\/campaign\/(\d+)/,
    titleSelector: 'span',
  },
  {
    key: 'cloudreview',
    name: '클라우드리뷰',
    home: 'https://www.cloudreview.co.kr',
    lists: [
      'https://www.cloudreview.co.kr/',
      'https://www.cloudreview.co.kr/campaign/blog',
      'https://www.cloudreview.co.kr/campaign/instagram',
      'https://www.cloudreview.co.kr/campaign/short',
    ],
    detail: /cloudreview\.co\.kr\/campaign\/detail\/(\d+)/,
    titleSelector: 'div.truncate',
  },
  {
    key: 'modublog',
    name: '모블',
    home: 'https://www.modublog.co.kr',
    // robots.txt가 첫 화면만 허용
    lists: ['https://www.modublog.co.kr/'],
    detail: /modublog\.co\.kr\/product\/(\d+)/,
    titleSelector: '.c_title',
  },
  {
    key: 'tble',
    name: '티블',
    home: 'https://tble.kr',
    // robots.txt가 목록·상세 페이지를 막아 첫 화면만 봅니다
    lists: ['https://tble.kr/'],
    detail: /tble\.kr\/view\.php\?cp_id=(\d+)/,
    titleSelector: '.t2',
  },
  {
    key: 'storyn',
    name: '스토리앤미디어',
    home: 'https://www.storyn.kr',
    // robots.txt가 목록 페이지를 막아 첫 화면만 봅니다
    lists: ['https://www.storyn.kr/'],
    detail: /storyn\.kr\/review_campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'gaboja',
    name: '가보자체험단',
    home: 'https://www.가보자체험단.com',
    // robots.txt가 목록 페이지를 막아 첫 화면(인기 캠페인)만 봅니다
    lists: ['https://www.xn--o39a04kpnjo4k9hgflp.com/'],
    detail: /xn--o39a04kpnjo4k9hgflp\.com\/cmp\/\?id=(\d+)/,
    titleSelector: 'dt',
  },
  {
    key: 'reviewplace',
    name: '리뷰플레이스',
    home: 'https://www.reviewplace.co.kr',
    // robots.txt가 첫 화면만 허용 (실시간 인기 캠페인)
    lists: ['https://www.reviewplace.co.kr/'],
    detail: /reviewplace\.co\.kr\/pr\/\?id=(\d+)/,
    titleSelector: '.tit',
  },
  {
    key: 'cherrycook',
    name: '체리쿡',
    home: 'https://cherry-cook.com',
    lists: ['https://cherry-cook.com/'],
    detail: /cherry-cook\.com\/item\/(\d+)/,
    titleSelector: '.item-product',
  },
  {
    key: 'chvu',
    name: '체험뷰',
    home: 'https://chvu.co.kr',
    // 첫 화면이 불러오는 공개 목록 데이터(신규·인기·마감임박)를 읽습니다. 상세 페이지는 robots.txt대로 열지 않아요.
    lists: ['newly', 'popular', 'imminent'].map((c) => `https://chvu.co.kr/v2/campaigns?category=${c}&page=1`),
    fromJson: (json) => {
      const TYPE = { visit: '방문', delivery: '배송', report: '기자단', purchase: '구매평' };
      const todayKst = Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
      return (json.data || []).map((c) => {
        const title = String(c.title || '').trim();
        const type = TYPE[c.activity] || '';
        let { region, loc } = findRegion(title, '');
        if (type && type !== '방문') region = '';
        const closeKst = c.closeAt ? Date.parse(new Date(c.closeAt + 9 * 3600e3).toISOString().slice(0, 10)) : null;
        return {
          id: String(c.campaignId),
          url: `https://chvu.co.kr/campaign/${c.campaignId}`,
          title,
          desc: String(c.subtitle || '').trim().slice(0, 140),
          region, loc, type,
          daysLeft: closeKst == null ? null : Math.round((closeKst - todayKst) / 86400e3),
        };
      }).filter((x) => x.title);
    },
  },
  {
    // 레뷰: 전체 목록은 로그인해야 보여서, 로그인 없이 첫 화면에 공개되는 4개 목록(신청 급상승·마감 임박·선정 많은·프리미어)만 읽어요.
    // 매시간 바뀌는 목록이라 시간이 지날수록 쌓여요. api.weble.net의 robots.txt는 모두 허용이에요.
    key: 'revu',
    name: '레뷰',
    home: 'https://www.revu.net',
    lists: ['trending', 'deadline', 'high-selection', 'premier'].map((c) => `https://api.weble.net/v1/campaigns/${c}`),
    headers: { Accept: 'application/json', Origin: 'https://www.revu.net', Referer: 'https://www.revu.net/' },
    fromJson: (json) => {
      const todayKst = Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
      return (json.items || []).filter((c) => c && c.status === 'REQUEST' && c.privacy === 'everyone').map((c) => {
        const title = String(c.item || c.title || '').trim();
        const cat = String(c.category || '');
        const type = /기자단/.test(cat) ? '기자단' : /배송형/.test(cat) ? '배송' : /방문형/.test(cat) ? '방문' : '';
        const addr = (c.venue && c.venue.addressFirst) || '';
        let { region, loc } = findRegion(title, '');
        if (!region && addr) { const r = findRegion(`[${addr.split(' ').slice(0, 2).join(' ')}]`, ''); region = r.region; loc = r.loc; }
        if (type !== '방문') region = '';
        const end = c.requestEndedOn ? Date.parse(c.requestEndedOn) : null;
        const it = {
          id: String(c.id),
          url: `https://www.revu.net/campaign/${c.id}`,
          title,
          desc: String((c.campaignData && c.campaignData.reward) || '').trim().slice(0, 140),
          region, loc, type,
          daysLeft: end == null ? null : Math.max(0, Math.round((end - todayKst) / 86400e3)),
        };
        const ap = c.campaignStats && c.campaignStats.requestCount;
        if (ap != null && c.reviewerLimit) { it.ap = ap; it.rc = c.reviewerLimit; }
        return it;
      }).filter((x) => x.title);
    },
  },
  {
    // 오마이블로그: 첫 화면이 불러오는 공개 '신규 캠페인' 목록 데이터를 읽어요 (robots.txt 허용 범위).
    key: 'ohmyblog',
    name: '오마이블로그',
    home: 'https://ohmyblog.co.kr',
    lists: ['https://ohmyblog.co.kr/api/web/campaign/new?limit=999'],
    headers: { Accept: 'application/json', Referer: 'https://ohmyblog.co.kr/' },
    fromJson: (json) => {
      const TYPE = { A: '방문', B: '배송', C: '방문', D: '기자단', F: '기자단' };
      const todayKst = Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
      const list = (json && json.data && json.data.campaigns) || [];
      return list.map((c) => {
        const name = String(c.app_companyName || '').trim();
        const sub = String(c.app_title || '').trim();
        const title = name || sub;
        const type = TYPE[c.app_type] || '';
        let { region, loc } = findRegion(title, '');
        if (type !== '방문') region = '';
        const end = c.app_recruitEndDate ? Date.parse(c.app_recruitEndDate) : null;
        const desc = String(c.supplyItem || (sub !== title ? sub : '') || '').trim().slice(0, 140);
        return {
          id: String(c.app_seq),
          url: `https://ohmyblog.co.kr/productDetail.apsl?app_seq=${c.app_seq}`,
          title, desc, region, loc, type,
          daysLeft: end == null ? null : Math.round((end - todayKst) / 86400e3),
        };
      }).filter((x) => x.title && x.id && (x.daysLeft == null || x.daysLeft >= 0));
    },
  },
  {
    key: 'dailyview',
    name: '데일리뷰',
    home: 'https://dailyview.kr',
    lists: ['https://dailyview.kr/', 'https://dailyview.kr/review_campaign_list.php',
      ...['001A', '002A', '373A', '396A', '399A'].map((c) => `https://dailyview.kr/review_campaign_list.php?category_id=${c}`)],
    detail: /dailyview\.kr\/review_campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'chehumdan',
    name: '체험단닷컴',
    home: 'https://chehumdan.com',
    lists: ['https://chehumdan.com/', 'https://chehumdan.com/category.php?category=829', 'https://chehumdan.com/category.php?category=832'],
    detail: /chehumdan\.com\/detail\.php\?number=(\d+)/,
    titleSelector: '.list-tit',
    regionSelector: '.list-day',
  },
  {
    // 체블: 첫 화면이 불러오는 공개 목록 데이터(최신순·마감임박순)를 읽어요. robots.txt 제한 없음.
    key: 'cheble',
    name: '체블',
    home: 'https://www.cheble.net',
    lists: [
      ...[1, 2, 3, 4, 5].map((p) => `https://www.cheble.net/api/campaigns/getCampaigns?pageType=${encodeURIComponent('최신순')}&count=20&page=${p}`),
      `https://www.cheble.net/api/campaigns/getCampaigns?pageType=${encodeURIComponent('마감임박순')}&count=20&page=1`,
    ],
    headers: { Accept: 'application/json', Referer: 'https://www.cheble.net/' },
    fromJson: (json) => {
      const TYPE = { 방문형: '방문', 배송형: '배송', 기자단: '기자단', 구매형: '구매평' };
      const todayKst = Date.parse(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
      const list = (json && json.data && json.data.campaigns) || [];
      return list.filter((c) => c.isRecruiting !== false).map((c) => {
        const type = TYPE[c.campaignType] || '';
        const place = [c.addressRegion, c.addressDistrict].filter(Boolean).join(' ');
        const name = String(c.campaignName || '').trim();
        const title = type === '방문' && place ? `[${place}] ${name}` : name;
        let { region, loc } = findRegion(title, '');
        if (type !== '방문') region = '';
        const endStr = c.extendEndDate || c.recruitmentEndDate;
        const end = endStr ? Date.parse(String(endStr).slice(0, 10)) : null;
        const it = {
          id: String(c.campaignId),
          url: `https://www.cheble.net/campaigns/${c.campaignId}/`,
          title, desc: String(c.serviceOffered || '').trim().slice(0, 140), region, loc, type,
          daysLeft: end == null ? null : Math.round((end - todayKst) / 86400e3),
        };
        if (c.requiredReviewers) { it.ap = c.currentReviewers || 0; it.rc = c.requiredReviewers; }
        return it;
      }).filter((x) => x.title && (x.daysLeft == null || x.daysLeft >= 0));
    },
  },
  {
    key: 'weddingmate',
    name: '웨딩메이트',
    home: 'https://www.weddingmate.co.kr',
    lists: ['https://www.weddingmate.co.kr/campaigns?sort=latest'],
    detail: /weddingmate\.co\.kr\/campaigns\/([a-z0-9]{10,})/,
    titleSelector: 'h3',
  },
  {
    key: 'assaview',
    name: '아싸뷰',
    home: 'https://assaview.co.kr',
    lists: ['https://assaview.co.kr/', 'https://assaview.co.kr/campaign_list?orderby=cp_sdatetime'],
    detail: /assaview\.co\.kr\/campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.subject',
  },
  {
    key: 'huki',
    name: '후키',
    home: 'https://huki.co.kr',
    lists: [
      'https://huki.co.kr/',
      'https://huki.co.kr/theme/huki/skin/board/gallery/visit_campaign_list.php',
      'https://huki.co.kr/theme/huki/skin/board/gallery/delivery_type_list.php',
    ],
    detail: /huki\.co\.kr\/bbs\/board\.php\?bo_table=campaign&(?:sti=&)?wr_id=(\d+)/,
    titleSelector: '.t_tit',
  },
  {
    key: 'modootogether',
    name: '모두모여체험단',
    home: 'https://modootogether.com',
    lists: ['https://modootogether.com/', 'https://modootogether.com/campaign_list.php?category_id=001A', 'https://modootogether.com/campaign_list.php?category_id=002A'],
    detail: /modootogether\.com\/campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'bloglab',
    name: '블로그랩',
    home: 'https://bloglab.kr',
    lists: ['https://bloglab.kr/', 'https://bloglab.kr/campaign_list.php?category_id=001A', 'https://bloglab.kr/campaign_list.php?category_id=002A'],
    detail: /bloglab\.kr\/campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'realreview',
    name: '리얼리뷰',
    home: 'https://www.real-review.kr',
    lists: [1, 2].map((p) => `https://www.real-review.kr/explore/?sort=started&page=${p}`),
    detail: /real-review\.kr\/project\/([-_A-Za-z0-9]{10,})/,
  },
  {
    key: 'fromblog',
    name: '블로그주민센터',
    home: 'https://www.from-blog.com',
    lists: [1, 2].map((p) => `https://www.from-blog.com/explore/?sort=started&page=${p}`),
    detail: /from-blog\.com\/project\/([-_A-Za-z0-9]{10,})/,
  },
  {
    key: 'tojobcn',
    name: '투잡커넥트',
    home: 'https://www.tojobcn.com',
    lists: ['blog_go', 'blog_go1', 'reviewsell'].map((b) => `https://www.tojobcn.com/bbs/board.php?bo_table=${b}`),
    // 게시판이 3개라 '게시판+글번호'를 공고 번호로 씁니다
    detail: /tojobcn\.com\/bbs\/board\.php\?bo_table=((?:blog_go1?|reviewsell)&wr_id=\d+)/,
  },
  {
    key: 'tagby',
    name: '태그바이',
    home: 'https://tagby.io',
    lists: ['https://tagby.io/recruit'],
    detail: /tagby\.io\/recruit\/(\d+)/,
  },
  {
    key: 'openreview',
    name: '오픈리뷰',
    home: 'https://openreview.kr',
    lists: ['https://openreview.kr/'],
    detail: /openreview\.kr\/main\/m\/page\/exp_view\.php\?ex_idx=(\d+)/,
    titleSelector: '.card-title',
    closedRe: /^(\d+\s)?마감\s/, // 카드 앞 배지가 '마감'이면 끝난 공고
  },
  {
    // 체험단이 아니라 지자체·공공기관의 여행 지원(여행비 환급, 숙박 할인, 워케이션 등) 모음입니다.
    // 신혼여행·여행 키워드로 찾을 때 함께 보이도록 넣었습니다.
    key: 'masil',
    name: '마실(여행지원)',
    home: 'https://masil.io',
    lists: [1, 2, 3, 4, 5, 6, 7, 8].map((p) => (p === 1 ? 'https://masil.io/programs' : `https://masil.io/programs?page=${p}`)),
    detail: /masil\.io\/programs\/([0-9a-f-]{36})/,
    titleSelector: 'h3',
    regionSelector: '.text-campaign',
    fixedType: '여행지원',
    closedRe: /(^|\s)마감(?!\s?임박)\s/,
  },
  // ───── 2026-10 추가: 다른 모아보기 사이트들이 모으는 곳 중 robots.txt가 허용하는 곳 ─────
  {
    key: 'keyplat',
    name: '키플랫',
    home: 'https://keyplat.net',
    lists: ['https://keyplat.net/', 'https://keyplat.net/review_campaign_list.php',
      ...['001A', '002A', '020A', '055A'].map((c) => `https://keyplat.net/review_campaign_list.php?category_id=${c}`)],
    detail: /keyplat\.net\/review_campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'chehumy',
    name: '체허미',
    home: 'https://chehumy.io',
    lists: ['https://chehumy.io/', 'https://chehumy.io/review_campaign_list.php',
      ...['001A', '002A', '003A'].map((c) => `https://chehumy.io/review_campaign_list.php?category_id=${c}`)],
    detail: /chehumy\.io\/review_campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'themukja',
    name: '더먹자',
    home: 'https://themukja.com',
    lists: ['https://themukja.com/', 'https://themukja.com/review_campaign_list.php',
      ...['001A', '002A'].map((c) => `https://themukja.com/review_campaign_list.php?category_id=${c}`)],
    detail: /themukja\.com\/review_campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    key: 'yogitg',
    name: '요깃지',
    home: 'https://yogitg.co.kr',
    lists: ['https://yogitg.co.kr/', 'https://yogitg.co.kr/review_campaign_list.php'],
    detail: /yogitg\.co\.kr\/review_campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    // 상세 페이지(campaign.php)는 robots.txt로 막혀 있어 열지 않고, 목록만 읽어요.
    key: 'reviewwave',
    name: '리뷰웨이브',
    home: 'https://www.reviewwave.kr',
    lists: ['https://www.reviewwave.kr/', 'https://www.reviewwave.kr/campaign_list.php?category_id=002A'],
    detail: /reviewwave\.kr\/campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    // 목록 페이지는 주요 검색엔진에 막아둬서 첫 화면만 읽어요.
    key: 'metachehum',
    name: '메타체험단',
    home: 'https://meta-chehumdan.com',
    lists: ['https://meta-chehumdan.com/'],
    detail: /meta-chehumdan\.com\/campaign\.php\?cp_id=(\d+)/,
    titleSelector: '.it_name',
  },
  {
    // 대구·부산 등 경상권 체험단
    key: 'enolja',
    name: '이놀자 데뷰',
    home: 'https://enolja.com/newdevu/',
    lists: [
      ...[1, 2, 3].map((p) => `https://enolja.com/newdevu/main.html?is_back=false&page=${p}`),
      ...[21, 22, 23, 24, 25].map((c) => `https://enolja.com/newdevu/main.html?dv_cate=${c}`),
    ],
    detail: /enolja\.com\/dv\/(\d+)/,
    titleSelector: '.overlay .title',
    regionSelector: '.area',
    closedSelector: '.status.release, .status.reserve, .status.review, .status.complete',
  },
  {
    key: 'reviewtong',
    name: '리뷰통',
    home: 'https://www.reviewtong.co.kr',
    lists: ['https://www.reviewtong.co.kr/main.php'],
    detail: /reviewtong\.co\.kr\/campaign\/(?:visit|editor|product)\.php\?ptype=view&idx=(\d+)/,
    titleSelector: 'h6',
  },
  {
    // 잠자리체험단: 호텔·숙소 위주
    key: 'alljam',
    name: '잠자리체험단',
    home: 'https://alljam.co.kr',
    lists: ['https://alljam.co.kr/'],
    detail: /alljam\.co\.kr\/experiences\/(\d+)/,
    titleSelector: '.fig_txt1',
  },
  {
    // 어디야: 카드에 링크 대신 클릭 동작이 걸려 있어 따로 읽어요.
    key: 'odiya',
    name: '어디야',
    home: 'https://odiya.kr',
    lists: [829, 832, 1020, 1016, 834, 1023, 1018].map((c) => `https://odiya.kr/category.php?category=${c}`),
    parse: (doc, url) => {
      const TYPE = { 829: '방문', 832: '방문', 1023: '방문', 1020: '배송', 1016: '배송', 834: '기자단' };
      const cat = new URL(url).searchParams.get('category');
      const out = [];
      for (const row of doc.querySelectorAll('.over_row')) {
        const tbl = [...row.children].find((el) => el.tagName === 'TABLE' && /number=\d+/.test(el.getAttribute('onclick') || ''));
        if (!tbl) continue;
        const id = (tbl.getAttribute('onclick').match(/number=(\d+)/) || [])[1];
        const text = spacedText(tbl);
        const daysLeft = findDaysLeft(text);
        if (daysLeft == null && /마감/.test(text)) continue;
        const title = cleanTitle(txt(tbl.querySelector('td.letter_s2 strong, td.letter_s2')));
        if (!id || !title) continue;
        const it = finish({
          id, url: `https://odiya.kr/detail.php?number=${id}&category=${cat}`, title,
          desc: txt(tbl.querySelector('td.font_14')), type: /기자단/.test(title) ? '기자단' : (TYPE[cat] || ''), daysLeft,
        });
        const ap = findApply(text); if (ap) { it.ap = ap.ap; it.rc = ap.rc; }
        out.push(it);
      }
      return out;
    },
  },
  {
    // 파블로: 매장 이름 일부를 가려서(예: 노O즌) 보여주는 사이트예요.
    key: 'pavlovu',
    name: '파블로',
    home: 'https://pavlovu.com',
    lists: ['001A', '002A', '003A'].map((c) => `https://pavlovu.com/review_campaign_list.php?category_id=${c}`),
    parse: (doc, url) => {
      const TYPE = { '001A': '배송', '002A': '방문', '003A': '기자단' };
      const cat = new URL(url).searchParams.get('category_id');
      const out = [];
      for (const li of doc.querySelectorAll('li.pvli')) {
        const a = li.querySelector('a[href*="cp_id="]');
        const id = a && (a.getAttribute('href').match(/cp_id=(\d+)/) || [])[1];
        if (!id) continue;
        const type = TYPE[cat] || '';
        const place = txt(li.querySelector('.pvc_pn')).split('·')[0].trim();
        const store = txt(li.querySelector('.pvc_store'));
        const offer = txt(li.querySelector('.pvc_tx strong'));
        const badge = txt(li.querySelector('.pvc_bg'));
        const it = finish({
          id, url: `https://pavlovu.com/review_campaign.php?cp_id=${id}`,
          title: placeTitle(type === '방문' ? place : '', store || offer, type),
          desc: store ? offer : '', type, daysLeft: findDaysLeft(badge),
        });
        const rc = (txt(li.querySelector('.pvc_mt')).match(/(\d+)\s?명/) || [])[1];
        if (rc) it.rcOnly = +rc;
        out.push(it);
      }
      return out;
    },
  },
  {
    // 스타일씨: 첫 화면이 불러오는 공개 목록 데이터 (api2.stylec.co.kr에는 robots.txt 제한이 없어요)
    key: 'stylec',
    name: '스타일씨',
    home: 'https://www.stylec.co.kr',
    lists: [1, 2, 3].map((p) => `https://api2.stylec.co.kr:6439/v1/trial?order=default&page=${p}&count=200&include_finish=false`),
    headers: { Accept: 'application/json', Origin: 'https://www.stylec.co.kr', Referer: 'https://www.stylec.co.kr/' },
    fromJson: (json) => {
      const list = (json && json.data && json.data.data) || [];
      return list.map((c) => {
        const label = String(c.wr_type_label || '');
        const cat = String(c.ca_name || '');
        const type = /기자단/.test(label) ? '기자단' : /구매평|페이백/.test(label) ? '구매평' : cat === '방문' ? '방문' : '배송';
        const it = finish({
          id: String(c.wr_id), url: `https://www.stylec.co.kr${c.link || `/trials/${c.wr_id}`}`,
          title: String(c.wr_subject || '').trim(), desc: [label, cat].filter(Boolean).join(' · '), type,
          daysLeft: daysTo(c.finday),
        });
        if (c.tr_recruit_max) { it.ap = +c.tr_enroll_cnt || 0; it.rc = +c.tr_recruit_max; }
        return it;
      }).filter((x) => x.title && (x.daysLeft == null || x.daysLeft >= 0));
    },
  },
  {
    // 똑똑리워드: 공개 캠페인 목록 데이터 (robots.txt 허용)
    key: 'ddok',
    name: '똑똑리워드',
    home: 'https://ddok.it',
    lists: ['https://ddok.it/api/campaigns?limit=200'],
    headers: { Accept: 'application/json', Referer: 'https://ddok.it/' },
    fromJson: (json) => (json.campaigns || []).filter((c) => c.status === 'recruiting').map((c) => {
      const v = c.visitInfo || {};
      const d = c.deliveryInfo || {};
      const ch = (c.channels || []).join(',');
      const type = c.campaignType === 'visit' ? '방문' : c.campaignType === 'press' ? '기자단' : /purchase_review/.test(ch) ? '구매평' : '배송';
      const name = String(v.companyName || d.productName || c.title || '').trim();
      const it = finish({
        id: String(c.id), url: `https://ddok.it/campaigns/${c.id}`,
        title: placeTitle(c.region, name, type), desc: v.experienceBenefits || d.productName || '', type,
        daysLeft: daysTo(c.recruitDeadline || c.deadline),
      });
      if (c.maxInfluencers) { it.ap = +c.currentApplicants || 0; it.rc = +c.maxInfluencers; }
      return it;
    }).filter((x) => x.title && (x.daysLeft == null || x.daysLeft >= 0)),
  },
  {
    // 후기업: 첫 화면 공개 목록 데이터 (POST 방식, robots.txt 전체 허용)
    key: 'whogiup',
    name: '후기업',
    home: 'https://www.whogiup.com',
    lists: ['https://www.whogiup.com/api/mainPageUntil'],
    method: 'POST',
    body: '{}',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Origin: 'https://www.whogiup.com', Referer: 'https://www.whogiup.com/' },
    fromJson: (json) => (json.data || []).filter((c) => !+c.is_ended).map((c) => {
      const cat = String(c.category || '');
      const type = /방문/.test(cat) ? '방문' : /배송|제품/.test(cat) ? '배송' : /셀프|구매/.test(cat) ? '구매평' : '';
      const it = finish({
        id: String(c.campaign_id), url: `https://www.whogiup.com/details?idx=${c.campaign_id}`,
        title: String(c.title || '').trim(), desc: c.product || '', type,
        daysLeft: c.dday != null && c.dday !== '' ? +c.dday : daysTo(c.reg_end),
      });
      if (c.required_num) { it.ap = +c.applied_num || 0; it.rc = +c.required_num; }
      return it;
    }).filter((x) => x.title && (x.daysLeft == null || x.daysLeft >= 0)),
  },
  {
    // 체리뷰: 공개 목록 데이터
    key: 'cherivu',
    name: '체리뷰',
    home: 'https://cherivu.co.kr',
    lists: [
      ...[1, 2, 3, 4, 5].map((p) => `https://api.cherivu.co.kr/api/campaigns?page=${p}&ongoing=1&premium=0&order_by=application_finished_at&take=100`),
      'https://api.cherivu.co.kr/api/campaigns?page=1&ongoing=1&premium=1&take=100',
    ],
    headers: { Accept: 'application/json', Origin: 'https://cherivu.co.kr', Referer: 'https://cherivu.co.kr/' },
    fromJson: (json) => (json.data || []).filter((c) => !c.state_ongoing || /APPLICATION/.test(c.state_ongoing)).map((c) => {
      const type = c.type === 'LOCAL' ? '방문' : c.type === 'REPORTER' || c.is_reporter ? '기자단' : '배송';
      const city = c.district && c.district.city && c.district.city.title;
      return finish({
        id: String(c.id), url: `https://cherivu.co.kr/campaigns/${c.id}`,
        title: String(c.title || '').trim(), desc: c.provide || '', type,
        region: type === '방문' && city ? findRegion(`[${city}]`, '').region : '',
        daysLeft: daysTo(c.application_finished_at),
      });
    }).filter((x) => x.title && (x.daysLeft == null || x.daysLeft >= 0)),
  },
  {
    // 블덱스(블로그덱스리뷰): 공개 목록 데이터
    key: 'blogdex',
    name: '블덱스',
    home: 'https://blogdexreview.space',
    lists: [1, 2].map((p) => `https://api.blogdexreview.space/api/v1/trials?trial_statuses=recruiting&sort_option=latest&page=${p}&page_size=100`),
    headers: { Accept: 'application/json', Origin: 'https://blogdexreview.space', Referer: 'https://blogdexreview.space/' },
    fromJson: (json) => ((json.data && json.data.trials) || []).map((c) => {
      const type = c.is_reporter ? '기자단' : c.fulfillment === 'visit' ? '방문' : '배송';
      const place = String(c.service_location || '').split(' ').slice(0, 2).join(' ');
      const it = finish({
        id: String(c.trial_id), url: `https://blogdexreview.space/trials/${c.trial_id}`,
        title: placeTitle(place, String(c.service_name || '').trim(), type), desc: c.provide || '', type,
        daysLeft: daysTo(c.recruit_deadline),
      });
      if (c.participant_count) { it.ap = +c.application_count || 0; it.rc = +c.participant_count; }
      return it;
    }).filter((x) => x.title && (x.daysLeft == null || x.daysLeft >= 0)),
  },
];
