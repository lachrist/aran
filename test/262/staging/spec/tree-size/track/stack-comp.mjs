import { compileStage } from "../track-basic.mjs";

export default await compileStage({
  tracking: "stack",
  include: "comp",
});
