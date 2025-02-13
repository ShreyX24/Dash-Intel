import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { ma } from "moving-averages";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { useTheme } from "../../../lib/themeContext";
import { useOutletContext } from "react-router-dom";

ChartJS.register(zoomPlugin);

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FrameTimeGraph = () => {
  const [chartData, setChartData] = useState(null);
  const { themeOptions } = useTheme();
  const { selectedFile, graphFilterType } = useOutletContext(); // Get the selected file from the Outlet context

  ChartJS.defaults.color = `${themeOptions.graphTextColor}`;
  ChartJS.defaults.borderColor = `${themeOptions.graphBorderColor}`;

  useEffect(() => {
    // Dynamically import the JSON file
    const loadJsonData = async () => {
      try {
        const chartAsJson = await import(`../../../gameFiles/${selectedFile}`);
        const msBetweenPresents =
          chartAsJson.Runs[0].CaptureData.MsBetweenPresents;
        const windowSize = 10; // 5-second moving average

        const msBtwnPrsntsDataset = {
          label: "Ms Between Presents",
          data: msBetweenPresents,
          borderColor: `${themeOptions.graphMainColor}`, // More transparent
          backgroundColor: "rgba(75, 192, 192, 0.1)", // Very light background
          borderWidth: 1, // Thinner line
          tension: 0.1,
          yAxisID: "y",
          pointRadius: 0,
          order: 2, // This will be drawn first (bottom layer)
        };

        const mvAvgDataset = {
          label: "5-Second Moving Average",
          data: ma(msBetweenPresents, windowSize),
          borderColor: `${themeOptions.graphMAvgColor}`, // Fully opaque
          backgroundColor: "rgba(255, 99, 132, 0.2)", // Light background
          borderWidth: 2, // Thicker line
          tension: 0.1,
          yAxisID: "y",
          pointRadius: 0,
          order: 1, // This will be drawn second (top layer)
        };

        if (graphFilterType) {
          // console.log(graphFilterType);

          if (graphFilterType.isRaw === true) {
            setChartData({
              labels: chartAsJson.Runs[0].CaptureData.TimeInSeconds,
              datasets: [msBtwnPrsntsDataset],
            });
          }
          if (graphFilterType.isAverage === true) {
            setChartData({
              labels: chartAsJson.Runs[0].CaptureData.TimeInSeconds,
              datasets: [mvAvgDataset],
            });
          }
          if (graphFilterType.isRawPlusAverage === true) {
            setChartData({
              labels: chartAsJson.Runs[0].CaptureData.TimeInSeconds,
              datasets: [msBtwnPrsntsDataset, mvAvgDataset],
            });
          }
        }
      } catch (error) {
        console.error("Error loading the JSON file:", error);
      }
    };

    if (selectedFile) {
      loadJsonData();
    }
  }, [
    selectedFile,
    themeOptions.graphMainColor,
    themeOptions.graphMAvgColor,
    graphFilterType,
  ]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        reverse: true, //make the legend order match the drawing order
      },
      title: {
        display: true,
        // text: "Ms Between Presents vs Time in Seconds",
      },
      datalabels: {
        display: false,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "xy",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "xy",
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "Time in Seconds",
        },
      },
      y: {
        title: {
          display: true,
          text: "Ms Between Presents",
        },
      },
    },
  };

  if (!chartData) return <div>Loading...</div>;

  return <Line data={chartData} options={options} />;
};

export default FrameTimeGraph;
