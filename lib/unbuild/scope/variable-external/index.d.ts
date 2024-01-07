import { WritableCache } from "../../cache";

export type HoistingExternalBinding = {
  kind: "var";
  deadzone: null;
};

export type DeadzoneExternalBinding = {
  kind: "let" | "const";
  deadzone: WritableCache;
};

export type ExternalBinding = HoistingExternalBinding | DeadzoneExternalBinding;

export type ExternalFrame = {
  type: "external";
  record: Record<estree.Variable, ExternalBinding>;
};
