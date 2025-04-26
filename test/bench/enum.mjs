const {
  Object: { hasOwn },
  Reflect: { ownKeys },
} = globalThis;

/**
 * @type {{
 *   [key in import("./enum.d.ts").OctaneBase]: null
 * }}
 */
export const OCTANE_BASE_RECORD = {
  "box2d": null,
  "code-load": null,
  "crypto": null,
  "deltablue": null,
  "earley-boyer": null,
  "gbemu": null,
  "mandreel": null,
  "navier-stokes": null,
  "pdfjs": null,
  "raytrace": null,
  "regexp": null,
  "richards": null,
  "splay": null,
  "typescript": null,
  "zlib": null,
};

export const OCTANE_BASE_ENUM =
  /** @type {import("./enum.d.ts").OctaneBase[]} */ (
    ownKeys(OCTANE_BASE_RECORD)
  );

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").OctaneBase}
 */
export const isOctaneBase = (name) => hasOwn(OCTANE_BASE_RECORD, name);

/**
 * @type {{
 *   [key in import("./enum.d.ts").AutoBase]: null
 * }}
 */
export const AUTO_BASE_RECORD = {
  "auto-123-0": null,
  "auto-123-1": null,
  "auto-123-5": null,
  "auto-fibonacci-1": null,
  "auto-fibonacci-5": null,
  "auto-person-1": null,
  "auto-person-5": null,
  "auto-deltablue-1": null,
  "auto-deltablue-5": null,
};

export const AUTO_BASE_ENUM = /** @type {import("./enum.d.ts").AutoBase[]} */ (
  ownKeys(AUTO_BASE_RECORD)
);

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").AutoBase}
 */
export const isAutoBase = (name) => hasOwn(AUTO_BASE_RECORD, name);

/**
 * @type {{
 *   [key in import("./enum.d.ts").OtherBase]: null
 * }}
 */
export const OTHER_BASE_RECORD = {
  yo: null,
  sandbox: null,
};

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").OtherBase}
 */
export const isOtherBase = (name) => hasOwn(OTHER_BASE_RECORD, name);

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").ModuleBase}
 */
export const isModuleBase = (name) => isOtherBase(name) || isAutoBase(name);

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").Base}
 */
export const isBase = (name) => isModuleBase(name) || isOctaneBase(name);

/**
 * @type {{
 *   [key in import("./enum.d.ts").Meta]: null
 * }}
 */
export const META_RECORD = {
  "none": null,
  "bare": null,
  "full": null,
  "track": null,
  "linvail": null,
  "linvail/standard/internal": null,
  "linvail/standard/external": null,
  "linvail/custom/internal": null,
  "linvail/custom/external": null,
  "symbolic/intensional/void": null,
  "symbolic/intensional/file": null,
  "symbolic/extensional/void": null,
  "symbolic/extensional/file": null,
  "provenancy/stack": null,
  "provenancy/intra": null,
  "provenancy/inter": null,
  "provenancy/store/external": null,
  "provenancy/store/internal": null,
};

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").Meta}
 */
export const isMeta = (name) => hasOwn(META_RECORD, name);
