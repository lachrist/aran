/**
 * @type {{
 *   [key in import("./warning.d.ts").RawWarning["name"]]: string
 * }}
 */
const WARNING_MESSAGE = {
  ExternalConstant: "External constant might be modified",
  ExternalDeadzone: "External deadzone might not be honored",
  ExternalSloppyFunction: "External sloppy function might clash",
  ExternalLateDeclaration: "External late declaration has been internalized",
};

/**
 * @type {(
 *   warning: import("./warning.d.ts").RawWarning
 * ) => string}
 */
const formatWarning = ({ name, hash }) =>
  `[${name}] ${WARNING_MESSAGE[name]} at ${hash}`;

/**
 * @type {(
 *   warning: import("./warning.d.ts").RawWarning,
 * ) => import("./warning.d.ts").Warning}
 */
export const cookWarning = (warning) => ({
  ...warning,
  message: formatWarning(warning),
});
