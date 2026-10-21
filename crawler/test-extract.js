// 실제 사이트 HTML 모양을 본뜬 샘플로 추출 로직을 점검합니다: node crawler/test-extract.js
const { parseHTML } = require('linkedom');
const { extractCampaigns } = require('./extract');
const SITES = Object.fromEntries(require('./sites').map((s) => [s.key, s]));

const wrap = (inner) => `<!doctype html><html><head><title>t</title></head><body><header><a href="/">홈</a></header><main>${inner}</main></body></html>`;
const cases = {
  reviewnote: ['https://www.reviewnote.co.kr/campaigns?s=new', wrap(`
    <div class="grid">
      <div class="relative"><div class="card"><a href="/campaigns/1487246"><img alt="campaign"></a>
        <div><div><span>12</span> 일 남음</div><div>신청 <span>5</span> / 3</div></div></div>
        <div>방문형</div><a href="/campaigns/1487246">[경기/김포시] [원데이 체험] 초등 금융사고력 교육</a><p>원데이 클래스(약 1시간 30분)</p></div>
      <div class="relative"><div class="card"><a href="/campaigns/1486757"><img alt="campaign"></a>
        <div><div><span>10</span> 일 남음</div><div>신청 <span>1</span> / 3</div></div></div>
        <div>방문형</div><a href="/campaigns/1486757">[서울/강남구] 비엔느스튜디오 강남점</a><p>15만원 상당 촬영권 / 50분 무인촬영 + 드레스 포함</p></div>
    </div>`)],
  gangnam: ['https://xn--939au0g4vj8sq.net/theme/go/_list_cmp_tpl.php?rpage=1', `
    <li data-product="2330493"><div><div><a href="/cp/?id=2330493"><img></a></div><div><dl><span><em>Blog</em><em>방문형</em><span><em>4일 남음</em></span></span>
    <dt><a href="/cp/?id=2330493">[대구 서구] 까레몽</a></dt><dd>건강빵 2종 체험권</dd></dl><div><p><span><b>신청 6</b> / 모집 5</span></p></div></div></div></li>
    <li data-product="2315743"><div><div><a href="/cp/?id=2315743"><img></a></div><div><dl><span><em>Blog</em><em>배송형</em><span><em>14일 남음</em></span></span>
    <dt><a href="/cp/?id=2315743">롯데상품권</a></dt><dd>롯데상품권 (30만원)</dd></dl></div></div></li>`],
  dinnerqueen: ['https://dinnerqueen.net/taste?order=new', wrap(`
    <div class="carousel"><a href="https://dinnerqueen.net/taste/1590273" title="캐러셀 링크"><span>메인 캐러셀 링크</span></a></div>
    <div class="list">
     <div><div>★</div><a href="/taste/1590273" title="[서울 양천][릴스] 푸른바다어시장 신청하기"><div><img></div><div><p><strong>릴스</strong></p><p><strong>맛집</strong></p></div></a>
      <div><p><span><span>[</span>서울 양천<span>]</span><span>[</span>릴스<span>]</span> 푸른바다어시장</span></p><p>5만원권(필수주문 : 오마카세 모듬회)</p>
      <div><p><strong><span>7</span>일 남음</strong></p><p><span><strong>신청 8</strong>/5</span></p></div></div></div>
     <div><div>★</div><a href="/taste/1594390" title="[봄날애푸드] 구운란 신청하기"><div><img></div><div><p><strong>배송</strong></p></div></a>
      <div><p><span>[봄날애푸드] 구운란</span></p><p>구운란 60구</p><div><p><strong><span>2</span>일 남음</strong></p></div></div></div>
    </div>`)],
  bqueens: ['https://bqueens.net/taste?order=new', wrap(`
    <ul><li><a href="https://bqueens.net/taste/1601995">무료체험하러 가기 &gt;&gt;신청 기간이 4 일 남았습니다. [경기 하남][릴스] 1인 세신샵 더품</a>
      <h5>[경기 하남][릴스] 1인 세신샵 더품</h5><h5>D - 4</h5><script>var IdProgress = '.date-progress-1601995';</script></li>
    <li><a href="https://bqueens.net/taste/1590557">무료체험하러 가기 &gt;&gt;신청 기간이 7 일 남았습니다. [트루스오브뷰티] 클렌징밤</a>
      <h5>[트루스오브뷰티] 클렌징밤</h5><h5>D - 7</h5></li></ul>`)],
  mrblog: ['https://www.mrblog.net/', wrap(`
    <div class="swiper"><a href="https://www.mrblog.net/campaigns/1142744"><div><img></div><div><span><span></span> 천안 불당동 </span><strong>훠라라훠궈양꼬치</strong>
      <p> 훠궈 + 양꼬치 무한리필 2인 (56,800원 상당) </p><div><span> 2일 남음 </span><div><span>신청 <strong>24명</strong></span> / 모집 5명 </div></div></div></a>
    <a href="https://www.mrblog.net/campaigns/1141017"><div><img></div><div><span><span>배송</span></span><strong>투움바</strong>
      <p>칠리 떡볶이 (26,900원) + 무료배송</p><div><span> 1일 남음 </span></div></div></a></div>`)],
  '4blog': ['https://4blog.net/', wrap(`
    <a href="/campaign/408157/"><div><div><img></div><div><div><span>방문형</span><span>릴스</span><span>모집 1명</span></div>
      <span>[서울/당산동5가] 코지로 오모테나시 당산점</span><div>8만원 자유이용권 + 20만원 페이백</div><div>모집 09.22~10.19 · 리뷰 10.19~11.01</div>
      <div><span>200000P</span><span><span>D-1</span></span></div></div></div></a>
    <a href="/campaign/412278/"><div><div><img></div><div><div><span>배송형</span><span>블로그</span><span>모집 114명</span></div>
      <span>[페이백체험] 마미포유 이유식토핑 3종</span><div>3종세트 31,000원</div><div><span><span>D-6</span></span></div></div></div></a>`)],
  cloudreview: ['https://www.cloudreview.co.kr/campaign/blog', wrap(`
    <div class="grid">
     <div class="card"><div><div><div><svg><g></g></svg><div class="truncate pl-1">[생활] [경기도 수원] 로테이션 소개팅</div></div></div></div>
      <div><a href="/campaign/detail/251096"><img></a></div><div><a href="/campaign/detail/251096">로테이션 소개팅</a></div><div>10인 모집</div><div><span>#방문형</span></div><div><span>0인 참여</span><span>D-Day</span></div><span>♡</span></div>
     <div class="card"><div><div><div><div class="truncate pl-1">[뷰티] [광주 광산구] 바디프로필 촬영+보정+액자</div></div></div></div>
      <div><a href="/campaign/detail/250679"><img></a></div><div><a href="/campaign/detail/250679">바디프로필 촬영+수정본 3컷+35cm 액자</a></div><div>5인 모집</div><div><span>#방문형</span></div><div><span>0인 참여</span><span>2일남음</span></div><span>♡</span></div>
    </div>`)],
  modublog: ['https://www.modublog.co.kr/', wrap(`
    <div class="center slider"><div><a class="event-slide" href="https://www.modublog.co.kr/product/49176"><dl><dt class="g_banner_txt">웨딩관리</dt><dd class="g_banner_title">[웨딩관리] 결이고은</dd></dl></a></div><div><a class="event-slide" href="https://www.modublog.co.kr/banner_check.php?br_id=1"><dt>라이브 단독 특가</dt></a></div></div>
    <ul><li class="new_list"><div class="imgArea"><a href="https://www.modublog.co.kr/product/49176"><img></a></div><div class="textArea"><p class="icon_area"><span>릴스</span></p>
      <p class="c_title"><a href="https://www.modublog.co.kr/product/49176">[광주서구] 결이고은 본사 291기</a></p><p class="bn_text">웨딩관리</p><p class="bn_info"><span>신청 <strong>0</strong> /2명</span><span><strong>6</strong>일 남음</span></p></div></li>
    <li class="new_list"><div class="imgArea"><a href="https://www.modublog.co.kr/product/49211"><img></a></div><div class="textArea"><p class="icon_area"><span>블로그</span></p>
      <p class="c_title"><a href="https://www.modublog.co.kr/product/49211">[수딩젤] 포마이도터 17기</a></p><p class="bn_text">수딩젤 100ml</p><p class="bn_info"><span>신청 <strong>8</strong> /10명</span><span><strong>2</strong>일 남음</span></p></div></li></ul>`)],
  tble: ['https://tble.kr/', wrap(`
    <div class="popular_slide"><div class="item"><div class="img_in"><div class="img"><a href="./view.php?cp_id=419038" class="link"><img></a><a href="javascript:add_heart('419038','');" class="fav"></a></div></div>
      <div class="info"><a href="./view.php?cp_id=419038"><div class="t1"> 13일 남음 </div><div class="t2">[제주] 추억새김 사진관 (강추)</div><div class="t3">1인 단독 프로필 사진 촬영 + 보정</div></a></div></div>
    <div class="item"><div class="img_in"><div class="img"><a href="./view.php?cp_id=418373" class="link"><img></a></div></div>
      <div class="info"><a href="./view.php?cp_id=418373"><div class="t1"> 20일 남음 </div><div class="t2">[배송] 산내들우복당 - 영양 갈비탕</div><div class="t3">우복당 영양 갈비탕 700g 2개 제공</div></a></div></div></div>`)],
  storyn: ['https://www.storyn.kr/', wrap(`
    <div class="box"><div class="thumb"><a href="review_campaign.php?cp_id=1791953313"><img></a></div><a href="review_campaign.php?cp_id=1791953313"><div class="it_info"><div class="top_info"><div class="sns_info"><span>블로그</span></div><div class="option2"><span>+ 5,000P</span><span>방문형</span></div></div>
      <span class="it_name">[부산 수영] 철뚝집 수영점</span><span class="it_description">네이버 블로그 체험단</span><div class="option"><span class="dday">D-Day 2</span><span>신청 0 / 모집<b>10</b></span></div></div></a></div>
    <div class="box"><div class="thumb"><a href="review_campaign.php?cp_id=1791953272"><img></a></div><a href="review_campaign.php?cp_id=1791953272"><div class="it_info"><div class="top_info"><div class="sns_info"><span>인스타그램 릴스</span></div><div class="option2"><span>배송형</span></div></div>
      <span class="it_name">[쇼핑몰] 자이블</span><span class="it_description">인스타 릴스 체험단</span><div class="option"><span class="dday">D-Day 5</span></div></div></a></div>`)],
  gaboja: ['https://www.xn--o39a04kpnjo4k9hgflp.com/', wrap(`
    <div class="slick_hit"><div class="slick-slide"><a href="https://www.xn--o39a04kpnjo4k9hgflp.com/cmp/?id=376689" class="slick_link"><div class="img_area"><img title="[경기 성남] 우봉집 판교"></div>
      <div class="info_area"><ul class="cate"><li><i></i><span>방문형</span></li><li>2일 남음</li></ul><dl><dt>[경기 성남] 우봉집 판교</dt><dd>6만원 식사권(2인 기준)</dd></dl><div class="current"><span>신청 29 </span>/ 모집 8</div></div></a></div>
    <div class="slick-slide"><a href="https://www.xn--o39a04kpnjo4k9hgflp.com/cmp/?id=376214" class="slick_link"><div class="img_area"><img title="[전남 완도] 신선전복"></div>
      <div class="info_area"><ul class="cate"><li><span>배송형</span></li><li>3일 남음</li></ul><dl><dt>[전남 완도] 신선전복</dt><dd>전복1kg (5만원 상당) 배송권</dd></dl></div></a></div></div>`)],
  reviewplace: ['https://www.reviewplace.co.kr/', wrap(`
    <a href="/pr/?id=312827&amp;rp_apply_refresh=20260814_pc_apply_return2"><div class="img"><img></div><div class="item_info"><div class="txt_wrap"><p class="tit">[쿠팡] 슈가버블 버블원샷 캡슐 세탁세제</p><p class="txt">버블원샷 캡슐 세탁세제 (100입) * 1개(구매수량)</p></div><div>오늘마감</div><div>신청 966 / 20명</div></div></a>
    <a href="/pr/?id=314230&amp;rp_apply_refresh=20260814_pc_apply_return2"><div class="img"><img></div><div class="item_info"><div class="txt_wrap"><p class="tit">[블로그] 롤베이비 웜허그 온열시트</p><p class="txt">롤베이비 웜허그 온열시트 (디자인 랜덤 발송)</p></div><div>D - 3</div></div></a>`)],
  cherrycook: ['https://cherry-cook.com/', wrap(`
    <div class="popular-item"><a href="/item/1600"><div class="item-image"><img></div><div class="item-shortcut"><div class="item-deadline">3일 남음</div><div class="item-point">5000캐시</div></div><div class="item-product">[<!-- -->경기<!-- -->]<!-- -->군포 / 고기도리 금정점</div><div class="item-details"><div class="item-type">블로그</div><div class="item-status">신청 0/5</div></div></a></div>
    <div class="popular-item"><a href="/item/1602"><div class="item-image"><img></div><div class="item-shortcut"><div class="item-deadline">1일 남음</div></div><div class="item-product">[인천]연수역 / 깨복이 연수동본점</div></a></div>`)],
  tqueens: ['https://tqueens.net/taste?order=new', wrap(`
    <div class="qz-dq-card"><a class="qz-dq-card__link" href="/taste/1591883" title="[릴스][스마트에버] 터치톡 뷰티디바이스 SET 신청하기"><img></a>
      <div class="qz-dq-card__text"><p><strong>D-3</strong></p><p><strong>배송형/뷰티형</strong></p><p><strong><span>[</span>릴스<span>]</span><span>[</span>스마트에버<span>]</span> 터치톡 뷰티디바이스 SET</strong></p><p>터치톡 디바이스 1개</p></div></div>
    <div class="qz-dq-card"><a class="qz-dq-card__link" href="/taste/1602932" title="[조애] 발레리나 석고방향제 신청하기"><img></a>
      <div class="qz-dq-card__text"><p><strong>D-5</strong></p><p><strong><span>[</span>조애<span>]</span> 발레리나 석고방향제</strong></p><p>석고방향제 2개</p></div></div>`)],
  weddingmate: ['https://www.weddingmate.co.kr/campaigns?sort=latest', wrap(`
    <div class="grid"><a class="group flex flex-col" href="/campaigns/cmv80ndcz096ho1219fcpo3kc"><div class="relative"><div><img></div><span>할인가 체험</span></div><h3 class="mt-2.5">[천안] 나란하우스 하이엔드 웨딩촬영 (촬영만) 할인 체험단</h3><p class="mt-1">나란하우스 비토탈(촬영만) 웨딩촬영 - 체험단 오픈이벤트가 77만원</p><div><span>9일 남음</span><span>|</span><span>신청 <b>0</b> / 5명</span></div></a>
    <a class="group flex flex-col" href="/campaigns/cmttxzg2m00hema21fkg2i5f1"><div class="relative"><div><img></div><span>100% 무료</span></div><h3 class="mt-2.5">[웨딩속옷] 앙블리 웨딩 누브라 무료 체험단</h3><p class="mt-1">앙블리 웨딩 누브라 1개</p><div><span>12일 남음</span></div></a></div>`)],
  assaview: ['https://assaview.co.kr/campaign_list?orderby=cp_sdatetime', wrap(`
    <ul><li><a href="campaign.php?cp_id=1791945801"><div class="imgBox"><img></div><div class="details"><div class="tag_area"><div class="cp_type"><span class="rs_cp_type_chip">배송형</span></div><div><div class="timer"> ${new Date(Date.now() + 9 * 3600e3 + 3 * 86400e3).toISOString().slice(0, 10).replace(/-/g, '/')} 23:59:59</div></div></div>
      <div class="subject"> 수제 쇼콜라 초코 바게트 </div><div class="desc"><span class="opt_name"> 수제 쇼콜라 초코 바게트 [3개입] </span><div><span>신청</span> <b>31</b> <span>/</span> <span>10명</span></div></div></div></a></li>
    <li><a href="campaign.php?cp_id=1773729349"><div class="imgBox"><img></div><div class="details"><div class="tag_area"><div class="cp_type"><span>방문형</span></div></div>
      <div class="subject"> [서울 강동/천호] 언하우스 강동점 </div><div class="desc"><span class="opt_name"> 2인 식사권 </span></div></div></a></li></ul>`)],
  huki: ['https://huki.co.kr/theme/huki/skin/board/gallery/visit_campaign_list.php', wrap(`
    <ul><li><a href="/bbs/board.php?bo_table=campaign&amp;sti=&amp;wr_id=1115"><div class="img"><img><div class="h_icon"></div></div><div class="text"><p class="t_top"><span><span class="blog">블로그</span></span> D-13 모집중 </p><p class="t_tit"> [용인/분당/수원] 슈가슈가링 </p><p class="t_sub"> 6만원상당 페이스왁싱 or 바디왁싱 </p><p class="t_bottom"> 신청 0 / 5명 </p></div></a></li>
    <li><a href="/bbs/board.php?bo_table=campaign&amp;sti=&amp;wr_id=1113"><div class="img"><img></div><div class="text"><p class="t_top"><span>블로그</span> D-8 모집중 </p><p class="t_tit"> [부산] 에이틀리에 화실 부산 명지점 </p><p class="t_sub"> 드로잉카페 체험 (내용확인 필) </p></div></a></li></ul>`)],
  modootogether: ['https://modootogether.com/campaign_list.php?category_id=001A', wrap(`
    <ul><li><div class="box"><div class="thumb"><a href="campaign.php?cp_id=1791334732"><img></a><a class="zzim"></a></div><a href="campaign.php?cp_id=1791334732"><div class="it_info"><div class="top_info"><span class="blog">블로그</span></div><span class="it_name"> [서울/홍대] 우물집 홍대점 </span><span class="it_description">홍대 맛집, 솥밥 맛집, 전골 맛집</span><div class="option"><span><b>25</b>명 신청/<b>40</b>명 모집중</span></div><div class="option2"><span>+ 1,000P</span><span>방문형</span><span class="dday">D-Day 41</span></div></div></a></div></li>
    <li><div class="box"><div class="thumb"><a href="campaign.php?cp_id=1790728717"><img><div class="soldout"><span class="tit">모집마감</span></div></a></div><a href="campaign.php?cp_id=1790728717"><div class="it_info"><span class="it_name"> [서울/강동] 팜 투 플라워</span><span class="it_description">감각적 꽃집</span><div class="option2"><span>방문형</span><span class="dday">모집마감</span></div></div></a></div></li>
    <li><div class="box"><div class="thumb"><a href="campaign.php?cp_id=1791363487"><img></a></div><a href="campaign.php?cp_id=1791363487"><div class="it_info"><span class="it_name">[기자단] 랑쥬왁싱</span><span class="it_description">가이드 전달 후 3일이내 작성</span><div class="option2"><span>+ 5,000P</span><span>기자단</span><span class="dday">D-Day 13</span></div></div></a></div></li></ul>`)],
  openreview: ['https://openreview.kr/', wrap(`
    <ul><li><div class="horizontal-card"><div class="img-wrapper-s"><a href="/main/m/page/exp_view.php?ex_idx=926" class="campaign-img"><div><img></div></a><p class="popular-rate">1</p></div><div class="card-info-area"><div class="card-badge-area"><div class="dday-area"><p>마감</p></div></div><div class="card-title "><p>[누리마을감자탕] 동성로점</p></div><div class="card-text"><p>8,000P 지급</p></div><div class="card-status"><p class="apply-num">신청 <span>19</span></p><p class="apply-limit">/ 15명</p></div></div></div></li>
    <li><div class="horizontal-card"><div class="img-wrapper-s"><a href="/main/m/page/exp_view.php?ex_idx=928&amp;x=1" class="campaign-img"><div><img></div></a><p class="popular-rate">3</p></div><div class="card-info-area"><div class="card-badge-area"><div class="dday-area"><p>D-<span>6</span></p></div></div><div class="card-title "><p>[누리마을감자탕] 덕천점</p></div><div class="card-text"><p>8,000P 지급</p></div><div class="card-status"><p class="apply-num">신청 <span>20</span></p><p class="apply-limit">/ 17명</p></div></div></div></li>
    <li><div class="horizontal-card"><div class="img-wrapper-s"><a href="/main/m/page/exp_view.php?ex_idx=931" class="campaign-img"><div><img></div></a></div><div class="card-info-area"><div class="card-badge-area"><div class="dday-area"><p>D-<span>3</span></p></div></div><div class="card-title "><p>[오엠오뷰티] 알파CD 여리컷</p></div><div class="card-text"><p>56,600P 지급</p></div><div class="card-status"><p class="apply-num">신청 <span>2</span></p><p class="apply-limit">/ 10명</p></div></div></div></li></ul>`)],
  masil: ['https://masil.io/programs', wrap(`
    <article class="group relative flex gap-4 sm:block"><div class="relative"><img><span class="absolute">워케이션</span></div><div class="min-w-0 flex-1 sm:pt-4"><div class="flex"><span class="min-w-0 truncate font-bold text-campaign">울산 동구</span><span class="inline-flex">마감 임박<span class="font-brand">D-1</span></span></div><h3 class="mt-1.5"><a class="line-clamp-2" href="/programs/bb83bce7-6446-4880-9074-35644a4ef4bb">[로컬 비즈니스 운영자 대상] 로컬 메이커 비즈니스 워케이션 캠프 1박 2일, 참여비 무료</a></h3><p class="mt-1.5">신청 대상: 지역 기반으로 F&amp;B, 공간·콘텐츠 분야의 비즈니스를 운영하는 기업</p><p class="mt-1.5">접수 <!-- -->10.6(화) ~ 10.20(화)</p></div></article>
    <article class="group relative flex gap-4 sm:block"><div class="relative"><img><span class="absolute">할인/혜택</span></div><div class="min-w-0 flex-1 sm:pt-4"><div class="flex"><span class="min-w-0 truncate font-bold text-campaign">전북 부안군</span><span class="inline-flex">모집 중<span class="font-brand">D-13</span></span></div><h3 class="mt-1.5"><a class="line-clamp-2" href="/programs/9ada973c-a695-4c54-80ce-dcaa6da307d4">부안 하루 더 살아보기, 숙박비 최대 17만원 지원</a></h3><p class="mt-1.5">신청 대상: 부안 방문 관광객으로 지역 숙박시설 이용자</p><p class="mt-1.5">접수 10.10(토) ~ 11.1(일)</p></div></article>
    <article class="group relative flex gap-4 sm:block"><div class="relative"><img><span class="absolute">할인/혜택</span></div><div class="min-w-0 flex-1 sm:pt-4"><div class="flex"><span class="min-w-0 truncate font-bold text-campaign">전남 고흥군</span><span class="inline-flex">마감</span></div><h3 class="mt-1.5"><a class="line-clamp-2" href="/programs/321f2dce-147c-453e-9ef1-61e2c1c9993b">고흥 반값여행 4차</a></h3><p class="mt-1.5">신청 대상: 관외 거주자</p></div></article>`)],
  dailyview: ['https://dailyview.kr/review_campaign_list.php', wrap(`
    <ul><li><div class="box"><div class="thumb"><a href="review_campaign.php?cp_id=1792565157"><img class="it_img"></a><a class="zzim campaign_zzim_btn"></a></div><a href="review_campaign.php?cp_id=1792565157"><div class="it_info"><div class="top_info"><div class="sns_info"><span class="sns blog">블로그</span></div></div><span class="it_name">[경기 하남] 뽕사부 미사점</span><span class="it_description">#미사맛집 #하남짬뽕맛집</span><div class="option"><span class="txt_num dday">7일 남음</span><span>신청<b>0</b> / 모집<b>10</b></span></div><div class="option2"><span>방문형</span></div></div></a></div></li>
    <li><div class="box"><div class="thumb"><a href="review_campaign.php?cp_id=1791254984"><img class="it_img"></a></div><a href="review_campaign.php?cp_id=1791254984"><div class="it_info"><span class="it_name"><!-- Notice: Undefined index [쇼핑몰] LED 오로라 무드등 쇼핑몰-->[쇼핑몰] LED 오로라 무드등 쇼핑몰 </span><span class="it_description">#집들이선물 #LED무드등</span><div class="option"><span class="txt_num dday">2일 남음</span><span>신청<b>68</b> / 모집<b>10</b></span></div><div class="option2"><span>배송형</span></div></div></a></div></li></ul>`)],
  chehumdan: ['https://chehumdan.com/category.php?category=832', wrap(`
    <div class="thum-box"><div class="thum"><div class="thum-img"><a href="detail.php?number=22986&amp;category=893"><span class="mask"></span><img></a></div><div class="sns-icon"><img></div></div><p class="list-day"><span class="blink">상시모집</span> <span>[서울 중구]</span> <span class="list-per">신청 410 / 모집 200</span></p><p class="list-tit"><a href="detail.php?number=22986&amp;category=893">광화문역위치 피부과 체험단 모...</a></p><p class="list-txt"><span>선제공</span> <span>1.피부관리(아쿠아필, ldm, GA...</span></p></div>
    <div class="thum-box"><div class="thum"><div class="thum-img"><a href="detail.php?number=23001&amp;category=829"><img></a></div></div><p class="list-day"><span class="blink">상시모집</span> <span>[재택 ]</span> <span class="list-per">신청 2,372 / 모집 30</span></p><p class="list-tit"><a href="detail.php?number=23001&amp;category=829">[맛있는 고기 체험단] 맛있는 족...</a></p><p class="list-txt"><span>훈제막창200g + 순살족발300g...</span></p></div>`)],
  keyplat: ['https://keyplat.net/', wrap(`
    <div class="box"><div class="thumb"><a href="review_campaign.php?cp_id=1785520448"><img class="it_img"></a></div><a href="review_campaign.php?cp_id=1785520448"><div class="it_info"><div class="top_info"><span class="sns blog">블로그</span></div><span class="it_name">[전북/전주] 어사화 전주한옥마을</span><span class="it_description">42만원 상당 독채 1박 숙박권</span><div class="option"><span class="txt_num dday">D-Day 71</span><span>신청<b>117</b> / 모집<b>10</b></span></div><div class="option2"><span>방문형</span></div></div></a></div>
    <div class="box"><div class="thumb"><a href="review_campaign.php?cp_id=1785520449"><img class="it_img"></a></div><a href="review_campaign.php?cp_id=1785520449"><div class="it_info"><span class="it_name">[배송] 무선 청소기</span><span class="it_description">청소기 1대</span><div class="option"><span class="txt_num dday">D-Day 5</span><span>신청<b>3</b> / 모집<b>5</b></span></div><div class="option2"><span>배송형</span></div></div></a></div>`)],
  metachehum: ['https://meta-chehumdan.com/', wrap(`
    <ul><li><div class="box"><div class="thumb"><a href="campaign.php?cp_id=1791356900"><img class="it_img"></a></div><a href="campaign.php?cp_id=1791356900"><div class="it_info"><div class="top_info"><span class="blog">네이버 블로그</span><div class="option2"><span>+42,000P</span><span class="tag_ship">배송형</span><span class="txt_num eday">오늘까지</span></div></div><span class="it_name">[한국인의 밥쌀] 햅쌀 삼광미 10kg</span><span class="it_description">제품 구매형</span><div class="option"><span>모집 인원 <b>10</b>명 / 현재 신청자 <b>81</b>명</span></div></div></a></div></li>
    <li><div class="box"><div class="thumb"><a href="campaign.php?cp_id=1791356901"><img class="it_img"></a></div><a href="campaign.php?cp_id=1791356901"><div class="it_info"><div class="top_info"><span class="blog">네이버 블로그</span><div class="option2"><span class="tag_visit">방문형</span><span class="txt_num eday">D-5</span></div></div><span class="it_name">[대구 수성] 웨딩스냅 스튜디오</span><span class="it_description">본식스냅 할인</span><div class="option"><span>모집 인원 <b>3</b>명 / 현재 신청자 <b>2</b>명</span></div></div></a></div></li></ul>`)],
  enolja: ['https://enolja.com/newdevu/main.html?is_back=false&page=1', `
    <div id="devu-7242" class="contentbox pc"><div class="box"><a href="/dv/7242"><div class="img"><img></div><span class="area">대구 달서구</span><div class="shop"><p class="info">오늘은짬뽕땡기는날 성서이곡점</p><p class="status apply"><span class="label">신청</span></p></div><span class="d_day"><p>D-16</p></span><div class="overlay apply"><p class="title">오늘은짬뽕땡기는날 성서이곡점</p><p class="desc">숙성 생면 짬뽕</p><p class="date">신청마감일: <span>2026-11-05</span></p></div></a></div></div>
    <div id="devu-7100" class="contentbox pc"><div class="box"><a href="/dv/7100"><span class="area">부산 해운대구</span><div class="shop"><p class="info">끝난 가게</p><p class="status complete"><span class="label">완료</span></p></div><div class="overlay"><p class="title">끝난 가게</p></div></a></div></div>
    <div id="devu-7243" class="contentbox pc"><div class="box"><a href="/dv/7243"><span class="area">대구 중구</span><div class="shop"><p class="info">메이크업샵 동성로</p><p class="status last"><span class="label">마감임박</span></p></div><span class="d_day"><p>D-1</p></span><div class="overlay"><p class="title">메이크업샵 동성로</p><p class="desc">웨딩 메이크업</p></div></a></div></div>`],
  reviewtong: ['https://www.reviewtong.co.kr/main.php', wrap(`
    <div class="campaignBox"><dl><a href="/campaign/visit.php?ptype=view&amp;idx=338415&amp;page=1&amp;"><dt></dt><dd><p class="btns"><span>서울</span></p><h6>[서울 강남] 15만원 상당 프리미...</h6><p class="campaignPrd">15만원 상당 식사 제공</p><ol><li> D-70일</li><li>신청<span>57<font>/5명</font></span></li></ol></dd></a></dl></div>
    <div class="campaignBox"><dl><a href="/campaign/editor.php?ptype=view&amp;idx=338500&amp;page=1&amp;"><dt></dt><dd><h6>[강남] 다이어트 한약 기자단...</h6><p class="campaignPrd">30,000 point</p><ol><li> D-40일</li><li>신청<span>3<font>/10명</font></span></li></ol></dd></a></dl></div>`)],
  alljam: ['https://alljam.co.kr/', wrap(`
    <a href="https://alljam.co.kr/experiences/538"><figure><span class="notice_btn_end">모집마감</span><figcaption><p class="fig_txt1">빨간목탁</p><p class="fig_txt3">불교 굿즈</p></figcaption></figure></a>
    <a href="https://alljam.co.kr/experiences/601"><figure><figcaption><p class="fig_txt1">부산 콘트호텔</p><p class="fig_txt3">부산 남포동 숙소 전 객실 금연</p></figcaption></figure></a>
    <a href="https://alljam.co.kr/experiences/602"><figure><figcaption><p class="fig_txt1">분당 카인드</p><p class="fig_txt3">서현역에 위치한 관광호텔</p></figcaption></figure></a>`)],
  odiya: ['https://odiya.kr/category.php?category=829', wrap(`
    <div class="over_row"><div class="over_on"><table onclick="location.href=&quot;detail.php?number=140527&amp;category=829&quot;"><tr><td>D-8 모집인원 5명</td></tr></table></div>
      <table onclick="location.href=&quot;detail.php?number=140527&amp;category=829&quot;"><tr><td><div class="odiya-status-dday">D-8</div></td></tr><tr><td><table><tr><td class="font_17 font_malgun letter_s2"><strong>[제주 서귀포] 육떡식당 1차...</strong></td></tr><tr><td class="font_14 font_malgun letter_s1">30,000원 금액권 제공</td></tr></table></td></tr><tr><td><strong>신청&nbsp;0&nbsp;/&nbsp;모집&nbsp;<span>5</span></strong></td></tr></table></div>
    <div class="over_row"><table onclick="location.href=&quot;detail.php?number=140600&amp;category=829&quot;"><tr><td><div>D-3</div></td></tr><tr><td><table><tr><td class="letter_s2"><strong>[대구 수성] 고깃집</strong></td></tr><tr><td class="font_14">2인 식사권</td></tr></table></td></tr><tr><td><strong>신청 4 / 모집 2</strong></td></tr></table></div>`)],
  pavlovu: ['https://pavlovu.com/review_campaign_list.php?category_id=002A', wrap(`
    <ul><li class="pvli"><div class="pvc"><div class="pvc_th"><a class="pvc_im" href="review_campaign.php?cp_id=1791473422"><img><span class="pvc_bd"><span class="pvc_bg">실시간</span></span></a></div><a href="review_campaign.php?cp_id=1791473422" class="pvc_tx"><strong>음료 2잔+디저트 1개</strong><span class="pvc_store_row"><span class="pvc_store">노O즌 다산</span><span class="pvc_mt">5명 모집</span></span><span class="pvc_pl"><i>포토</i><span class="pvc_pn">남양주/가평 · 맛집</span></span></a></div></li>
    <li class="pvli"><div class="pvc"><div class="pvc_th"><a class="pvc_im" href="review_campaign.php?cp_id=1792455176"><img><span class="pvc_bd"><span class="pvc_bg pvc_red">D-1</span></span></a></div><a href="review_campaign.php?cp_id=1792455176" class="pvc_tx"><strong>원고료 5만원</strong><span class="pvc_store_row"><span class="pvc_store">더O컴</span><span class="pvc_mt">5명 모집</span></span><span class="pvc_pl"><i>블로그</i><span class="pvc_pn">경북 · 여가</span></span></a></div></li></ul>`)],
};

