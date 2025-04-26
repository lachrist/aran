export type OtherBase = "yo" | "sandbox";

export type AranBase =
  | "aran-setup"
  | "aran-123-1"
  | "aran-123-5"
  | "aran-fibonacci-1"
  | "aran-fibonacci-5"
  | "aran-person-1"
  | "aran-person-5"
  | "aran-deltablue-1"
  | "aran-deltablue-5";

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

export type ModuleBase = AranBase | OtherBase;

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
