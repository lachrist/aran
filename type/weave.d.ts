export type ArgVariable = Brand<string, "weave.ArgVariable">;

export type ResVariable = Brand<string, "weave.ResVariable">;

export type Label = Brand<string, "weave.ArgLabel">;

export type OriginPath = Brand<string, "weave.OriginPath">;

export type TargetPath = Brand<string, "weave.TargetPath">;

export type ArgAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ArgVariable;
  GlobalVariable: estree.Variable;
  Tag: OriginPath;
};

type Binding =
  | {
      type: "original";
      name: ArgVariable;
    }
  | {
      type: "callee";
      path: TargetPath;
    }
  | {
      type: "frame";
    }
  | {
      type: "completion";
    }
  | {
      type: "location";
      init: Json;
      path: TargetPath;
    };

type Free = { [k in ResVariable]?: Binding };

export type ResAtom = {
  Label: Label;
  Source: estree.Source;
  Specifier: estree.Specifier;
  Variable: ResVariable;
  GlobalVariable: estree.Variable;
  Tag: Free;
};

export as namespace weave;
