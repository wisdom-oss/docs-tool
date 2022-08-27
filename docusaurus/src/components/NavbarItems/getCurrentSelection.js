export default function getCurrentSelection(pathname) {
  let match = pathname.match(
    /^\/(?<repo>[^/]+)\/(?<branch>[^/]+)\/(?<group>[^/]+)\/(?<rest>.*)/
  );
  if (!match) return null;
  return match.groups;
}
