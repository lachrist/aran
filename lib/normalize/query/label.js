
exports._extract_labels = (labels, statement) => {
  while (true) {
    if (statement.type === "LabeledStatement") {
      labels[labels.length] = statement.label.name;
      statement = statement.body;
    } else if (statement.type === "BlockStatement") {
      if (statement.body.length !== 1) {
        return statement.body;
      }
      statement = statement.body[0];
    } else {
      return [statement];
    }
  }
};
