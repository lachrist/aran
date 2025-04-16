import { createStage } from "../count.mjs";

const { URL } = globalThis;

export default await createStage({
  include: "comp",
  output: new URL("comp-output.txt", import.meta.url),
});
