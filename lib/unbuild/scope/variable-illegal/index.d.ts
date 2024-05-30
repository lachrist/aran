import { Variable } from "../../../estree";

export type IllegalFrame = {
  type: "illegal";
  record: { [k in Variable]?: string };
};
