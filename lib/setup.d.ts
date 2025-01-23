type ConfigParam = { JavaScriptIdentifier: string };

/**
 * Configuration object for `setup`.
 */
export type Config<param extends ConfigParam = ConfigParam> = {
  /**
   * The global variable that refer to the global object. Only change this if
   * `globalThis` do not refer to the global object for some reason. Must be a
   * valid JavaScript identifier.
   * @defaultValue `"globalThis"`
   */
  global_object_variable: param["JavaScriptIdentifier"];
  /**
   * The global variable for holding the intrinsic record. Can be any arbritrary
   * string.
   * @defaultValue `"_ARAN_INTRINSIC_"`
   */
  intrinsic_global_variable: param["JavaScriptIdentifier"];
};
