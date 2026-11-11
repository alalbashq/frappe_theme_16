// The frame's markup and its styles, which live inside its shadow root.
export const HTML = `
<div class="aw">
  <header class="aw-top">
    <button class="aw-logo" data-go-home data-t-title="الرئيسية"><svg viewBox="0 0 24 24"><path d="M3 4l9 8 9-8M3 20l9-8 9 8M3 4v16M21 4v16"/></svg></button>
    <button class="aw-menu-btn" data-toggle data-t-title="القائمة"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
    <button class="aw-search" data-search>
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <span data-t="بحث"></span>
      <kbd>Ctrl K</kbd>
    </button>
    <div class="aw-tools">
      <button class="aw-lang" data-lang></button>
      <button data-full data-t-title="ملء الشاشة"><svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>
      <button data-theme data-t-title="المظهر"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 2-1 3-1c2.5 0 4-1.500 4-3.500C21 6.500 17 3 12 3z"/><circle cx="7.500" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="16" cy="9" r="1"/></svg></button>
      <button data-bell data-t-title="التنبيهات"><svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/></svg><span class="aw-count" data-bell-count hidden></span></button>
      <div class="aw-user">
        <button class="aw-avatar" data-user-btn data-t-title="حسابي"></button>
      </div>
    </div>
  </header>
  <div class="aw-title"><h1 data-title></h1></div>
  <div class="aw-body">
    <div class="aw-scrim" data-scrim></div>
    <aside class="aw-side" data-side>
      <div class="aw-side-head"><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg><span data-t="القائمة الرئيسية"></span></div>
      <nav data-nav data-t-title="المديولات"></nav>
    </aside>
    <main class="aw-main" data-main><div class="aw-loading" data-t="جارٍ التحميل"></div></main>
  </div>
</div>
`;

