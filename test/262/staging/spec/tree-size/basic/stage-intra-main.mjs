import { compileStage } from "./common.mjs";

export default await compileStage({
  procedural: "intra",
  include: "main",
});
