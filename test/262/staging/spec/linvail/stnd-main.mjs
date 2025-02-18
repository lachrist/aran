import { createStage } from "./common.mjs";

export default await createStage({
  instrumentation: "standard",
  include: "main",
});
