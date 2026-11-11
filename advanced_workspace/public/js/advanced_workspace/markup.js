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
.aw h2 { margin: 0; font-size: 14px; font-weight: 700; color: #1c2833; }
.aw-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 30px; margin-bottom: 10px; }
.aw-bar-tools { display: flex; align-items: center; gap: 8px; }
.aw-bar small { color: #7b8891; font-size: 12px; }
.aw-bar select { height: 28px; max-width: 200px; padding: 0 8px; border: 1px solid #dde4e2; border-radius: 6px; font: inherit; font-size: 12.5px; background: #fff; color: #1c2833; }
.aw .aw-bar button { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #dde4e2; border-radius: 6px; background: #fff; color: #4f5c66; }
.aw .aw-bar button:hover { border-color: #9fcfc4; color: #005751; }
.aw-bar svg { width: 15px; height: 15px; }

/* figures: tiles keep their width, however few there are */
.aw-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(236px, 1fr)); gap: 10px; margin-bottom: 20px; }
.aw .aw-kpi { position: relative; display: flex; flex-direction: column; gap: 4px; min-height: 106px; padding: 11px 15px 12px; text-align: start; background: #fff; border: 1px solid #e2e8e6; border-radius: 6px; }
.aw .aw-kpi::before { content: ""; position: absolute; top: 10px; bottom: 10px; inset-inline-start: -1px; width: 3px; border-radius: 2px; background: #005751; }
.aw .aw-kpi.plain { justify-content: center; }
.aw .aw-kpi:hover { border-color: #9fcfc4; }
.aw .aw-kpi.is-wait { justify-content: center; gap: 10px; }
.aw .aw-kpi.is-wait::before { background: #dfe7e5; }
.aw-kpi.is-wait i { display: block; width: 55%; height: 9px; border-radius: 3px; background: #eef2f1; }
.aw-kpi.is-wait i + i { width: 38%; height: 18px; }
.aw-kpi-label { display: flex; align-items: center; justify-content: space-between; gap: 6px; color: #5b6872; font-size: 12.5px; }
.aw-kpi-value { display: flex; align-items: center; gap: 5px; color: #0f6b5c; font-size: 22px; font-weight: 700; line-height: 1.25; font-variant-numeric: tabular-nums; }
.aw-sar { width: 13px !important; height: 14px !important; fill: currentColor !important; stroke: none !important; }
.aw-delta { display: inline-flex; align-items: center; gap: 2px; padding: 0 6px; border-radius: 9px; background: #dff3ea; color: #1f7a55; font-size: 11px; font-weight: 700; white-space: nowrap; }
.aw-delta.down { background: #fbe6e5; color: #b8403b; }
.aw-delta svg { width: 10px; height: 10px; stroke-width: 2.6; }
.aw-delta.down svg { transform: rotate(90deg); }
.aw-compare { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0 0; }
.aw-compare div { display: flex; gap: 4px; align-items: baseline; }
.aw-compare dt { color: #8a97a0; font-size: 11px; font-weight: 400; }
.aw-compare dd { margin: 0; color: #27323a; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.aw-meter { position: relative; display: block; flex: none; align-self: stretch; height: 4px; min-height: 4px; margin-top: 4px; border-radius: 2px; background: #e8eeec; overflow: hidden; }
.aw-meter i { position: absolute; display: block; top: 0; bottom: 0; inset-inline-start: 0; border-radius: 2px; background: #2f9e6d; }
.aw-meter i.past { background: #b8c7c3; }

/* documents with their numbers, and the latest documents beside them */
.aw-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 18px; align-items: start; }
.aw-sec { min-width: 0; }
.aw-sec-head { display: flex; align-items: center; justify-content: space-between; min-height: 24px; margin: 0 0 8px; }
.aw-sub-head.aw-sub-head { margin-top: 20px; }
.aw-panel { background: #fff; border: 1px solid #e2e8e6; border-radius: 6px; overflow: hidden; }
.aw-doc { display: grid; grid-template-columns: minmax(0, 1fr) 150px 104px 78px; align-items: center; gap: 10px; min-height: 50px; padding: 0 14px; border-top: 1px solid #edf1f0; }
.aw-doc:first-child { border-top: 0; }
.aw-doc:hover { background: #f8fbfa; }
.aw .aw-doc-open { display: flex; align-items: center; gap: 10px; min-width: 0; height: 50px; font-size: 14px; font-weight: 600; color: #1c2833; text-align: start; }
.aw-doc-open svg { width: 17px; height: 17px; color: #005751; }
.aw-doc-open span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw .aw-doc-open:hover span { color: #005751; text-decoration: underline; text-underline-offset: 4px; }
.aw-month { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
.aw-month b { font-size: 15px; font-weight: 700; color: #1c2833; font-variant-numeric: tabular-nums; }
.aw-month small { font-size: 11px; color: #8a97a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.aw-month small.quiet { color: #a8b3b9; }
.aw .aw-pill { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; background: #fbf1df; color: #8a5a0b; font-size: 12px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.aw .aw-pill:hover { background: #f5e2bc; }
[data-new-slot] { justify-self: end; }
.aw .aw-new { display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px; border: 1px solid #cfe2dd; border-radius: 6px; color: #005751; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.aw .aw-new:hover { background: #005751; border-color: #005751; color: #fff; }
.aw-new svg { width: 13px; height: 13px; stroke-width: 2.2; }
.aw-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; }
.aw .aw-link { display: flex; align-items: center; gap: 9px; min-height: 40px; padding: 0 12px; background: #fff; border: 1px solid #e2e8e6; border-radius: 6px; font-size: 13px; color: #24303a; text-align: start; }
.aw-link svg { width: 15px; height: 15px; color: #6b7a83; }
.aw .aw-link:hover { border-color: #9fcfc4; color: #005751; }
.aw .aw-act { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 54px; padding: 8px 14px; border-top: 1px solid #edf1f0; text-align: start; }
.aw .aw-act:first-child { border-top: 0; }
.aw .aw-act:hover { background: #f8fbfa; }
.aw-act-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.aw-act-main b { font-size: 13px; font-weight: 600; color: #1c2833; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw-act-main small { font-size: 11.5px; color: #7b8891; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.aw-act-side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex: none; }
.aw-act-side small { font-size: 11px; color: #8a97a0; white-space: nowrap; }
.aw-st { font-style: normal; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 9px; background: #eef2f1; color: #5b6872; }
.aw-st.s0 { background: #fbf1df; color: #8a5a0b; }
.aw-st.s0.saved { background: #eef2f1; color: #5b6872; }
.aw-st.s1 { background: #dff3ea; color: #1f7a55; }
.aw-st.s2 { background: #fbe6e5; color: #b8403b; }
.aw-none { padding: 22px 14px; text-align: center; color: #8a97a0; font-size: 12.5px; }
.aw-kpis .aw-none { grid-column: 1 / -1; background: #fff; border: 1px dashed #dde4e2; border-radius: 6px; }
@media (max-width: 1180px) { .aw-cols { grid-template-columns: minmax(0, 1fr); } }
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
  .aw-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
  .aw .aw-kpi { min-height: 84px; padding: 9px 11px 10px; }
  .aw-kpi-label { flex-wrap: wrap; font-size: 12px; }
  .aw-kpi-value { font-size: 17px; }
  .aw-compare { display: none; }
  .aw-doc { grid-template-columns: minmax(0, 1fr) auto auto; padding: 0 10px; }
  .aw-month { display: none; }
  .aw-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .aw-bar small { display: none; }
}
@media (prefers-reduced-motion: reduce) { .aw * { transition: none !important; } }
`;
