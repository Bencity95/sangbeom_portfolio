// 페이지 로드 전환
window.addEventListener('load', () => {
  document.body.classList.remove('is-loading');
});

// 네비 활성 상태 (해시/경로 기반)
(function navActive() {
  const links = document.querySelectorAll('nav a');
  const here = location.pathname.replace(/\/$/, '') + location.hash;

  // 초기: 현재 경로/해시에 맞는 링크만 표시(선택)
  links.forEach(a => {
    const href = a.getAttribute('href');
    const abs = new URL(href, location.origin).pathname + (href.includes('#') ? href.slice(href.indexOf('#')) : '');
    if (here && abs && (location.pathname.endsWith(href) || abs === here)) {
      a.classList.add('is-active');
    }
  });

  // 클릭 시 클래스는 건드리지 않고 브라우저 기본 동작(스크롤/해시)만 수행
  links.forEach(a => a.addEventListener('click', () => {
    // no-op: is-active는 sectionObserver가 책임집니다
  }));
})();

// 섹션 관찰 (가장 많이 보이는 섹션 1개만 활성)
(function sectionObserver() {
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  if (!sections.length) return;

  const vis = new Map(); // id -> {ratio, top}
  const setActive = (id) => {
    document.querySelectorAll('nav a').forEach(el => {
      el.classList.toggle('is-active', el.dataset.nav === id);
    });
  };

  // 현재 상태로 최적의 섹션 선택
  const pick = () => {
    // 1) 가장 큰 intersectionRatio 우선
    let best = null, bestRatio = -1;
    vis.forEach((v, id) => {
      if (v.ratio > bestRatio) { bestRatio = v.ratio; best = id; }
    });
    // 2) 모두 0이면 화면 상단에 가장 가까운 섹션
    if (!best || bestRatio <= 0) {
      best = sections
        .slice()
        .sort((a, b) => Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top))[0]?.id;
    }
    if (best) setActive(best);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const id = e.target.id;
      vis.set(id, {
        ratio: e.isIntersecting ? e.intersectionRatio : 0,
        top: e.target.getBoundingClientRect().top
      });
    });
    pick();
  }, {
    threshold: Array.from({length: 11}, (_, i) => i/10), // 0.0~1.0
    rootMargin: '-35% 0px -55% 0px'
  });

  sections.forEach(s => {
    vis.set(s.id, { ratio: 0, top: s.getBoundingClientRect().top });
    io.observe(s);
  });

  // 초기 진입 시에도 한 번 계산 (새로고침/해시 점프 직후)
  window.addEventListener('DOMContentLoaded', pick);
  window.addEventListener('hashchange', pick);
  window.addEventListener('scroll', () => { // 드문 케이스 보정
    // 관찰 이벤트가 드물게 안 올 때 대비
    pick();
  }, { passive: true });
})();

// 스크롤 리빌
(function reveal(){
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.2});
  els.forEach(el=>io.observe(el));
})();

// Footer 연도
(function year(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// 블로그 토글(목록에서 내용 펼치기)
(function blogToggle(){
  document.querySelectorAll('.post .toggle').forEach(tog => {
    tog.addEventListener('click', () => {
      const post = tog.closest('.post');
      const expanded = post.classList.toggle('open');
      tog.setAttribute('aria-expanded', expanded);
    });
  });
})();

// 테마 토글: 기본 다크, 버튼 클릭 시 라이트 전환(저장)
(function theme(){
  const key = 'theme-preference';
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');

  // 시스템 선호 + 저장값 반영
  const saved = localStorage.getItem(key);
  if (saved === 'light' || saved === 'dark') {
    root.setAttribute('data-theme', saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }

  const updateIcon = () => {
    if (!btn) return;
    const mode = root.getAttribute('data-theme');
    btn.textContent = mode === 'dark' ? '🌙' : '☀️';
    btn.setAttribute('aria-label', `테마 전환 (현재: ${mode})`);
  };
  updateIcon();

  btn && btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', cur);
    localStorage.setItem(key, cur);
    updateIcon();
  });

  
})();