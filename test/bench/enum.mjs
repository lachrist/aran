const {
  Object: { hasOwn },
  Reflect: { ownKeys },
} = globalThis;

/**
 * @type {{
 *   [key in import("./enum.d.ts").OctaneBase]: null
 * }}
 */
export const octane_base_record = {
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

export const octane_base_enum =
  /** @type {import("./enum.d.ts").OctaneBase[]} */ (
    ownKeys(octane_base_record)
  );

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").OctaneBase}
 */
export const isOctaneBase = (name) => hasOwn(octane_base_record, name);

/**
 * @type {{
 *   [key in import("./enum.d.ts").AutoBase]: null
 * }}
 */
export const auto_base_record = {
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

export const auto_base_enum = /** @type {import("./enum.d.ts").AutoBase[]} */ (
  ownKeys(auto_base_record)
);

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").AutoBase}
 */
export const isAutoBase = (name) => hasOwn(auto_base_record, name);

/**
 * @type {{
 *   [key in import("./enum.d.ts").OtherBase]: null
 * }}
 */
export const other_base_record = {
  yo: null,
  sandbox: null,
};

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").OtherBase}
 */
export const isOtherBase = (name) => hasOwn(other_base_record, name);

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
 *   [key in import("./enum.d.ts").SymbolicMeta]: null
 * }}
 */
export const symbolic_meta_record = {
  "symbolic/intensional/void": null,
  "symbolic/intensional/file": null,
  "symbolic/extensional/void": null,
  "symbolic/extensional/file": null,
};

/**
 * @type {{
 *   [key in import("./enum.d.ts").ProvenancyMeta]: null
 * }}
 */
export const provenancy_meta_record = {
  "provenancy/stack": null,
  "provenancy/intra": null,
  "provenancy/inter": null,
  "provenancy/store/external": null,
  "provenancy/store/internal": null,
};

export const provenancy_meta_enum =
  /** @type {import("./enum.d.ts").ProvenancyMeta[]} */ (
    ownKeys(provenancy_meta_record)
  );

/**
 * @type {{
 *   [key in import("./enum.d.ts").LinvailMeta]: null
 * }}
 */
export const linvail_meta_record = {
  "linvail/standard/internal": null,
  "linvail/standard/external": null,
  "linvail/custom/internal": null,
  "linvail/custom/external": null,
};

/**
 * @type {{
 *   [key in import("./enum.d.ts").Meta]: null
 * }}
 */
export const meta_record = {
  none: null,
  bare: null,
  full: null,
  track: null,
  ...linvail_meta_record,
  ...symbolic_meta_record,
  ...provenancy_meta_record,
};

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").ProvenancyMeta}
 */
export const isProvenancyMeta = (name) => hasOwn(provenancy_meta_record, name);

/**
 * @type {(
 *   name: string,
 * ) => name is import("./enum.d.ts").Meta}
 */
export const isMeta = (name) => hasOwn(meta_record, name);
