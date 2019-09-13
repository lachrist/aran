const _ARAN_SOURCE_ = "p@ssw0rd";
// const x = _ARAN_SOURCE_.charCodeAt(0);
// const y = 2 * x;
// const z = new Number(y);
// const t = {foobar:z};
const c = _ARAN_SOURCE_[0];
const _ARAN_SINK_ = JSON.stringify(c);
// const _ARAN_SINK_ = JSON.stringify(t);

// const cs = _ARAN_SOURCE_.split("");
// cs.forEach((c) => {
//   const x = c.charCodeAt(0);
//   const y = 2 * x;
//   const z = new Number(y);
//   const t = {foobar:z};
//   const _ARAN_SINK_ = JSON.stringify(t);
// });