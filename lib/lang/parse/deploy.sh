pegjs --trace --allowed-start-rules _,Label,Identifier,String,Number,BigInt,StartProgram,StartPrelude,StartBlock,StartStatement,StartExpression parser.pegjs &&
node parser.test.js &&
nyc --reporter=html --include parser.js node parser.test.js &&
pegjs --allowed-start-rules StartProgram,StartPrelude,StartBlock,StartStatement,StartExpression parser.pegjs &&
echo "done"
