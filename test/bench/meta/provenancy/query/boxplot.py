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
  plot.boxplot(
    data["data"],
    load(name),
    tick_labels = data["labels"],
    showfliers = False,
  )
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
