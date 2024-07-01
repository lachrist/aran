import type { Specifier, Variable } from "../../../estree";
import type {
  ImportBinding as ImportBindingInner,
  RegularBinding as RegularBindingInner,
} from "../../query/hoist-public";

export type ImportBinding = Omit<ImportBindingInner, "variable"> & {
  export: null;
};

export type RegularBinding = Omit<RegularBindingInner, "variable"> & {
  export: Specifier[];
};

export type Binding = RegularBinding | ImportBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in Variable]?: Binding };
};
