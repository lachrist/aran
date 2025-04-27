
import os
import json
import matplotlib.pyplot as plot

__dirname__ = os.path.dirname(__file__)

def load ():
  with open(__dirname__ + "/batch-auto-time.json", "r") as file:
    return json.load(file)

def plotLine (data):
  for line in data["lines"]:
    plot.plot(
      line["xs"],
      line["ys"],
      label = line["label"],
    )
  plot.xticks(
    ticks = range(1, len(data["labels"]) + 1),
    labels = data["labels"],
    fontsize=6,
  )
  plot.legend()
  plot.savefig(__dirname__ + "/batch-auto-time.pdf")

if __name__ == "__main__":
  plotLine(load())
