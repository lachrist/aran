import { createStage } from "../count.mjs";

const { URL } = globalThis;

export default await createStage({
  include: "main",
  output: new URL("main-output.txt", import.meta.url),
});
