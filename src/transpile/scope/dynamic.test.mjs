import {assertSuccess} from "../../__fixture__.mjs";

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
assertSuccess(
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
);

// rigid prelude //
assertSuccess(
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
);

///////////
// Loose //
///////////

// empty declaration //
assertSuccess(
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
);

// loose declaration //
assertSuccess(
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
);

///////////
// Rigid //
///////////

// empty declaration //
assertSuccess(
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
);

// rigid declaration //
assertSuccess(
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
);

// empty initialization //
assertSuccess(
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
);

// rigid initialization //
assertSuccess(
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
);

////////////
// Lookup //
////////////

// read unlookupable //
assertSuccess(
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
);

// read loose //
assertSuccess(
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
);

// read rigid //
assertSuccess(
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
);

// read unscopable //
assertSuccess(
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
);

// typeof //
assertSuccess(
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
);

// discard //
assertSuccess(
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
);

// write //
assertSuccess(
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
);
