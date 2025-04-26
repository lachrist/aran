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
  )

def load (path):
  data = []
  with open(path, "r") as file:
    for line in file:
      line = line.strip()
      if line == "":
        continue
      num = int(line)
      if num is None:
        raise ValueError("Invalid number: " + line)
      data.append(num)
  return data

def filterOutliner (data):
  max = numpy.percentile(data, 97.5)
  return list(filter(lambda x: x <= max, data))

def listName (kind, include, tracking):
  if (include == "comp" and tracking == "store"):
    return [
      "store-comp-external-" + kind,
      "store-comp-internal-" + kind,
    ]
  else:
    return [tracking + "-" + include + "-" + kind]

def plotBox(include, kind):
  names = []
  for tracking in ["stack", "intra", "inter", "store"]:
    for name in listName(kind, include, tracking):
      names.append(name)
  data = []
  for name in names:
    data.append(load(locate(name + ".txt")))
  plot.boxplot(
    data,
    tick_labels = names,
    showfliers = False,
  )
  plot.title(include + "-" + kind)
  plot.savefig(locate(include + "-" + kind + ".pdf"))
  plot.close()

def plotHist(name):
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
      plotBox(include, kind)
  for include in ["main", "comp"]:
    for kind in ["aggr", "flat"]:
      for tracking in ["stack", "intra", "inter", "store"]:
        if tracking == "store" and include == "comp":
          plotHist(tracking + "-" + include + "-internal-" + kind)
          plotHist(tracking + "-" + include + "-external-" + kind)
        else:
          plotHist(tracking + "-" + include + "-" + kind)

if __name__ == "__main__":
  main()
