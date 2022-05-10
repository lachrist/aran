import {assertEqual} from "../../__fixture__.mjs";

import {
  makeBlock,
  makeLiteralExpression,
  makeExpressionEffect,
} from "../../ast/index.mjs";

import {
  allignBlock,
  allignExpression,
  allignEffect,
} from "../../allign/index.mjs";

import {
  READ,
  DISCARD,
  TYPEOF,
  // makeEmptyDynamicFrame,
  makeLooseDynamicFrame,
  makeRigidDynamicFrame,
  makePreludeStatementArray,
  makeLooseDeclareStatementArray,
  makeRigidDeclareStatementArray,
  makeRigidInitializeStatementArray,
  makeLookupNode,
} from "./dynamic.mjs";

/////////////
// Prelude //
/////////////

// loose prelude //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makePreludeStatementArray(
        makeLooseDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
      ),
    ),
    "{}",
  ),
  null,
);

// rigid prelude //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makePreludeStatementArray(
        makeRigidDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
      ),
    ),
    `
      {
        effect(
          (
            intrinsic.aran.has(
              'frame',
              'variable',
            ) ?
            intrinsic.aran.throw(
              new intrinsic.SyntaxError(
                'Identifier \\'variable\\' has already been declared',
              ),
            ) :
            undefined
          ),
        );
      }
    `,
  ),
  null,
);

///////////
// Loose //
///////////

// empty declaration //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeLooseDeclareStatementArray(
        makeRigidDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
      ),
    ),
    "{}",
  ),
  null,
);

// loose declaration //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeLooseDeclareStatementArray(
        makeLooseDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
      ),
    ),
    `
      {
        effect(
          (
            intrinsic.aran.has(
              'frame',
              'variable'
            ) ?
            undefined :
            intrinsic.Reflect.defineProperty(
              'frame',
              'variable',
              intrinsic.aran.createObject(
                null,
                'configurable', false,
                'enumerable', true,
                'value', undefined,
                'writable', true,
              ),
            )
          ),
        );
      }
    `,
  ),
  null,
);

///////////
// Rigid //
///////////

// empty declaration //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeRigidDeclareStatementArray(
        makeLooseDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
      ),
    ),
    "{}",
  ),
  null,
);

// rigid declaration //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeRigidDeclareStatementArray(
        makeRigidDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
      ),
    ),
    `
      {
        effect(
          intrinsic.Reflect.defineProperty(
            'frame',
            'variable',
            intrinsic.aran.createObject(
              null,
              'configurable', false,
              'enumerable', true,
              'value', intrinsic.aran.deadzone,
              'writable', true,
            ),
          ),
        );
      }
    `,
  ),
  null,
);

// empty initialization //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeRigidInitializeStatementArray(
        makeLooseDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
        true,
        makeLiteralExpression("right"),
      ),
    ),
    "{}",
  ),
  null,
);

// rigid initialization //
assertEqual(
  allignBlock(
    makeBlock(
      [],
      [],
      makeRigidInitializeStatementArray(
        makeRigidDynamicFrame(null, makeLiteralExpression("frame")),
        "variable",
        false,
        makeLiteralExpression("right"),
      ),
    ),
    `
      {
        effect(
          intrinsic.Reflect.defineProperty(
            'frame',
            'variable',
            intrinsic.aran.createObject(
              null,
              'configurable', false,
              'enumerable', true,
              'value', 'right',
              'writable', false,
            ),
          ),
        );
      }
    `,
  ),
  null,
);

////////////
// Lookup //
////////////

// read unlookupable //
assertEqual(
  allignExpression(
    makeLookupNode(
      makeLooseDynamicFrame(null, makeLiteralExpression("frame")),
      false,
      "variable",
      READ,
      makeLiteralExpression("next"),
    ),
    "'next'",
  ),
  null,
);

// read loose //
assertEqual(
  allignExpression(
    makeLookupNode(
      makeLooseDynamicFrame(false, makeLiteralExpression("frame")),
      false,
      "variable",
      READ,
      makeLiteralExpression("next"),
    ),
    `
      (
        intrinsic.aran.has('frame', 'variable') ?
        intrinsic.aran.get('frame', 'variable') :
        'next'
      )
    `,
  ),
  null,
);

// read rigid //
assertEqual(
  allignExpression(
    makeLookupNode(
      makeRigidDynamicFrame(false, makeLiteralExpression("frame")),
      false,
      "variable",
      READ,
      makeLiteralExpression("next"),
    ),
    `
      (
        intrinsic.aran.has('frame', 'variable') ?
        (
          intrinsic.aran.binary(
            '===',
            intrinsic.aran.get('frame', 'variable'),
            intrinsic.aran.deadzone,
          ) ?
          intrinsic.aran.throw(
            new intrinsic.ReferenceError(
              'Cannot access \\'variable\\' before initialization',
            ),
          ) :
          intrinsic.aran.get('frame', 'variable')
        ) :
        'next'
      )
    `,
  ),
  null,
);

// read unscopable //
assertEqual(
  allignExpression(
    makeLookupNode(
      makeLooseDynamicFrame(true, makeLiteralExpression("frame")),
      false,
      "variable",
      READ,
      makeLiteralExpression("next"),
    ),
    `
      (
        (
          intrinsic.aran.get(
            'frame',
            intrinsic.Symbol.unscopables,
          ) ?
          (
            intrinsic.aran.get(
              intrinsic.aran.get(
                'frame',
                intrinsic.Symbol.unscopables,
              ),
              'variable',
            ) ?
            false :
            intrinsic.aran.has('frame', 'variable')
          ) :
          intrinsic.aran.has('frame', 'variable')
        ) ?
        intrinsic.aran.get('frame', 'variable') :
        'next'
      )
    `,
  ),
  null,
);

// typeof //
assertEqual(
  allignExpression(
    makeLookupNode(
      makeLooseDynamicFrame(false, makeLiteralExpression("frame")),
      false,
      "variable",
      TYPEOF,
      makeLiteralExpression("next"),
    ),
    `
      (
        intrinsic.aran.has('frame', 'variable') ?
        intrinsic.aran.unary(
          'typeof',
          intrinsic.aran.get('frame', 'variable'),
        ) :
        'next'
      )
    `,
  ),
  null,
);

// discard //
assertEqual(
  allignExpression(
    makeLookupNode(
      makeLooseDynamicFrame(false, makeLiteralExpression("frame")),
      false,
      "variable",
      DISCARD,
      makeLiteralExpression("next"),
    ),
    `
      (
        intrinsic.aran.has('frame', 'variable') ?
        intrinsic.aran.deleteSloppy('frame', 'variable') :
        'next'
      )
    `,
  ),
  null,
);

// write //
// delete //
assertEqual(
  allignEffect(
    makeLookupNode(
      makeLooseDynamicFrame(false, makeLiteralExpression("frame")),
      false,
      "variable",
      makeLiteralExpression("right"),
      makeExpressionEffect(makeLiteralExpression("next")),
    ),
    `
      (
        intrinsic.aran.has('frame', 'variable') ?
        effect(
          intrinsic.aran.setSloppy(
            'frame',
            'variable',
            'right',
          ),
        ) :
        effect('next')
      )
    `,
  ),
  null,
);
