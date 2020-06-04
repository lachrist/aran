pegjs --trace --allowed-start-rules _,Label,Identifier,String,Number,BigInt,StartBlock,StartStatement,StartExpression lib/test/parser/parser.pegjs &&
node lib/test/parser/parser.test.js &&
nyc --reporter=html --include lib/test/parser/parser.js node lib/test/parser/parser.test.js &&
pegjs --allowed-start-rules StartBlock,StartStatement,StartExpression lib/test/parser/parser.pegjs &&
echo "done"