export const CSS = `
.aw { position: fixed; inset: 0; z-index: 1020; display: flex; flex-direction: column; background: #fff; color: #27323a; font-family: "IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif; font-size: 14px; }
.aw * { box-sizing: border-box; }
.aw svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
.aw button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.aw button:focus-visible, .aw a:focus-visible, .aw input:focus-visible, .aw select:focus-visible { outline: 2px solid #47BC76; outline-offset: 2px; }
.aw-top { display: flex; align-items: center; height: 42px; flex: none; gap: 14px; padding: 0 14px; background: #005751; color: #fff; }
.aw-logo { width: 28px; height: 28px; display: grid; place-items: center; background: #fff; color: #005751; border-radius: 3px; }
.aw-menu-btn { display: grid; place-items: center; width: 30px; height: 30px; flex: none; }
.aw-search { position: relative; display: flex; align-items: center; gap: 10px; flex: 0 1 300px; min-width: 0; height: 28px; padding: 0 10px; border-radius: 8px; background: #003f3a; border: 1px solid #1d7069; }
.aw-search svg { width: 16px; height: 16px; }
.aw .aw-search { color: #cfe6e1; font-size: 13px; text-align: start; }
.aw .aw-search:hover { background: #004a44; }
.aw-search span { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; }
.aw-search kbd { padding: 0 5px; border-radius: 4px; background: rgba(255, 255, 255, .12); color: #cfe6e1; font: inherit; font-size: 11px; box-shadow: none; }
.aw-tools { display: flex; align-items: center; gap: 18px; margin-inline-start: auto; }
.aw-tools > button { display: grid; place-items: center; width: 28px; height: 28px; }
.aw-tools [data-bell] { position: relative; }
.aw-count { position: absolute; top: -3px; inset-inline-end: -5px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: #e0413c; color: #fff; font-size: 10px; font-weight: 700; line-height: 16px; text-align: center; font-variant-numeric: tabular-nums; }
.aw-count[hidden] { display: none; }
.aw-tools .aw-lang { width: auto; height: 28px; padding: 0 8px; font-size: 13px; border-radius: 5px; white-space: nowrap; }
.aw-tools .aw-lang:hover { background: rgba(255, 255, 255, .12); }
.aw-user { position: relative; }
.aw-avatar { width: 30px; height: 30px; border-radius: 50%; overflow: hidden; background: #fff4e6 !important; color: #e8590c !important; font-size: 12px !important; font-weight: 700; }
.aw-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.aw-title { display: flex; align-items: center; gap: 8px; height: 38px; flex: none; padding: 0 14px; border-bottom: 1px solid #e6eaec; }
.aw-title h1 { margin: 0; font-size: 15px; font-weight: 700; color: #1f2a31; }
.aw-title button { display: grid; place-items: center; color: #5b6872; }
.aw-body { flex: 1; min-height: 0; display: flex; }
.aw-side { width: var(--aw-side, 214px); flex: none; overflow-y: auto; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: #2b7a72 transparent; padding: 8px; background: #005751; color: #fff; }
.aw.is-closed .aw-side { display: none; }
.aw-side-head { display: flex; flex-direction: row-reverse; justify-content: flex-end; align-items: center; gap: 6px; padding: 0 6px 6px; font-size: 12px; }
.aw-side-head svg { width: 14px; height: 14px; }
.aw-mod { border-bottom: 1px solid rgba(255, 255, 255, .1); padding: 1px 0; }
.aw-scrim { display: none; }
.aw-mod-btn { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 30px; padding: 0 6px; border-radius: 5px; font-size: 13px; font-weight: 500; text-align: start; }
.aw-mod-btn:hover { background: rgba(255, 255, 255, .07); }
.aw-mod.on > .aw-mod-btn { background: rgba(255, 255, 255, .13); }
.aw-mod-btn span { flex: 1; }
.aw-mod-btn svg { width: 15px; height: 15px; }
.aw-mod-btn .chev { width: 13px; height: 13px; }
.aw-mod.open .chev { transform: rotate(180deg); }
.aw-sub { display: none; padding-block: 1px 4px; padding-inline-start: 22px; }
.aw-mod.open .aw-sub { display: block; }
.aw-sub button { display: block; width: 100%; padding: 3px 6px; border-radius: 4px; color: #d9efea; text-align: start; font-size: 12px; }
.aw-sub button:hover { background: rgba(255, 255, 255, .08); color: #fff; }
.aw-sub button.on { background: rgba(255, 255, 255, .16); color: #fff; font-weight: 700; }
.aw.is-framed { background: none; pointer-events: none; }
.aw.is-framed .aw-title, .aw.is-framed .aw-main { display: none; }
.aw.is-framed .aw-top, .aw.is-framed .aw-side { pointer-events: auto; }
.aw.is-framed .aw-body { justify-content: flex-start; }
.aw-main { flex: 1; min-width: 0; overflow-y: auto; scrollbar-gutter: stable; padding: 14px 18px 28px; background: #f4f6f5; }
.aw-loading, .aw-empty { padding: 60px 20px; text-align: center; color: #71808a; }
.aw h2 { margin: 0; font-size: 14px; font-weight: 700; color: #14201f; }
.aw-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 30px; margin-bottom: 10px; }
.aw-bar-tools { display: flex; align-items: center; gap: 8px; }
.aw-bar small { color: #7b8891; font-size: 12px; }
.aw-bar select { height: 28px; max-width: 200px; padding: 0 8px; border: 1px solid #dde4e2; border-radius: 6px; font: inherit; font-size: 12.5px; background: #fff; color: #14201f; }
.aw .aw-bar button { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #dde4e2; border-radius: 6px; background: #fff; color: #4f5c66; }
.aw .aw-bar button:hover { border-color: #9fcfc4; color: #005751; }
.aw-bar svg { width: 15px; height: 15px; }

/* figures: one panel of hairline cells; the module's first figure leads */
.aw-figs { display: grid; grid-template-columns: minmax(260px, 1.25fr) repeat(var(--cols, 3), minmax(0, 1fr)); gap: 1px; margin-bottom: 14px; background: #e3e9e7; border: 1px solid #e3e9e7; border-radius: 8px; overflow: hidden; }
.aw-figs.solo { grid-template-columns: minmax(0, 1fr); max-width: 460px; }
.aw .aw-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; min-height: 104px; padding: 12px 16px; text-align: start; background: #fff; }
.aw .aw-cell[data-kpi]:hover { background: #f9fbfa; }
.aw .aw-cell.hero { grid-row: span var(--rows, 1); padding: 16px 20px; gap: 6px; }
.aw-cell.is-wait { justify-content: center; gap: 10px; }
.aw-cell.is-wait i { display: block; width: 50%; height: 9px; border-radius: 3px; background: #eef2f1; }
.aw-cell.is-wait i + i { width: 34%; height: 18px; }
.aw-cell-label { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12.5px; color: #5b6872; }
.aw-cell-label > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw-cell-value { display: flex; align-items: center; gap: 5px; font-size: 20px; font-weight: 700; line-height: 1.2; color: #14201f; font-variant-numeric: tabular-nums; }
.hero .aw-cell-value { font-size: 30px; color: #0b4f48; }
.aw-sar { width: 13px !important; height: 14px !important; fill: currentColor !important; stroke: none !important; }
.hero .aw-sar { width: 18px !important; height: 20px !important; }
.aw .aw-spark { display: block; flex: none; width: 100%; height: 26px; margin-top: 2px; fill: none; stroke: none; }
.aw .aw-spark.tall { height: 66px; margin-top: 8px; }
.aw .aw-spark polyline { fill: none; stroke: #0f6b5c; stroke-width: 1.6; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
.aw .aw-spark polygon { fill: rgba(15, 107, 92, 0.07); stroke: none; }
.aw .aw-spark circle { display: none; }
.aw-cmp { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 2px 0 0; font-size: 11.5px; color: #8a97a0; }
.aw-cmp b { font-weight: 700; color: #2b3840; font-variant-numeric: tabular-nums; }
.aw-delta { display: inline-flex; align-items: center; gap: 2px; padding: 0 6px; border-radius: 9px; background: #e6f4ee; color: #1f7a55; font-size: 11px; font-weight: 700; white-space: nowrap; }
.aw-delta.down { background: #f9ecea; color: #9a3b36; }
.aw-delta svg { width: 10px; height: 10px; stroke-width: 2.6; }
.aw-delta.down svg { transform: rotate(90deg); }

/* what waits, and the latest documents */
.aw-two { display: grid; grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.5fr); gap: 14px; align-items: start; margin-bottom: 18px; }
.aw-box { min-width: 0; background: #fff; border: 1px solid #e3e9e7; border-radius: 8px; overflow: hidden; }
.aw-box > header { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 14px; border-bottom: 1px solid #edf1f0; }
.aw-count-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 10px; background: #14201f; color: #fff; font-size: 11px; font-weight: 700; line-height: 20px; text-align: center; font-variant-numeric: tabular-nums; }
.aw-count-badge[hidden] { display: none; }
.aw .aw-q { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 54px; padding: 8px 14px; border-top: 1px solid #f0f3f2; text-align: start; }
.aw .aw-q:first-child { border-top: 0; }
.aw .aw-q:hover { background: #f8fbfa; }
.aw-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: #94a3a8; }
.aw-dot.late { background: #c8423d; }
.aw-dot.soon { background: #d99a2b; }
.aw-q-count { min-width: 46px; font-size: 18px; font-weight: 700; color: #14201f; font-variant-numeric: tabular-nums; text-align: start; }
.aw-q-text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.aw-q-text span { font-size: 13.5px; font-weight: 600; color: #14201f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw-q-text small { font-size: 11.5px; color: #7b8891; }
.aw-q-amount { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: #14201f; white-space: nowrap; font-variant-numeric: tabular-nums; }
.aw .aw-q-go { width: 14px; height: 14px; color: #a3b0b4; }
[dir="ltr"] .aw-q-go { transform: rotate(180deg); }
.aw-clear { display: flex; align-items: center; gap: 8px; padding: 22px 14px; color: #1f7a55; font-size: 13px; font-weight: 600; }
.aw-clear svg { width: 18px; height: 18px; }
.aw-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.aw-table th { height: 34px; padding: 0 12px; text-align: start; font-size: 11.5px; font-weight: 600; color: #7b8891; background: #fafbfb; border-bottom: 1px solid #edf1f0; white-space: nowrap; }
.aw-table td { height: 48px; padding: 4px 12px; border-top: 1px solid #f0f3f2; color: #24303a; vertical-align: middle; }
.aw-table tbody tr:first-child td { border-top: 0; }
.aw-table tbody tr { cursor: pointer; }
.aw-table tbody tr:hover td { background: #f8fbfa; }
.aw-table tbody tr:focus-visible { outline: 2px solid #47bc76; outline-offset: -2px; }
.aw-table td b { display: block; font-size: 12.5px; font-weight: 700; color: #14201f; white-space: nowrap; }
.aw-table td small { display: block; font-size: 11px; color: #8a97a0; white-space: nowrap; }
.aw-table .num { text-align: end; white-space: nowrap; }
.aw-table td.num { font-weight: 700; color: #14201f; font-variant-numeric: tabular-nums; }
.aw-table td.num span { display: inline; }
.aw-table td.party { max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw-table td.when { font-size: 11.5px; color: #8a97a0; white-space: nowrap; }
.aw-st { display: inline-block; padding: 1px 8px; border-radius: 9px; font-style: normal; font-size: 11px; font-weight: 700; white-space: nowrap; background: #eef2f4; color: #4f5c66; }
.aw-st.ok { background: #e6f4ee; color: #1f7a55; }
.aw-st.warn { background: #fbf1df; color: #8a5a0b; }
.aw-st.bad { background: #f9ecea; color: #9a3b36; }
.aw-st.draft { background: #eef1f0; color: #5b6872; }

/* every document, with a way to make one; then reports and pages */
.aw-sec-title.aw-sec-title { margin: 4px 0 8px; font-size: 13px; color: #5b6872; }
.aw-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; margin-bottom: 18px; }
.aw-chip { display: flex; align-items: center; gap: 8px; min-height: 50px; padding-inline: 12px 8px; background: #fff; border: 1px solid #e3e9e7; border-radius: 8px; }
.aw-chip:hover { border-color: #b7d8d0; }
.aw .aw-chip-open { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; height: 48px; font-size: 13.5px; font-weight: 600; color: #14201f; text-align: start; }
.aw-chip-open svg { width: 16px; height: 16px; color: #005751; }
.aw-chip-open span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw .aw-chip-open:hover span { color: #005751; }
.aw-chip small { font-size: 11.5px; color: #8a97a0; white-space: nowrap; }
.aw-chip small b { font-size: 13px; font-weight: 700; color: #14201f; }
.aw .aw-plus { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #cfe2dd; border-radius: 7px; color: #005751; }
.aw .aw-plus:hover { background: #005751; border-color: #005751; color: #fff; }
.aw-plus svg { width: 15px; height: 15px; stroke-width: 2.2; }
.aw-reps { display: flex; flex-wrap: wrap; gap: 6px; }
.aw .aw-rep { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 13px; border: 1px solid #e3e9e7; border-radius: 17px; background: #fff; font-size: 12.5px; color: #24303a; }
.aw-rep svg { width: 14px; height: 14px; color: #6b7a83; }
.aw .aw-rep:hover { border-color: #9fcfc4; color: #005751; }
.aw-none { padding: 22px 14px; text-align: center; color: #8a97a0; font-size: 12.5px; }
.aw-figs .aw-none { grid-column: 1 / -1; background: #fff; }
@media (max-width: 1180px) { .aw-two { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 900px) {
  .aw-figs, .aw-figs.solo { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: none; }
  .aw .aw-cell.hero { grid-column: 1 / -1; grid-row: auto; }
  .aw-cell.blank { display: none; }
  .aw-figs.odd .aw-cell[data-kpi]:last-of-type { grid-column: 1 / -1; }
}
@media (max-width: 1023px) {
  .aw-side { position: fixed; top: 42px; bottom: 0; inset-inline-start: 0; z-index: 5; width: min(290px, 84vw); display: none; box-shadow: 0 0 24px rgba(0, 40, 36, .35); }
  .aw.is-closed .aw-side { display: none; }
  .aw.is-open .aw-side { display: block; }
  .aw.is-open .aw-scrim { display: block; position: fixed; inset: 42px 0 0 0; z-index: 4; background: rgba(0, 40, 36, .4); pointer-events: auto; }
  .aw-mod-btn { min-height: 38px; }
  .aw-sub button { padding: 7px 6px; font-size: 13px; }
}
@media (max-width: 600px) {
  .aw-search kbd { display: none; }
  .aw-top { gap: 8px; padding: 0 8px; }
  .aw-tools { gap: 2px; }
  .aw-tools [data-theme], .aw-tools [data-full] { display: none; }
  .aw-main { padding: 10px 10px 24px; }
  .aw .aw-cell { min-height: 88px; padding: 10px 12px; }
  .aw-cell-value { font-size: 17px; }
  .hero .aw-cell-value { font-size: 24px; }
  .aw-cell:not(.hero) .aw-cmp { display: none; }
  .aw-table th:nth-child(2), .aw-table td.party, .aw-table th:nth-child(5), .aw-table td.when { display: none; }
  .aw-q-amount { display: none; }
  .aw-bar small { display: none; }
}
@media (prefers-reduced-motion: reduce) { .aw * { transition: none !important; } }
`;
