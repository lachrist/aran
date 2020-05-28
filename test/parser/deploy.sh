cd test/parser
pegjs --trace --allowed-start-rules _,Label,Identifier,String,Number,BigInt,StartBlock,StartStatement,StartExpression parser.pegjs
node parser.test.js
pegjs --allowed-start-rules StartBlock,StartStatement,StartExpression parser.pegjs
cd ../../