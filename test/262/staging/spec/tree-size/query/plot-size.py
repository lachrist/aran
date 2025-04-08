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
    file.close()

def filterOutliner (data):
  max = numpy.percentile(data, 97.5)
  return list(filter(lambda x: x <= max, data))

def plotBox(title, names):
  for name in names:
    try:
      plot.boxplot(
        list(
          map(
            lambda name: load(locate(name + ".txt")),
            names,
          ),
        ),
        tick_labels = names,
        showfliers = False,
      )
      plot.title(title)
      plot.savefig(locate(title + ".pdf"))
    finally:
      plot.close()

def plotBar(name):
  try:
    data = filterOutliner(load(locate(name + ".txt")))
    plot.hist(
      data,
      bins = min(100, max(data))
    )
    plot.grid(axis = "y", linestyle = "--")
    plot.savefig(locate(name + ".pdf"))
  finally:
    plot.close()

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
  for include in ["main", "comp"]:
    for kind in ["aggr", "flat"]:
      for tracking in ["stack", "intra", "inter", "store"]:
        plotBar(tracking + "-" + include + "-" + kind)

if __name__ == "__main__":
  main()
