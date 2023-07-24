import { stringifyPrettier } from "../../../lib/lang/prettier.mjs";

// console.log(
//   stringifyPrettier(
//     {
//       "type": "Program",
//       "body": [
//         {
//           "type": "ExportNamedDeclaration",
//           "declaration": null,
//           "specifiers": [
//             {
//               "type": "ExportSpecifier",
//               "local": {
//                 "type": "Identifier",
//                 "name": "specifier1"
//               },
//               "exported": {
//                 "type": "Identifier",
//                 "start": 0,
//                 "end": 0,
//                 "name": "specifier2"
//               }
//             }
//           ],
//           "source": {
//             "type": "Literal",
//             "value": "source",
//             "raw": "'source'"
//           }
//         }
//       ],
//       "sourceType": "module"
//     },
//   ),
// );

stringifyPrettier({
  type: "Program",
  sourceType: "script",
  body: [
    {
      type: "BreakStatement",
      label: {
        type: "Identifier",
        name: "foo",
      },
    },
  ],
});
