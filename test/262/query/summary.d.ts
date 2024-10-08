export type Repartition = { [key in string]: number };

export type Summary = {
  count: number;
  exclusion: {
    count: number;
    repartition: Repartition;
  };
  inclusion: {
    count: number;
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
};
