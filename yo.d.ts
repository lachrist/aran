// type Foo =
//   | {
//       type: "tag1";
//       data: string;
//     }
//   | {
//       type: "tag2";
//       data: number;
//     }
//   | {
//       type: "tag3";
//       data: boolean;
//     };

// type Bar =
//   | {
//       type: "tag1";
//       DATA: string;
//     }
//   | {
//       type: "tag2";
//       DATA: number;
//     }
//   | {
//       type: "tag3";
//       DATA: boolean;
//     };

// type convertFooBar = <F extends Foo>(foo: F) => Bar & { type: F["type"] };
