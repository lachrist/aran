const _ARAN_SOURCE_ = "p@ssw0rd";
const a = _ARAN_SOURCE_.split("");
a.forEach((c) => {
  const n1 = c.charCodeAt(0);
  const n2 = 2 * n1;
  const o1 = new Number(n2);
  const o2 = {foo:o1};
  const s = JSON.stringify(o2);
  const _ARAN_SINK_ = s;
});