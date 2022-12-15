import { map, concat, filter } from "array-lite";
import { VALUED, UNVALUED, labelizeValuation } from "./valuation.mjs";
import {
  makeFreeCompletion,
  makeBoundedCompletion,
  isBoundedCompletion,
  generateCaptureCompletion,
  generateReleaseCompletion,
} from "./completion.mjs";

export const makeResult = (valuation, completions) => ({
  valuation,
  completions,
});

export const generateReleaseResult = (label) => {
  const releaseCompletion = generateReleaseCompletion(label);
  return ({ valuation, completions }) => ({
    valuation: valuation === label ? UNVALUED : valuation,
    completions: map(completions, releaseCompletion),
  });
};

export const prefaceResult = ({ valuation, completions }, node) =>
  valuation === VALUED
    ? completions
    : concat(
        [
          valuation === UNVALUED
            ? makeFreeCompletion(node)
            : makeBoundedCompletion(node, labelizeValuation(valuation)),
        ],
        completions,
      );

export const chainResult = ({ completions }, next_valuation) => {
  if (next_valuation === VALUED) {
    return filter(completions, isBoundedCompletion);
  }
  if (next_valuation === UNVALUED) {
    return completions;
  }
  return map(
    completions,
    generateCaptureCompletion(labelizeValuation(next_valuation)),
  );
};

export const getFirstResultValuation = (results, index) => {
  while (index < results.length) {
    const { valuation } = results[index];
    if (valuation !== UNVALUED) {
      return valuation;
    }
    index += 1;
  }
  return UNVALUED;
};
