import { WritableCache } from "../../cache";

// kind //

export type HoistingExternalKind = "var";

export type DeadzoneExternalKind = "let" | "const";

export type ExternalKind = HoistingExternalKind | DeadzoneExternalKind;

// entry //

export type HoistingExternalEntry = [estree.Variable, HoistingExternalKind];

export type DeadzoneExternalEntry = [estree.Variable, DeadzoneExternalKind];

export type ExternalEntry = HoistingExternalEntry | DeadzoneExternalEntry;

// binding //

export type HoistingExternalBinding = {
  kind: HoistingExternalKind;
  deadzone: null;
};

export type DeadzoneExternalBinding = {
  kind: DeadzoneExternalKind;
  deadzone: WritableCache;
};

export type ExternalBinding = HoistingExternalBinding | DeadzoneExternalBinding;

// frame //

export type ExternalFrame = {
  type: "external";
  record: Record<estree.Variable, ExternalBinding>;
};
