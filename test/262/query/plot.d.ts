import { Result } from "../result";
import { StageName } from "../stage";

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
