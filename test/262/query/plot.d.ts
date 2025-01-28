import { Result } from "../result";
import { StageName } from "../staging/stage-name";

export type Plot = {
  output: string;
  title: string;
  labels: string[];
  data: number[][];
};

export type StageResult = {
  name: StageName;
  results: Result[];
};
