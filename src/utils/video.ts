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
