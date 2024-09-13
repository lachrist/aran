/**
 * @type {{
 *   precursor: import("../stage").StageName[],
 *   negative: import("../tag").Tag[],
 *   exclude: import("../tag").Tag[],
 * }}
 */
export default {
  precursor: ["identity", "parsing"],
  negative: [
    "async-iterator-async-value",
    "arguments-two-way-binding",
    "function-dynamic-property",
    "negative-bare-duplicate-super-prototype-access",
    "negative-bare-early-module-declaration",
    "negative-bare-missing-iterable-return-in-pattern",
    "negative-bare-wrong-realm-for-default-prototype",
  ],
  exclude: ["function-string-representation"],
};
