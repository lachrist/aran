import json
import matplotlib.pyplot as plot
import os
import sys

__dirname__ = os.path.dirname(__file__)

def locate (name, ext):
  return os.path.dirname(__dirname__) + "/trace/" + name + "." + ext

def load (name):
  with open(locate(name, "json"), "r") as file:
    return json.load(file)

def plotBox (name):
  data = load(name)
  if (data["type"] == "box"):
    plot.boxplot(
      data["data"],
      load(name),
      tick_labels = data["labels"],
      showfliers = False,
    )
  elif (data["type"] == "hist"):
    plot.hist(
      data["data"],
      bins = data["bins"],
    )
  else:
    raise Exception("Unknown plot type: " + data["type"])
  if ("xlabel" in data):
    plot.xlabel(data["xlabel"])
  if ("ylabel" in data):
    plot.ylabel(data["ylabel"])
  if ("yscale" in data):
    plot.yscale(data["yscale"])
  if ("xscale" in data):
    plot.xscale(data["xscale"])
  if ("title" in data):
    plot.title(data["title"])
  
  plot.savefig(locate(name, "pdf"))
  plot.close()

if __name__ == "__main__":
  for arg in sys.argv[1:]:
    plotBox(arg)
