import React, { Component } from "react";
import "./App.css";
import FileUpload from "./FileUpload";
import * as d3 from "d3";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      selected: {
        x: 300,
        y: 300,
        model: "",
        index: 0,
      },
    };
  }
  componentDidMount() {
    this.renderChart();
  }
  componentDidUpdate() {
    this.renderChart();
  }
  set_data = (csv_data) => {
    this.setState({ data: csv_data });
  };
  renderChart() {
    const data = this.state.data;
    if (!data.length) {
      return;
    }
    const width = 400;
    const height = 400;
    const maxSum = d3.sum([
      d3.max(data, (d) => d["GPT-4"]),
      d3.max(data, (d) => d["Gemini"]),
      d3.max(data, (d) => d["PaLM-2"]),
      d3.max(data, (d) => d["PaLM-2"]),
      d3.max(data, (d) => d["LLaMA-3.1"]),
    ]);
    var xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.Date))
      .range([50, width]);
    var yScale = d3.scaleLinear().domain([0, maxSum]).range([height, 0]);
    const keys = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
    var colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"];

    var stack = d3.stack().keys(keys).offset(d3.stackOffsetWiggle);
    var stackedSeries = stack(data);

    // area
    var areaGenerator = d3
      .area()
      .x((d) => xScale(d.data.Date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveCardinal);
    d3.select(".container")
      .selectAll("path")
      .data(stackedSeries)
      .join("path")
      .style("fill", (d, i) => colors[i])
      .attr("d", (d) => areaGenerator(d))
      .attr("model", (d) => d.key)
      .attr("index", (d) => d.index)
      .on("mousemove", (e, d) => {
        this.setState({
          selected: {
            x: e.x,
            y: e.y,
            model: d.key,
            index: d.index,
          },
        });
      })
      .on("mouseout", () => {
        this.setState({
          selected: {
            model: "",
          },
        });
      });

    // x axis
    var xAxisGenerator = d3
      .axisBottom(xScale)
      .tickFormat((d) =>
        d.toLocaleString("default", { month: "long" }).substring(0, 3)
      );
    d3.select(".x-axis")
      .selectAll("g")
      .data([null])
      .join("g")
      .attr("transform", "translate(0,455)")
      .call(xAxisGenerator);

    // legend
    var bandScale = d3.scaleBand().domain(keys).range([200, 20]).padding(0.1); // Space between bands
    d3.select(".legend").attr("transform", "translate(0, 160)");
    d3.select(".legend")
      .selectAll("rect")
      .data(keys)
      .join("rect")
      .attr("x", width + 64)
      .attr("y", (d) => bandScale(d))
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", (d, i) => colors[i]);
    d3.select(".legend")
      .selectAll("text")
      .data(keys)
      .join("text")
      .attr("x", width + 96)
      .attr("y", (d) => bandScale(d) + 20)
      .attr("text-anchor", "start")
      .text((d) => d);

    // bar chart
    if (!this.state.selected.model) {
      d3.select(".tooltip").attr("visibility", "hidden");
      return;
    }
    d3.select(".tooltip")
      .attr(
        "transform",
        `translate(${this.state.selected.x - 100}, ${
          this.state.selected.y - 110
        })`
      )
      .attr("visibility", "visible");
    d3.select(".background")
      .selectAll("rect")
      .data([null])
      .join("rect")
      .attr("width", 240)
      .attr("height", 120)
      .attr("fill", "lightgrey");
    const left = 32;
    const top = 20;
    const barChartWidth = 200;
    const barChartHeight = 100;
    const yMax = d3.max(data, (d) => d[this.state.selected.model]);
    const barXScale = d3
      .scaleBand()
      .domain(data.map((d) => d.Date))
      .range([left, left + barChartWidth])
      .padding(0.1);
    const barYScale = d3
      .scaleLinear()
      .domain([0, yMax])
      .range([barChartHeight, top]);
    const barXAxisGenerator = d3
      .axisBottom(barXScale)
      .tickFormat((d) =>
        d.toLocaleString("default", { month: "long" }).substring(0, 3)
      );
    const barYAxisGenerator = d3.axisLeft(barYScale);

    d3.select(".bar-chart-x-axis")
      .attr("transform", `translate(0, ${barChartHeight})`)
      .call(barXAxisGenerator);
    d3.select(".bar-chart-y-axis")
      .attr("transform", `translate(${left}, 0)`)
      .call(barYAxisGenerator);
    d3.select(".bars")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => barXScale(d.Date))
      .attr("y", (d) => barYScale(d[this.state.selected.model]))
      .attr("width", barXScale.bandwidth())
      .attr(
        "height",
        (d) => barYScale(yMax - d[this.state.selected.model]) - 20
      )
      .attr("fill", colors[this.state.selected.index]);
  }
  render() {
    return (
      <div>
        <FileUpload set_data={this.set_data}></FileUpload>
        <svg style={{ width: 600, height: 600 }}>
          <g className="container"></g>
          <g className="x-axis"></g>
          <g className="legend"></g>
          <g className="tooltip">
            <g className="background"></g>
            <g className="bar-chart-x-axis"></g>
            <g className="bar-chart-y-axis"></g>
            <g className="bars"></g>
          </g>
        </svg>
      </div>
    );
  }
}

export default App;
