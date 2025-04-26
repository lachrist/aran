
import matplotlib.pyplot as plot
import sys
import os
import numpy
import json

# read data from file

__dirname__ = os.path.dirname(__file__)

def labelize (meta):
  if meta == "provenancy/stack":
    return "stack"
  if meta == "provenancy/intra":
    return "intra"
  if meta == "provenancy/inter":
    return "inter"
  if meta == "provenancy/store/external":
    return "store"
  if meta == "provenancy/store/internal":
    return "store*"
  raise Exception("Unknown meta: " + meta)

def loadMetaEnum ():
  with open(__dirname__ + "/meta.json", "r") as file:
    return json.load(file)

def loadData (base):
  with open(__dirname__ + "/trace/" + base + ".json", "r") as file:
    return json.load(file)

labels = list(map(labelize, loadMetaEnum()))

def plotBase (base):
  data = loadData(base)
  for index in range(len(data)):
    print(
      labels[index],
      "mean", round(numpy.mean(data[index])),
      "1", round(numpy.percentile(data[index], 1)),
      "5:", round(numpy.percentile(data[index], 5)),
      "10:", round(numpy.percentile(data[index], 10)),
      "25:", round(numpy.percentile(data[index], 25)),
      "50:", round(numpy.percentile(data[index], 50)),
      "75:", round(numpy.percentile(data[index], 75)),
      "90:", round(numpy.percentile(data[index], 90)),
      "95:", round(numpy.percentile(data[index], 95)),
      "99:", round(numpy.percentile(data[index], 99)),
    )
  plot.boxplot(
    data,
    tick_labels = labels,
    showfliers = False,
  )
  plot.savefig(__dirname__ + "/trace/" + base + ".pdf")
  plot.close()

if __name__ == "__main__":
  plotBase(sys.argv[1])
