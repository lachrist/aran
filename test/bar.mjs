import { createContext, runInContext } from "node:vm";

try {
  console.log(
    "success",
    await runInContext("import('./test/yo.mjs');", createContext({})),
  );
} catch (e) {
  console.log("failure", e);
}
