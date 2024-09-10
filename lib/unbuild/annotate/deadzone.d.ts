import type { Variable } from "../../estree";
import type { Hash } from "../../hash";

export type DeadzoneStatus = "dead" | "live" | "unknown";

export type DeadzoneBinding = [Variable, DeadzoneStatus];

export type DeadzoneScope = {
  [key in Variable]: DeadzoneStatus;
};

export type PackDeadzoneScope = [Variable, DeadzoneStatus][];

export type DeadzoneAnnotation = DeadzoneStatus | DeadzoneBinding[];

export type DeadzoneEntry = [Hash, DeadzoneAnnotation];

export type Deadzone = {
  [key in Hash]?: DeadzoneAnnotation;
};
