// ─────────────────────────────────────────────────────────────
// 로그인(선택) 설정
// 수파베이스 → Project Settings → API(또는 API Keys)에서 복사한 값 두 개를
// 아래 따옴표 '' 안에 붙여넣고 저장(Commit)하면 앱에 카카오 로그인이 켜져요.
// 비워두면 로그인 없이 지금처럼 동작해요.
// (이 두 값은 원래 공개되는 값이라 여기에 적어도 괜찮아요. 'secret' 키는 절대 넣지 마세요)
// ─────────────────────────────────────────────────────────────
window.CHEHUM_LOGIN = {
  supabaseUrl: '',   // 예: https://abcdefghijkl.supabase.co
  supabaseKey: '',   // 예: sb_publishable_로 시작하는 키, 또는 eyJ로 시작하는 anon public 키
};
