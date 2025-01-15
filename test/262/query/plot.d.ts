import { ResultEntry } from "../result";
import { StageName } from "../stagging/stage-name";

export type Plot = {
  output: string;
  title: string;
  labels: string[];
  data: number[][];
};

export type StageResult = {
  name: StageName;
  results: ResultEntry[];
};
