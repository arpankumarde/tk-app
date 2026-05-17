export const MIME_TYPES: Record<string, { mime: string; uti?: string }> = {
  pdf: { mime: "application/pdf", uti: "com.adobe.pdf" },
  doc: { mime: "application/msword", uti: "com.microsoft.word.doc" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uti: "org.openxmlformats.wordprocessingml.document",
  },
  xls: { mime: "application/vnd.ms-excel", uti: "com.microsoft.excel.xls" },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uti: "org.openxmlformats.spreadsheetml.sheet",
  },
  ppt: {
    mime: "application/vnd.ms-powerpoint",
    uti: "com.microsoft.powerpoint.ppt",
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    uti: "org.openxmlformats.presentationml.presentation",
  },
  txt: { mime: "text/plain", uti: "public.plain-text" },
  csv: { mime: "text/csv", uti: "public.comma-separated-values-text" },
  zip: { mime: "application/zip", uti: "public.zip-archive" },
  rar: { mime: "application/vnd.rar" },
  png: { mime: "image/png", uti: "public.png" },
  jpg: { mime: "image/jpeg", uti: "public.jpeg" },
  jpeg: { mime: "image/jpeg", uti: "public.jpeg" },
  gif: { mime: "image/gif", uti: "com.compuserve.gif" },
  webp: { mime: "image/webp" },
  mp4: { mime: "video/mp4", uti: "public.mpeg-4" },
  mp3: { mime: "audio/mpeg", uti: "public.mp3" },
  m4a: { mime: "audio/mp4", uti: "public.mpeg-4-audio" },
  epub: { mime: "application/epub+zip", uti: "org.idpf.epub-container" },
};

export const getMimeFromName = (
  name: string,
): { mime: string; uti?: string } => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? { mime: "*/*" };
};
