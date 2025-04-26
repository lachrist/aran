const { URL } = globalThis;

const segments = import.meta.url.split("/");
while (segments.at(-1) !== "bench") {
  segments.pop();
}
segments.push("");
const home = segments.join("/");

export const time_location = new URL("base/aran-time.json", home);
