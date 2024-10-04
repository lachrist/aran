/**
 * @type {{
 *   [key in import("./unbuild/prelude/warning").Warning["name"]]: string
 * }}
 */
export const WARNING_MESSAGE = {
  ExternalConstant: "External constant might be modified",
  ExternalDeadzone: "External deadzone might not be honored",
  ExternalSloppyFunction: "External sloppy function might clash",
  ExternalLateDeclaration: "External late declaration has been internalized",
};

/**
 * @type {(
 *   warning: import("./unbuild/prelude/warning").Warning
 * ) => string}
 */
export const formatWarning = ({ name, hash }) =>
  `[${name}] ${WARNING_MESSAGE[name]} at ${hash}`;
