
import {reduce} from "array-lite";

import {multiply} from "../../util.mjs";

export { devides as contains } from "../../util.mjs";

export const BASE_KIND = 2;

export const META_KIND = 3;

export const LOOSE_KIND = 5;

export const RIGID_KIND = 7;

export const combine = partial_xx(reduce, multiply, 1);
