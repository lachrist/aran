import { createStage } from "./common.mjs";

export default await createStage({
  instrumentation: "custom",
  include: "main",
});
