import { assertEqual } from "../test.fixture.mjs";
import {
  primeAt,
  encodePrime,
  decodePrime,
  getFirstZeroPrimeIndex,
} from "./prime.mjs";

assertEqual(decodePrime(encodePrime([0n, 1n, 2n, 3n])), [0n, 1n, 2n, 3n]);

assertEqual(decodePrime(encodePrime([3n, 2n, 1n, 0n])), [3n, 2n, 1n]);

assertEqual(decodePrime(encodePrime([0n, 1n, 2n]) * primeAt(3) ** 3n), [
  0n,
  1n,
  2n,
  3n,
]);

assertEqual(getFirstZeroPrimeIndex(encodePrime([3n, 2n, 1n])), 3);
