export type Repartition = { [key in string]: number };

export type Report = {
  count: number;
  exclusion: {
    count: number;
    repartition: Repartition;
  };
  true_positive: {
    count: number;
  };
  false_positive: {
    count: number;
  };
  true_negative: {
    count: number;
    repartition: Repartition;
  };
  false_negative: {
    count: number;
    repartition: Repartition;
  };
};
