export const isYouTubeUrl = (url: string) =>
  url.includes("youtube.com/") || url.includes("youtu.be/");

export const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  return match
    ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&playsinline=1&autoplay=1`
    : url;
};

// Top-frame pages the Gumlet player WebView may show. Frames inside Gumlet's player are not
// restricted: on iOS an originWhitelist also applies to iframes and hands any miss to Safari.
const GUMLET_PLAYER_PAGE =
  /^https:\/\/(testkart\.in|([a-z0-9-]+\.)+gumlet\.io)(\/|\?|#|$)/i;

export const isGumletPlayerPageAllowed = (url: string) =>
  url.startsWith("about:") || GUMLET_PLAYER_PAGE.test(url);

// DRM lessons play only in Gumlet's hosted player. The iframe sits in a testkart.in page so the
// embed sees testkart.in as its referrer, which a Gumlet domain restriction checks.
export const getGumletPlayerHTML = (embedUrl: string) => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head><body>
  <iframe src="${encodeURI(embedUrl)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
</body></html>`;

export const getYouTubePlayerHTML = (embedUrl: string) => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head><body>
  <iframe src="${embedUrl}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
</body></html>`;
