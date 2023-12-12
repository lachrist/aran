type Escape = Brand<string, "rebuild.Escape">;
type Intrinsic = Brand<string, "rebuild.Intrinsc">;

export type Context = {
  intrinsic: Intrinsic;
  escape: Escape;
};
