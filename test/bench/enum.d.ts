export type ModuleBase = "yo" | "sandbox" | "aran";

export type OctaneBase =
  | "box2d"
  | "code-load"
  | "crypto"
  | "deltablue"
  | "earley-boyer"
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

export type Meta =
  | "none"
  | "bare"
  | "full"
  | "track"
  | "linvail"
  | "linvail/standard/internal"
  | "linvail/standard/external"
  | "linvail/custom/internal"
  | "linvail/custom/external"
  | "symbolic/intensional/void"
  | "symbolic/intensional/file"
  | "symbolic/extensional/void"
  | "symbolic/extensional/file"
  | "provenancy/stack"
  | "provenancy/intra"
  | "provenancy/inter"
  | "provenancy/store/internal"
  | "provenancy/store/external";
