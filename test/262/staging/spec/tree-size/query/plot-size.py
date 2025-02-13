import numpy
import os
import matplotlib.pyplot as plot

def locate (name):
  return os.path.abspath(
    os.path.join(
      __file__,
      "..",
      "..",
      "output",
      name,
    ),
  );

def load (path):
  file = open(path)
  try:
    return list(map(int, filter(str.strip, file)))
  finally:
    file.close();

def filterOutliner (data):
  max = numpy.percentile(data, 97.5)
  return list(filter(lambda x: x <= max, data))

def plotBar(name):
  try:
    data = filterOutliner(load(locate(name + ".txt")))
    plot.hist(
      data,
      bins = min(100, max(data))
    );
    plot.grid(axis="y", linestyle="--")
    plot.savefig(locate(name + ".pdf"));
  finally:
    plot.close()

names = [
  "inter-main-aggr",
  "inter-main-flat",
  "intra-main-aggr",
  "intra-main-flat",
  "ratio-main-aggr",
  "ratio-main-flat",
]

def main ():
  for name in names:
    plotBar(name)

if __name__ == "__main__":
  main()
