import type { TaggedTemplateExpression } from "../../estree";
import type { Hash } from "../../hash";
import type { Meta } from "../meta";
import type { MetaVariable } from "../variable";

export type Template = {
  variable: MetaVariable;
  value: {
    node: TaggedTemplateExpression;
    hash: Hash;
    meta: Meta;
  };
};
