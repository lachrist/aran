export type BoxPlot = {
  output: string;
  title: string;
  content: { [k in string]: number[] };
  show_flier: boolean;
};
