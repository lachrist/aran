let c = false;
let f = false;
try {
  throw "ok";
  throw "BOUM";
} catch (e) {
  c = e;
} finally {
  f = true;
}
if (c !== "ok")
  throw new Error("Throw1");
if (!f)
  throw new Error("Throw2");