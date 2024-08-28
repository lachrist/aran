/**
 * @type {{
 *   [key in import("./warning").WarningName]: string
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
 *   warning: import("./warning").Warning
 * ) => string}
 */
export const formatWarning = ({ name, path }) =>
  `[${name}] ${WARNING_MESSAGE[name]} at ${path}`;
