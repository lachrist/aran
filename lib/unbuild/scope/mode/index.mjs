/** @type {Record<import(".").ModeFrame["type"], null>} */
export const MODE = {
  "mode-use-strict": null,
};

/**
 * @type {(
 *   frame: import(".").ModeFrame,
 * ) => "strict"}
 */
export const getModeMode = (_frame) => "strict";
