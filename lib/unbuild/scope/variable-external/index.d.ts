import { WritableCache } from "../../cache";

export type LifespanExternalBinding = {
  kind: "var" | "function";
  deadzone: null;
};

export type DeadzoneExternalBinding = {
  kind: "let" | "const" | "class";
  deadzone: WritableCache;
};

export type ExternalBinding = LifespanExternalBinding | DeadzoneExternalBinding;

export type ExternalFrame = {
  type: "external";
  record: Record<estree.Variable, ExternalBinding>;
};
