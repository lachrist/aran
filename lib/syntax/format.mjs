/* eslint-disable local/no-static-dependency */

// @ts-ignore
import * as Escodegen from "escodegen";

const { generate } = Escodegen;

/** @type {(node: estree.Program) => string} */
export const formatEstree = (node) => generate(node);
