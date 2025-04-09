export type ModuleBase = "yo" | "sandbox" | "aran";

export type OctaneBase =
  | "box2d"
  | "code-load"
  | "crypto"
  | "deltablue"
  | "early-boyer"
  | "gbemu"
  | "mandreel"
  | "navier-stokes"
  | "pdfjs"
  | "raytrace"
  | "regexp"
  | "richards"
  | "splay"
  | "typescript"
  | "zlib";

export type Base = ModuleBase | OctaneBase;

export type Meta = "identity" | "bare" | "full" | "track-origin";
