import { compileStage } from "../track-basic.mjs";

export default await compileStage({
  tracking: "intra",
  include: "main",
});
