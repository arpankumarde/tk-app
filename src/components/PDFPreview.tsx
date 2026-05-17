import { useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

const PREVIEW_PAGES = 1;

const getPDFViewerHTML = (pdfUrl: string, maxPages: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs" type="module"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0f0f0; }
    #container { display: flex; flex-direction: column; align-items: center; padding: 12px; gap: 12px; }
    canvas { max-width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background: white; }
    #loading { padding: 20px; font-family: sans-serif; color: #555; }
  </style>
</head>
<body>
  <div id="loading">Loading preview...</div>
  <div id="container"></div>

  <script type="module">
    import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs';
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs';

    const MAX_PAGES = ${maxPages};
    const PDF_URL   = '${pdfUrl}';

    async function renderPDF() {
      const loadingEl  = document.getElementById('loading');
      const container  = document.getElementById('container');

      try {
        const pdf        = await pdfjsLib.getDocument({ url: PDF_URL, withCredentials: false }).promise;
        const totalPages = Math.min(pdf.numPages, MAX_PAGES);

        loadingEl.style.display = 'none';

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page     = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: window.devicePixelRatio || 2 });

          const canvas    = document.createElement('canvas');
          const ctx       = canvas.getContext('2d');
          canvas.width    = viewport.width;
          canvas.height   = viewport.height;
          canvas.style.width  = '100%';

          container.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        // Tell React Native how many pages were shown vs total
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'RENDER_DONE',
          shownPages: totalPages,
          totalPages: pdf.numPages
        }));

      } catch (err) {
        loadingEl.textContent = 'Failed to load PDF: ' + err.message;
      }
    }

    renderPDF();
  </script>
</body>
</html>
`;

export default function PDFPreview({
  pdfUrl,
  maxPages = PREVIEW_PAGES,
  style = {},
}: {
  pdfUrl: string;
  maxPages: number;
  style: any;
}) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === "RENDER_DONE") {
      console.log(`Showing ${data.shownPages} of ${data.totalPages} pages`);
    }
  };

  return (
    <View className="flex-1 rounded-lg overflow-hidden" style={style}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: getPDFViewerHTML(pdfUrl, maxPages) }}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => <ActivityIndicator className="absolute inset-0" />}
        style={{ flex: 1, backgroundColor: "#f0f0f0" }}
        scrollEnabled
        mixedContentMode="always" // Required for CORS on some PDFs:
        allowUniversalAccessFromFileURLs
      />
    </View>
  );
}
