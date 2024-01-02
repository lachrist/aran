import { WritableCache } from "../../cache";

export type HoistingExternalKind = "var";

export type DeadzoneExternalKind = "let" | "const";

export type ExternalKind = HoistingExternalKind | DeadzoneExternalKind;

export type HoistingExternalBinding = {
  kind: HoistingExternalKind;
  deadzone: null;
};

export type DeadzoneExternalBinding = {
  kind: DeadzoneExternalKind;
  deadzone: WritableCache;
};

export type ExternalBinding = HoistingExternalBinding | DeadzoneExternalBinding;

export type ExternalFrame = {
  type: "external";
  record: Record<estree.Variable, ExternalBinding>;
};
