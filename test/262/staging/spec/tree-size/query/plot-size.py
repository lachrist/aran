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

def plotBox(title, names):
  for name in names:
    try:
      plot.boxplot(
        list(
          map(
            lambda name: filterOutliner(load(locate(name + ".txt"))),
            names,
          ),
        ),
        tick_labels=names,
        showfliers=False,
      )
      plot.title(title)
      plot.savefig(locate(title + ".pdf"));
    finally:
      plot.close()

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
  for include in ["main", "comp"]:
    for kind in ["aggr", "flat"]:
      plotBox(
        include + "-" + kind,
        list(
          map(
            lambda tracking: tracking + "-" + include + "-" + kind,
            ["stack", "intra", "inter", "store"],
          ),
        ),
      )
  # plotBox("aggr-main", [
  #   "stack-main-aggr",
  #   "intra-main-aggr",
  #   "inter-main-aggr",
  #   "store-main-aggr",
  # ]);
  # plotBox("flat-main", [
  #   "stack-main-aggr",
  #   "intra-main-aggr",
  #   "inter-main-aggr",
  #   "store-main-aggr",
  # ]);
  # plotBox("aggre-main-ratio", [
  #   "stack-main-aggr-ratio",
  #   "intra-main-aggr-ratio",
  #   "inter-main-aggr-ratio",
  #   # "store-main-aggr-ratio",
  # ]);
  # plotBox("flat-main-ratio", [
  #   "stack-main-flat-ratio",
  #   "intra-main-flat-ratio",
  #   "inter-main-flat-ratio",
  #   # "store-main-flat-ratio",
  # ]);
  # for name in names:
  #   plotBar(name)

if __name__ == "__main__":
  main()
