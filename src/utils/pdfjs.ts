const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67";

/** Messages the reader shell posts back to React Native. */
export type PdfReaderMessage =
  | { type: "READY" }
  | { type: "LOADED"; totalPages: number }
  | { type: "PAGE_CHANGED"; page: number }
  | { type: "ERROR"; message: string };

/** Base64 payloads are pushed in chunks; keep this a multiple of 4. */
export const PDF_CHUNK_SIZE = 524288;

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * HTML shell for the in-app reader. It renders nothing until React Native pushes
 * the file in as base64 chunks, so no URL is ever interpolated into the page and
 * the WebView never needs to fetch the document itself.
 */
export const buildReaderHtml = (options?: { background?: string }): string => {
  const background =
    options?.background && HEX.test(options.background)
      ? options.background
      : "#f1f5f9";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  html, body { height: 100%; background: ${background}; }
  #pages { display: flex; flex-direction: column; align-items: center; padding: 12px; gap: 12px; }
  .page { position: relative; width: 100%; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.18); overflow: hidden; }
  .page canvas { display: block; width: 100%; height: auto; }
  #boot { padding: 28px 20px; text-align: center; font: 600 13px -apple-system, system-ui, "Segoe UI", sans-serif; color: #64748b; }
</style>
</head>
<body>
<div id="boot">Loading reader...</div>
<div id="pages"></div>

<script>
(function () {
  window.__tkParts = [];
  window.__tkDone = false;
  window.__tkStart = null;

  window.__tkPost = function (payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  };

  // Decode on arrival so the base64 string is freed straight away.
  window.tkChunk = function (b64) {
    try {
      var bin = atob(b64);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      window.__tkParts.push(out);
    } catch (err) {
      window.__tkPost({ type: 'ERROR', message: 'Could not read the file.' });
    }
  };

  window.tkEnd = function () {
    window.__tkDone = true;
    if (window.__tkStart) window.__tkStart();
  };

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();
</script>

<script type="module">
import * as pdfjsLib from '${PDFJS_CDN}/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_CDN}/pdf.worker.min.mjs';

var post = window.__tkPost;
var boot = document.getElementById('boot');
var pagesEl = document.getElementById('pages');

// How many rasterized canvases to hold at once. Anything outside this window is
// dropped and re-rendered when the reader scrolls back to it.
var RENDER_WINDOW = 8;

var doc = null;
var slots = [];
var currentPage = 1;
var started = false;

function joinParts() {
  var parts = window.__tkParts;
  var total = 0;
  for (var i = 0; i < parts.length; i++) total += parts[i].length;
  var merged = new Uint8Array(total);
  var offset = 0;
  for (var j = 0; j < parts.length; j++) {
    merged.set(parts[j], offset);
    offset += parts[j].length;
  }
  window.__tkParts = [];
  return merged;
}

function cssPageWidth() {
  return Math.max(240, document.documentElement.clientWidth - 24);
}

function releaseSlot(slot) {
  if (!slot.canvas) return;
  slot.canvas.width = 0;
  slot.canvas.height = 0;
  slot.canvas.remove();
  slot.canvas = null;
  slot.rendered = false;
}

function trimRendered() {
  var live = slots.filter(function (s) { return s.rendered; });
  if (live.length <= RENDER_WINDOW) return;
  live.sort(function (a, b) {
    return Math.abs(b.index - currentPage) - Math.abs(a.index - currentPage);
  });
  var excess = live.length - RENDER_WINDOW;
  for (var i = 0; i < excess; i++) releaseSlot(live[i]);
}

async function renderSlot(slot) {
  if (slot.rendered || slot.busy) return;
  slot.busy = true;
  try {
    var page = await doc.getPage(slot.index);
    var width = cssPageWidth();
    var base = page.getViewport({ scale: 1 });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var viewport = page.getViewport({ scale: (width / base.width) * dpr });

    slot.el.style.height = 'auto';
    slot.el.style.aspectRatio = base.width + ' / ' + base.height;

    var canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    slot.el.appendChild(canvas);

    await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;

    slot.canvas = canvas;
    slot.rendered = true;
    trimRendered();
  } catch (err) {
    // A single page failing must not take the whole document down.
  } finally {
    slot.busy = false;
  }
}

function observe() {
  var renderObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var slot = slots[Number(entry.target.dataset.index) - 1];
      if (entry.isIntersecting) renderSlot(slot);
    });
  }, { rootMargin: '150% 0px' });

  var activeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var page = Number(entry.target.dataset.index);
      if (page === currentPage) return;
      currentPage = page;
      post({ type: 'PAGE_CHANGED', page: page });
    });
  }, { threshold: 0.5 });

  slots.forEach(function (slot) {
    renderObserver.observe(slot.el);
    activeObserver.observe(slot.el);
  });
}

async function start() {
  if (started) return;
  started = true;

  try {
    var bytes = joinParts();
    if (!bytes.length) throw new Error('The file is empty.');

    doc = await pdfjsLib.getDocument({ data: bytes }).promise;
    boot.remove();

    // Page one sets the placeholder shape for the rest, so the scrollbar is
    // roughly right before anything has rasterized.
    var first = await doc.getPage(1);
    var shape = first.getViewport({ scale: 1 });
    var ratio = shape.width + ' / ' + shape.height;

    for (var i = 1; i <= doc.numPages; i++) {
      var el = document.createElement('div');
      el.className = 'page';
      el.dataset.index = String(i);
      el.style.aspectRatio = ratio;
      pagesEl.appendChild(el);
      slots.push({ index: i, el: el, canvas: null, rendered: false, busy: false });
    }

    post({ type: 'LOADED', totalPages: doc.numPages });
    observe();
    renderSlot(slots[0]);
  } catch (err) {
    post({ type: 'ERROR', message: (err && err.message) || 'Could not open this file.' });
  }
}

window.__tkStart = start;
post({ type: 'READY' });
if (window.__tkDone) start();
</script>
</body>
</html>`;
};
