export type Success<X> = {
  source: string;
  result: X;
};

export type Failure = string | Failure[];

export type Outcome<X> = Success<X> | Failure;

export type Parser<X> = (source: string) => Outcome<X>;
