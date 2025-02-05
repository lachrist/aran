import numpy
import os
import matplotlib.pyplot as plot

def parseLine (line):
  return int(line.split(" >> ")[1])

def load ():
  file = open(
    os.path.abspath(
      os.path.join(
        __file__,
        "..",
        "data.txt",
      ),
    ),
  )
  try:
    return list(map(parseLine, filter(str.strip, file)))
  finally:
    file.close();

def plotBar(data, max):
  try:
    plot.hist(
      list(filter(lambda x: x <= max, data)),
      bins=numpy.arange(0, max + 1),
      edgecolor="black",
    );
    plot.xlabel("Branch Count");
    plot.title("Branch Count Histogram");
    plot.yscale("log")
    plot.grid(axis="y", linestyle="--")
    plot.savefig(
      os.path.abspath(
        os.path.join(
          __file__,
          "..",
          "histogram-" + str(max) + ".pdf",
        ),
      ),
    );
  finally:
    plot.close()

def plotBox(data):
  try:
    plot.boxplot(
      [data],
      tick_labels=["Branch Count"],
      showfliers=False,
    )
    plot.title("Branch Count Boxplot")
    plot.savefig(
      os.path.abspath(
        os.path.join(
          __file__,
          "..",
          "boxplot.pdf",
        ),
      ),
    )
  finally:
    plot.close()

def main ():
  data = load()
  plotBox(data)
  for threshold in [32, 64, 128, 512, 1024]:
    print(
      threshold,
      round(
        100 * len(list(filter(lambda item: item <= threshold, data))) / len(data),
        2,
      ),
    )
    plotBar(data, threshold)

if __name__ == "__main__":
  main()
