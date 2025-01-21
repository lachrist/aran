/**
 * Configuration object for `setup`.
 */
export type Config<
  javascript_identifier extends string = string,
  global_property_key extends string = string,
> = {
  /**
   * The global variable that refer to the global object. Only change this if
   * `globalThis` do not refer to the global object for some reason. Must be a
   * valid JavaScript identifier.
   * @defaultValue `"globalThis"`
   */
  global_object_variable: javascript_identifier;
  /**
   * The global variable for holding the intrinsic record. Can be any arbritrary
   * string.
   * @defaultValue `"_ARAN_INTRINSIC_"`
   */
  intrinsic_global_variable: global_property_key;
};
