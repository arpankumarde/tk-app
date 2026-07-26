export function redirectSystemPath({
  path,
  initial: _initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const { pathname, search } = parsePath(path);
    const segments = pathname.split("/").filter(Boolean);
    const [first, second, third] = segments;
    const out = (target: string) => `${target}${search}`;

    if (first === "course" && !second) return out("/courses");

    if (first === "mock-test") {
      if (!second) return out("/tests");
      if (second === "live") return out(third ? `/live/${third}` : "/live");
      return out(`/tests/${second}`);
    }

    if (first === "bundle" || first === "bundles") {
      if (!second) return out("/bundles");
      return out(`/bundles/${second}`);
    }

    if (first === "study-notes") {
      if (!second) return out("/shop");
      return out(`/product/${second}`);
    }

    if (first === "student") {
      if (!second || second === "dashboard") return out("/user");
      if (second === "shop") return out("/user/products");
      return out(`/user/${segments.slice(1).join("/")}`);
    }

    return out(pathname);
  } catch {
    return path;
  }
}

function parsePath(input: string): { pathname: string; search: string } {
  let s = input;
  const protoIdx = s.indexOf("://");
  if (protoIdx >= 0) {
    s = s.slice(protoIdx + 3);
    const slashIdx = s.indexOf("/");
    s = slashIdx >= 0 ? s.slice(slashIdx) : "/";
  }
  if (!s.startsWith("/")) s = `/${s}`;
  const qIdx = s.indexOf("?");
  const hIdx = s.indexOf("#");
  let endIdx = s.length;
  if (qIdx >= 0) endIdx = Math.min(endIdx, qIdx);
  if (hIdx >= 0) endIdx = Math.min(endIdx, hIdx);
  return {
    pathname: s.slice(0, endIdx) || "/",
    search: qIdx >= 0 ? s.slice(qIdx, hIdx >= 0 ? hIdx : undefined) : "",
  };
}