let fail = 0;
for (const [key, [url, html]] of Object.entries(cases)) {
  const { document } = parseHTML(html);
  const items = SITES[key].parse ? SITES[key].parse(document, url) : extractCampaigns(document, url, SITES[key]);
  console.log(`\n## ${SITES[key].name}: ${items.length}건`);
  for (const i of items) console.log(`  ${i.id} | ${i.title} | 지역=${i.region || '-'}(${i.loc || ''}) | ${i.type || '-'} | D-${i.daysLeft} |${i.rc ? ` 신청${i.ap}/${i.rc} |` : ''} ${i.desc} | ${i.url}`);
  if (items.length !== 2) { fail++; console.log('  ❌ 2건이어야 합니다'); }
  if (items.some((i) => /캐러셀|무료체험하러|IdProgress|^\d+명$/.test(i.title + i.desc))) { fail++; console.log('  ❌ 잡음이 섞였습니다'); }
}
{
  const items = SITES.chvu.fromJson({ data: [
    { campaignId: 200996, status: 'pending', channel: 'blog', activity: 'visit', title: '[대전/유성][방문기자단]국제표준금거래소 유성점', subtitle: '원고료 3만포인트', closeAt: Date.now() + 3 * 86400e3 },
    { campaignId: 200995, status: 'pending', channel: 'blog', activity: 'delivery', title: '씨솔트 스파 마스크 워시오프팩', subtitle: '씨솔트 스파 마스크 100g', closeAt: Date.now() + 2 * 86400e3 },
  ] });
  console.log(`\n## 체험뷰(JSON): ${items.length}건`);
  for (const i of items) console.log(`  ${i.id} | ${i.title} | 지역=${i.region || '-'}(${i.loc || ''}) | ${i.type} | D-${i.daysLeft} | ${i.desc} | ${i.url}`);
  if (items.length !== 2 || items[0].region !== '대전' || items[1].region !== '') { fail++; console.log('  ❌ 체험뷰 변환 확인 필요'); }
}
{
  const items = SITES.revu.fromJson({ items: [
    { id: 1417064, item: '[대구] 위닛 동성로점', status: 'REQUEST', privacy: 'everyone', category: '뷰티샵,방문형', venue: { addressFirst: '대구 중구 삼덕동1가 25-1' }, requestEndedOn: '2099-01-01', reviewerLimit: 35, campaignStats: { requestCount: 1 }, campaignData: { reward: '헤어시술 중 택1' } },
    { id: 1420927, item: '[Coms]전기멀티쿠커1.5L라면포트', status: 'REQUEST', privacy: 'everyone', category: '주방용품,배송형', venue: { addressFirst: null }, requestEndedOn: '2099-01-01', reviewerLimit: 10, campaignStats: { requestCount: 1624 }, campaignData: { reward: '라면포트 1개' } },
    { id: 1, item: '끝난 공고', status: 'END', privacy: 'everyone' },
  ] });
  console.log(`\n## 레뷰(JSON): ${items.length}건`);
  for (const i of items) console.log(`  ${i.id} | ${i.title} | 지역=${i.region || '-'}(${i.loc || ''}) | ${i.type} | 신청${i.ap}/${i.rc} | ${i.desc} | ${i.url}`);
  if (items.length !== 2 || items[0].region !== '대구' || items[1].type !== '배송' || items[1].region !== '') { fail++; console.log('  ❌ 레뷰 변환 확인 필요'); }
}
const jsonCases = {
  stylec: { data: { data: [
    { link: '/trials/153808', wr_subject: '[랜덤당첨] 신라면 120g x 40개', ca_name: '제품', wr_type_label: '제공형', finday: '2099-10-23 23:59:59', tr_recruit_max: 10, tr_enroll_cnt: 645, wr_id: 153808 },
    { link: '/trials/155016', wr_subject: '최고당 돈가스 망원점 릴스 체험단 모집', ca_name: '방문', wr_type_label: '제공형', finday: '2099-10-23 23:59:59', tr_recruit_max: 5, tr_enroll_cnt: 3, wr_id: 155016 },
  ] } },
  ddok: { campaigns: [
    { id: 'ba3b', title: '방문형 캠페인', status: 'recruiting', campaignType: 'visit', channels: ['blog'], recruitDeadline: '2099-10-27', maxInfluencers: 8, currentApplicants: 1, region: '경기 · 시흥시', visitInfo: { companyName: '시흥메가온누리약국', experienceBenefits: '영양제 세트' } },
    { id: 'cc11', title: '배송형 캠페인', status: 'recruiting', campaignType: 'delivery', channels: ['purchase_review_self_paid'], recruitDeadline: '2099-10-27', maxInfluencers: 100, currentApplicants: 127, region: null, visitInfo: { companyName: '마이데이즈', experienceBenefits: '여성팬티 7매입' } },
    { id: 'old', title: '배송형 캠페인', status: 'in_progress', campaignType: 'delivery', channels: [], recruitDeadline: '2020-01-01' },
  ] },
  whogiup: { data: [
    { campaign_id: 13050, is_ended: 0, title: '[광주/광산구] 등촌 산동교점', category: '방문/체험', product: '40,000원 체험권', applied_num: 74, required_num: 5, dday: 5 },
    { campaign_id: 13051, is_ended: 0, title: '수분크림', category: '배송/제품', product: '수분크림 1개', applied_num: 2, required_num: 10, dday: 3 },
    { campaign_id: 1, is_ended: 1, title: '끝', category: '방문/체험', dday: 0 },
  ] },
  cherivu: { data: [
    { id: 1830, title: '[파주] 초대형 감성카페 레드파이프', type: 'LOCAL', provide: '5만원 이용권', district: { city: { title: '경기' } }, application_finished_at: '2099-11-04', state_ongoing: 'ONGOING_APPLICATION' },
    { id: 1831, title: '[기자단] 삼경일 아라점', type: 'REPORTER', provide: '10,000 포인트', application_finished_at: '2099-11-04', state_ongoing: 'ONGOING_APPLICATION' },
  ] },
  blogdex: { data: { trials: [
    { trial_id: 'xqE2XZsbSD', service_name: '스튜디오누브', service_location: '서울 마포구 와우산로 162-14', provide: '4만원 이용권', fulfillment: 'visit', is_reporter: false, recruit_deadline: '2099-11-10T09:00:00+09:00', application_count: 0, participant_count: 2 },
    { trial_id: '28Cwzvq0Od', service_name: '오로라 스토리샵', service_location: '', provide: '큐빅 귀걸이', fulfillment: 'delivery', is_reporter: false, recruit_deadline: '2099-11-01T09:00:00+09:00', application_count: 0, participant_count: 1 },
  ] } },
};
for (const [key, json] of Object.entries(jsonCases)) {
  const items = SITES[key].fromJson(json);
  console.log(`\n## ${SITES[key].name}(JSON): ${items.length}건`);
  for (const i of items) console.log(`  ${i.id} | ${i.title} | 지역=${i.region || '-'}(${i.loc || ''}) | ${i.type} | D-${i.daysLeft} |${i.rc ? ` 신청${i.ap}/${i.rc} |` : ''} ${i.desc} | ${i.url}`);
  if (items.length !== 2) { fail++; console.log('  ❌ 2건이어야 합니다'); }
  if (items[0].type === '방문' && !items[0].region) { fail++; console.log('  ❌ 방문형 지역 확인 필요'); }
}
console.log(fail ? `\n실패 ${fail}건` : '\n모든 샘플 통과');
process.exit(fail ? 1 : 0);
