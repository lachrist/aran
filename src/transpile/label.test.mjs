import {assertEqual} from "../__fixture__.mjs";

import {
  makeFullBreakLabel,
  isBreakLabel,
  isContinueLabel,
  getLabelBody,
} from "./label.mjs";

assertEqual(getLabelBody(makeFullBreakLabel("label")), "label");
assertEqual(isBreakLabel(makeFullBreakLabel("label")), true);
assertEqual(isContinueLabel(makeFullBreakLabel("label")), false);
