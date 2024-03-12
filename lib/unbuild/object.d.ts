export type SuperObject = {
  type: "super";
};

export type RegularObject = {
  type: "regular";
  data: aran.Expression<unbuild.Atom>;
};

export type Object = SuperObject | RegularObject;
