// O[K] extends unknown ?
//   ? V
//   : 123;

// /**
//  * Make all properties in T required
//  */
// type Required<T> = {
//   [P in keyof T]-?: T[P];
// };

// type fo = Partial;

export type Foo<param extends { foo?: number | string }> = {
  foo: param["foo"] & (number | string | null);
};

// type Foo1 = {
//   foo: number;
// };
type Foo1 = Foo<{ foo: number }>;

// type Foo2 = {
//   foo: string | number;
// };
type Foo2 = Foo<{}>;
