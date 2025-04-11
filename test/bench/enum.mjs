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
 *   [key in import("./enum.d.ts").ModuleBase]: null
 * }}
 */
export const MODULE_BASE_RECORD = {
  yo: null,
  sandbox: null,
  aran: null,
};

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").ModuleBase}
 */
export const isModuleBase = (name) => hasOwn(MODULE_BASE_RECORD, name);

/**
 * @type {{
 *   [key in import("./enum.d.ts").Meta]: null
 * }}
 */
export const META_RECORD = {
  none: null,
  bare: null,
  full: null,
  track: null,
};

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").Meta}
 */
export const isMeta = (name) => hasOwn(META_RECORD, name);
