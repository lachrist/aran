import { compileStage } from "./common.mjs";

export default await compileStage({
  tracking: "stack",
  include: "comp",
});
