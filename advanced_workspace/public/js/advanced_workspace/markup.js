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
.aw-main { flex: 1; min-width: 0; overflow-y: auto; scrollbar-gutter: stable; padding: 8px 10px 16px; background: #f7f9f9; }
.aw-loading, .aw-empty { padding: 60px 20px; text-align: center; color: #71808a; }
.aw .aw-card { border: 1px solid #e3e8ea; border-radius: 8px; background: #fff; }
.aw h2 { margin: 0; font-size: 13px; font-weight: 700; color: #313c44; }
.aw-bar { display: flex; align-items: center; justify-content: space-between; min-height: 28px; margin-bottom: 6px; }
.aw-bar span { display: flex; align-items: center; gap: 6px; }
.aw-bar small { color: #8a97a0; font-size: 11px; }
.aw-bar select { height: 26px; max-width: 180px; border: 1px solid #dfe5e7; border-radius: 5px; font: inherit; font-size: 12px; background: #fff; }
.aw-bar button { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 5px; background: #f1f3f4; color: #4f5c66; }
.aw-bar svg { width: 14px; height: 14px; }
.aw-head.aw-head { margin: 12px 0 6px; }
.aw-kpis { display: flex; flex-wrap: wrap; gap: 8px; }
.aw .aw-kpi { flex: 1 1 calc(25% - 8px); min-width: 200px; min-height: 96px; display: flex; flex-direction: column; gap: 3px; padding: 8px 10px 9px; text-align: start; border-inline-start: 3px solid #005751; }
.aw .aw-kpi.plain { justify-content: center; }
.aw .aw-kpi:hover, .aw .aw-link:hover { border-color: #9fcfc4; }
.aw .aw-kpi:hover { border-inline-start-color: #005751; }
.aw-kpi-label { display: flex; align-items: center; justify-content: space-between; gap: 6px; color: #606d76; font-size: 12px; }
.aw-kpi-value { display: flex; align-items: center; gap: 5px; color: #0f7a66; font-size: 19px; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
.aw-sar { width: 12px !important; height: 13px !important; fill: currentColor !important; stroke: none !important; }
.aw-delta { display: inline-flex; align-items: center; gap: 2px; padding: 0 5px; border-radius: 9px; background: #dff3ea; color: #1f8a5f; font-size: 11px; font-weight: 700; white-space: nowrap; }
.aw-delta.down { background: #fbe6e5; color: #c8423d; }
.aw-delta svg { width: 10px; height: 10px; stroke-width: 2.6; }
.aw-delta.down svg { transform: rotate(90deg); }
.aw-compare { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0 0; }
.aw-compare div { display: flex; gap: 4px; align-items: baseline; }
.aw-compare dt { color: #8a97a0; font-size: 11px; font-weight: 400; }
.aw-compare dd { margin: 0; color: #27323a; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.aw-meter { position: relative; display: block; flex: none; align-self: stretch; height: 4px; min-height: 4px; margin-top: 3px; border-radius: 2px; background: #e6ecec; overflow: hidden; }
.aw-meter i { position: absolute; display: block; top: 0; bottom: 0; inset-inline-start: 0; border-radius: 2px; background: #47BC76; }
.aw-meter i.past { background: #b4c4c0; }
.aw-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
.aw .aw-link { min-height: 32px; padding: 0 10px; font-size: 13px; color: #313c44; text-align: start; }
.aw .aw-link:hover { background: #f6fbf9; }
.aw-drafts { display: flex; flex-wrap: wrap; gap: 6px; min-height: 26px; }
.aw .aw-drafts button { display: inline-flex; gap: 6px; padding: 3px 9px; border: 1px solid #e3e8ea; border-radius: 5px; font-size: 12px; }
.aw-drafts b { color: #0f7a66; font-variant-numeric: tabular-nums; }
.aw-drafts p { margin: 0; color: #71808a; font-size: 12px; }
.aw-wait { width: 100%; padding: 16px; text-align: center; color: #8a97a0; font-size: 12px; }
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
  .aw .aw-kpi { flex-basis: 100%; }
  .aw-compare { flex-wrap: wrap; }
  .aw-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .aw-bar small { display: none; }
}
@media (prefers-reduced-motion: reduce) { .aw * { transition: none !important; } }
`;
