pegjs --trace --allowed-start-rules _,Label,Identifier,Declarable,String,Number,BigInt,StartBlock,StartStatement,StartExpression parser.pegjs &&
node parser.test.js &&
nyc --reporter=html --include parser.js node parser.test.js &&
pegjs --allowed-start-rules StartBlock,StartStatement,StartExpression parser.pegjs &&
echo "done"
