const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67";

/** `pdf` loads pdf.js from cdnjs; `images` shows image pages and needs no engine. */
export type ReaderEngine = "pdf" | "images";

/** Messages the reader shell posts back to React Native. */
export type ReaderMessage =
  | { type: "READY" }
  | { type: "LOADED"; totalPages: number }
  | { type: "PAGE_CHANGED"; page: number }
  | { type: "NEED_PAGE"; page: number }
  | { type: "ERROR"; message: string };

/** Base64 payloads are pushed in chunks; keep this a multiple of 4. */
export const READER_CHUNK_SIZE = 524288;

/** Serializes a value as an argument for a call injected into the shell. */
export const jsArg = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/**
 * HTML shell for every in-app document view, so each one scrolls, zooms and counts
 * pages the same way. Only the page source differs:
 *
 * - `tkChunk(b64)` then `tkEnd(mime)`: a purchased file pushed in as base64, so no
 *   URL for a paid file is ever put into the page. A PDF or a single image.
 * - `tkOpenUrl(url)`: a PDF pdf.js fetches itself (course lessons).
 * - `tkInitPages(total, width, height)`: page images whose URLs React Native supplies
 *   through `tkPage` / `tkPageFailed` after each `NEED_PAGE` (study note previews).
 */
export const buildReaderHtml = (options: {
  engine: ReaderEngine;
  dark?: boolean;
  endNote?: string;
}): string => {
  const background = options.dark ? "#0f172a" : "#f1f5f9";
  const muted = options.dark ? "#cbd5e1" : "#475569";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  html, body { min-height: 100%; background: ${background}; }
  body { font: 600 13px -apple-system, system-ui, "Segoe UI", sans-serif; }
  #pages { display: flex; flex-direction: column; align-items: center; padding: 12px; gap: 12px; }
  .page { position: relative; width: 100%; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.18); overflow: hidden; }
  .page canvas, .page img { display: block; width: 100%; height: auto; }
  .failed { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center; color: #334155; background: #fff; }
  .failed button { font: inherit; font-weight: 700; color: #903209; background: #fff; border: 1px solid #fdba74; border-radius: 10px; padding: 8px 18px; }
  #boot, #end { padding: 24px 20px 32px; text-align: center; color: ${muted}; }
</style>
</head>
<body>
<div id="boot">Loading...</div>
<div id="pages"></div>

<script>
(function () {
  // Must match maximum-scale in the viewport meta tag.
  var MAX_ZOOM = 5;
  // How many rasterized pages to hold at once, capped by a pixel budget because
  // zoomed pages are rasterized sharper and cost more. Anything dropped is
  // re-rendered when the reader scrolls back to it.
  var RENDER_WINDOW = 8;
  var MAX_PAGE_PIXELS = 8000000;
  var MAX_TOTAL_PIXELS = 16000000;
  var HAS_PDF = ${options.engine === "pdf"};
  var END_NOTE = ${options.endNote ? jsArg(options.endNote) : "null"};

  var boot = document.getElementById('boot');
  var pagesEl = document.getElementById('pages');
  var slots = [];
  var engine = null;
  var currentPage = 1;
  var zoom = 1;
  var settleTimer = null;
  var parts = [];
  var waiters = {};

  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }

  function fail(message) {
    post({ type: 'ERROR', message: message || 'Could not open this file.' });
  }

  // Decode on arrival so each base64 string is freed straight away.
  window.tkChunk = function (b64) {
    try {
      var bin = atob(b64);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      parts.push(out);
    } catch (err) {
      fail('Could not read the file.');
    }
  };

  function takeBytes() {
    var total = 0;
    for (var i = 0; i < parts.length; i++) total += parts[i].length;
    var merged = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < parts.length; j++) {
      merged.set(parts[j], offset);
      offset += parts[j].length;
    }
    parts = [];
    return merged;
  }

  function cssPageWidth() {
    return Math.max(240, document.documentElement.clientWidth - 24);
  }

  // Pinch zoom only moves the visual viewport, so the layout (and page width) stays
  // put. Quantize the scale so every small pinch adjustment does not re-rasterize.
  function readZoom() {
    var vv = window.visualViewport;
    var scale = vv ? vv.scale : 1;
    return Math.min(MAX_ZOOM, Math.max(1, Math.ceil(scale * 2 - 0.05) / 2));
  }

  function visibleRange() {
    var vv = window.visualViewport;
    if (!vv) return { top: 0, bottom: window.innerHeight };
    return { top: vv.offsetTop, bottom: vv.offsetTop + vv.height };
  }

  function isVisible(slot, range) {
    var rect = slot.el.getBoundingClientRect();
    return rect.bottom > range.top && rect.top < range.bottom;
  }

  function releaseSlot(slot) {
    if (!slot.node) return;
    if (slot.node.tagName === 'CANVAS') {
      slot.node.width = 0;
      slot.node.height = 0;
    }
    slot.node.remove();
    slot.node = null;
    slot.rendered = false;
  }

  function trimRendered() {
    var range = visibleRange();
    var live = slots.filter(function (s) { return s.rendered; });
    live.forEach(function (s) {
      s.rank = isVisible(s, range) ? -1 : Math.abs(s.index - currentPage);
    });
    live.sort(function (a, b) { return a.rank - b.rank; });
    var pixels = 0;
    for (var i = 0; i < live.length; i++) {
      pixels += live[i].pixels;
      // Pages on screen always stay, whatever the budget.
      if (live[i].rank === -1) continue;
      if (i >= RENDER_WINDOW || pixels > MAX_TOTAL_PIXELS) releaseSlot(live[i]);
    }
  }

  function showFailure(slot, message) {
    var box = document.createElement('div');
    box.className = 'failed';
    var text = document.createElement('p');
    text.textContent = message || 'This page could not be loaded.';
    var button = document.createElement('button');
    button.textContent = 'Retry';
    button.addEventListener('click', function () {
      box.remove();
      slot.failure = null;
      renderSlot(slot, zoom);
    });
    box.appendChild(text);
    box.appendChild(button);
    slot.el.appendChild(box);
    slot.failure = box;
  }

  async function renderSlot(slot, level) {
    if (slot.failure) return;
    if (slot.busy) {
      slot.pendingLevel = level;
      return;
    }
    slot.busy = true;
    try {
      var result = await engine.draw(slot, level);
      if (result) {
        // Swap only once the new page is ready so a zoom never flashes a blank page.
        releaseSlot(slot);
        slot.el.appendChild(result.node);
        slot.node = result.node;
        slot.scale = result.scale;
        slot.pixels = result.pixels;
        slot.rendered = true;
        trimRendered();
      }
    } catch (err) {
      // A single page failing must not take the whole document down.
      showFailure(slot, err && err.shown ? err.message : null);
    } finally {
      slot.busy = false;
      if (slot.pendingLevel != null) {
        var next = slot.pendingLevel;
        slot.pendingLevel = null;
        renderSlot(slot, next);
      }
    }
  }

  // After a pinch or a pan settles, re-render the pages on screen at the new zoom
  // so PDF text stays sharp instead of stretching the page-width bitmap.
  function refreshVisible() {
    if (!engine) return;
    zoom = readZoom();
    var range = visibleRange();
    var middle = (range.top + range.bottom) / 2;
    var visible = slots.filter(function (s) { return isVisible(s, range); });

    visible.forEach(function (slot) {
      var rect = slot.el.getBoundingClientRect();
      if (rect.top <= middle && rect.bottom >= middle && slot.index !== currentPage) {
        currentPage = slot.index;
        post({ type: 'PAGE_CHANGED', page: currentPage });
      }
      renderSlot(slot, zoom);
    });
  }

  function onViewportChange() {
    if (zoom === 1 && readZoom() === 1) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(refreshVisible, 200);
  }

  function observe() {
    var renderObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var slot = slots[Number(entry.target.dataset.index) - 1];
        // Pages coming into range render at page width; refreshVisible sharpens
        // the ones actually on screen while zoomed.
        if (entry.isIntersecting && !slot.rendered) renderSlot(slot, 1);
      });
    }, { rootMargin: '150% 0px' });

    // Tracks the layout viewport, so while zoomed refreshVisible owns the page count.
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || zoom > 1) return;
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

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onViewportChange);
      window.visualViewport.addEventListener('scroll', onViewportChange);
    }
    window.addEventListener('scroll', onViewportChange, { passive: true });
  }

  // ratio is a CSS aspect-ratio used for every page until it renders, so the
  // scrollbar is roughly right before anything has loaded.
  function mount(total, ratio, nextEngine) {
    if (engine) return;
    engine = nextEngine;
    boot.remove();

    for (var i = 1; i <= total; i++) {
      var el = document.createElement('div');
      el.className = 'page';
      el.dataset.index = String(i);
      el.style.aspectRatio = ratio;
      pagesEl.appendChild(el);
      slots.push({ index: i, el: el, node: null, rendered: false, busy: false, scale: 0, pixels: 0, pendingLevel: null, failure: null });
    }

    if (END_NOTE) {
      var end = document.createElement('div');
      end.id = 'end';
      end.textContent = END_NOTE;
      document.body.appendChild(end);
    }

    post({ type: 'LOADED', totalPages: total });
    observe();
    renderSlot(slots[0], 1);
  }

  function loadImage(slot, src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.alt = '';
      img.onload = function () {
        slot.el.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
        resolve({ node: img, scale: 1, pixels: img.naturalWidth * img.naturalHeight });
      };
      img.onerror = function () {
        reject(new Error('This page could not be loaded.'));
      };
      img.src = src;
    });
  }

  // Images are shown at their own resolution, so a zoom never needs a re-render.
  function imageEngine(resolveSrc) {
    return {
      draw: function (slot) {
        if (slot.rendered) return Promise.resolve(null);
        return resolveSrc(slot.index).then(function (src) { return loadImage(slot, src); });
      }
    };
  }

  window.tkEnd = function (mime) {
    if (mime && mime.indexOf('image/') === 0) {
      var url = URL.createObjectURL(new Blob([takeBytes()], { type: mime }));
      mount(1, '3 / 4', imageEngine(function () { return Promise.resolve(url); }));
      return;
    }
    if (window.__tk.openBytes) window.__tk.openBytes();
  };

  window.tkInitPages = function (total, width, height) {
    mount(total, width + ' / ' + height, imageEngine(function (index) {
      return new Promise(function (resolve, reject) {
        waiters[index] = { resolve: resolve, reject: reject };
        post({ type: 'NEED_PAGE', page: index });
      });
    }));
  };

  window.tkPage = function (index, url) {
    var waiter = waiters[index];
    if (!waiter) return;
    delete waiters[index];
    waiter.resolve(url);
  };

  window.tkPageFailed = function (index, message) {
    var waiter = waiters[index];
    if (!waiter) return;
    delete waiters[index];
    var err = new Error(message);
    err.shown = true;
    waiter.reject(err);
  };

  window.__tk = {
    post: post,
    fail: fail,
    mount: mount,
    takeBytes: takeBytes,
    cssPageWidth: cssPageWidth,
    maxPagePixels: MAX_PAGE_PIXELS,
    openBytes: null
  };

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  if (!HAS_PDF) post({ type: 'READY' });
})();
</script>
${options.engine === "pdf" ? PDF_ENGINE : ""}
</body>
</html>`;
};

const PDF_ENGINE = `<script type="module">
import * as pdfjsLib from '${PDFJS_CDN}/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_CDN}/pdf.worker.min.mjs';

var tk = window.__tk;

function renderScale(base, level) {
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var scale = (tk.cssPageWidth() / base.width) * dpr * level;
  return Math.min(scale, Math.sqrt(tk.maxPagePixels / (base.width * base.height)));
}

async function open(source) {
  try {
    var doc = await pdfjsLib.getDocument(source).promise;
    var first = await doc.getPage(1);
    var shape = first.getViewport({ scale: 1 });

    tk.mount(doc.numPages, shape.width + ' / ' + shape.height, {
      draw: async function (slot, level) {
        var page = await doc.getPage(slot.index);
        var base = page.getViewport({ scale: 1 });
        var scale = renderScale(base, level);
        if (slot.rendered && Math.abs(slot.scale - scale) < 0.01) return null;
        var viewport = page.getViewport({ scale: scale });

        var canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;

        slot.el.style.aspectRatio = base.width + ' / ' + base.height;
        return { node: canvas, scale: scale, pixels: canvas.width * canvas.height };
      }
    });
  } catch (err) {
    tk.fail();
  }
}

tk.openBytes = function () { open({ data: tk.takeBytes() }); };
window.tkOpenUrl = function (url) { open({ url: url, withCredentials: false }); };
tk.post({ type: 'READY' });
</script>`;
