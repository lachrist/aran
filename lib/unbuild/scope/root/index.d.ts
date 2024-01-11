import { RootContext } from "../../../context";

export type RootFrame = {
  type: "root";
  evaluated: boolean;
  context: RootContext;
};
