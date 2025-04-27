export type OtherBase = "yo" | "sandbox";

export type AutoBase =
  | "auto-123-0"
  | "auto-123-1"
  | "auto-123-5"
  | "auto-fibonacci-1"
  | "auto-fibonacci-5"
  | "auto-person-1"
  | "auto-person-5"
  | "auto-deltablue-1"
  | "auto-deltablue-5";

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

export type ModuleBase = AutoBase | OtherBase;

export type Base = ModuleBase | OctaneBase;

export type ProvenancyMeta =
  | "provenancy/stack"
  | "provenancy/intra"
  | "provenancy/inter"
  | "provenancy/store/internal"
  | "provenancy/store/external";

export type LinvailMeta =
  | "linvail/standard/internal"
  | "linvail/standard/external"
  | "linvail/custom/internal"
  | "linvail/custom/external";

export type SymbolicMeta =
  | "symbolic/intensional/void"
  | "symbolic/intensional/file"
  | "symbolic/extensional/void"
  | "symbolic/extensional/file";

export type OtherMeta = "none" | "bare" | "full" | "track";

export type Meta = OtherMeta | LinvailMeta | ProvenancyMeta | SymbolicMeta;
