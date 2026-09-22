import { Linking, Text, View } from "react-native";

type Tone = "default" | "amber";

type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "item"; marker: string; text: string }
  | { kind: "quote"; text: string }
  | { kind: "rule" };

const TONES = {
  default: {
    text: "text-slate-600 dark:text-slate-300",
    strong: "text-slate-800 dark:text-white",
    heading: "text-slate-800 dark:text-white",
    marker: "text-primary",
    rule: "bg-gray-200 dark:bg-slate-700",
    quote: "border-orange-300 dark:border-orange-500",
  },
  amber: {
    text: "text-amber-900 dark:text-amber-200",
    strong: "text-amber-950 dark:text-amber-100",
    heading: "text-amber-950 dark:text-amber-100",
    marker: "text-amber-600 dark:text-amber-400",
    rule: "bg-amber-200 dark:bg-amber-700",
    quote: "border-amber-400 dark:border-amber-600",
  },
} as const;

const NAMED_ENTITIES: Record<string, number> = {
  amp: 38,
  lt: 60,
  gt: 62,
  quot: 34,
  apos: 39,
  nbsp: 32,
  hellip: 8230,
  lsquo: 8216,
  rsquo: 8217,
  ldquo: 8220,
  rdquo: 8221,
  ndash: 8211,
  mdash: 8212,
  bull: 8226,
  rarr: 8594,
  larr: 8592,
  times: 215,
  copy: 169,
  reg: 174,
  trade: 8482,
};

const HTML_TAG =
  /<\/?(p|div|br|h[1-6]|ul|ol|li|strong|b|em|i|u|span|a|blockquote|hr)\b[^>]*>/i;

const INLINE = /(\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*|\[[^\]]+\]\([^)\s]+\))/g;

const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    const point =
      code[0] !== "#"
        ? NAMED_ENTITIES[code.toLowerCase()]
        : code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
    return point && point <= 0x10ffff ? String.fromCodePoint(point) : match;
  });

// Teachers write descriptions in either the web rich-text editor (HTML) or
// markdown, so HTML is lowered to the same markdown subset before parsing.
const htmlToMarkdown = (html: string) =>
  html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/\s+/g, " ")
    .replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (_, list: string) => {
      let n = 0;
      return `\n${list.replace(/<li\b[^>]*>/gi, () => `\n${++n}. `)}\n`;
    })
    .replace(/<li\b[^>]*>/gi, "\n* ")
    .replace(/<h[12]\b[^>]*>/gi, "\n## ")
    .replace(/<h[3-6]\b[^>]*>/gi, "\n### ")
    .replace(/<blockquote\b[^>]*>/gi, "\n> ")
    .replace(/<hr\b[^>]*>/gi, "\n---\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|ul|ol|li|h[1-6]|blockquote)\b[^>]*>/gi, "\n")
    .replace(/<\/?(strong|b)\b[^>]*>/gi, "**")
    .replace(/<\/?(em|i)\b[^>]*>/gi, "*")
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/\n(\* |\d+\. )\s*\n+/g, "\n$1");

const parseBlocks = (markdown: string): Block[] =>
  markdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): Block => {
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) return { kind: "rule" };
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        return {
          kind: "heading",
          level: heading[1].length <= 2 ? 2 : 3,
          text: heading[2].replace(/\s+#+$/, ""),
        };
      }
      const bullet = /^[*\-•+]\s+(.*)$/.exec(line);
      if (bullet) return { kind: "item", marker: "•", text: bullet[1] };
      const ordered = /^(\d+)[.)]\s+(.*)$/.exec(line);
      if (ordered) {
        return { kind: "item", marker: `${ordered[1]}.`, text: ordered[2] };
      }
      if (line.startsWith(">")) {
        return { kind: "quote", text: line.replace(/^>\s*/, "") };
      }
      return { kind: "paragraph", text: line };
    });

const renderInline = (text: string, strongClass: string) =>
  text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text key={i} className={`font-bold ${strongClass}`}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link) {
        const label = link[1].replace(/\*+/g, "");
        if (!/^(https?:|mailto:|tel:)/i.test(link[2])) return label;
        return (
          <Text
            key={i}
            className="text-primary underline"
            onPress={() => Linking.openURL(link[2]).catch(() => {})}
          >
            {label}
          </Text>
        );
      }
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
        return (
          <Text key={i} className="italic">
            {part.slice(1, -1)}
          </Text>
        );
      }
      return part.replace(/\*{2,}/g, "");
    });

interface RichTextProps {
  content: string;
  tone?: Tone;
}

/** Renders a description that may be HTML, markdown or plain text. */
const RichText = ({ content, tone = "default" }: RichTextProps) => {
  const t = TONES[tone];
  const source = HTML_TAG.test(content) ? htmlToMarkdown(content) : content;
  const blocks = parseBlocks(decodeEntities(source));

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.kind === "rule") {
          return <View key={i} className={`h-px my-3 ${t.rule}`} />;
        }
        if (block.kind === "heading") {
          return (
            <Text
              key={i}
              className={`${block.level === 2 ? "text-xl" : "text-lg"} font-black mb-2 ${i > 0 ? "mt-3" : ""} ${t.heading}`}
            >
              {renderInline(block.text, t.strong)}
            </Text>
          );
        }
        if (block.kind === "item") {
          return (
            <View key={i} className="flex-row mb-2">
              <Text className={`text-base leading-7 font-bold mr-2.5 ${t.marker}`}>
                {block.marker}
              </Text>
              <Text className={`flex-1 text-base leading-7 ${t.text}`}>
                {renderInline(block.text, t.strong)}
              </Text>
            </View>
          );
        }
        if (block.kind === "quote") {
          return (
            <View key={i} className={`border-l-4 pl-3 mb-3 ${t.quote}`}>
              <Text className={`text-base leading-7 italic ${t.text}`}>
                {renderInline(block.text, t.strong)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} className={`text-base leading-7 mb-3 ${t.text}`}>
            {renderInline(block.text, t.strong)}
          </Text>
        );
      })}
    </View>
  );
};

export default RichText;
