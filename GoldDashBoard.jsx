

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import Header from "./header";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

function GoldDashboard() {
  const [data, setData] = useState(null);
  const [prices, setPrices] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const API_URL = "https://api.gold-api.com/price/XAU"; // your API endpoint

  const fetchGoldData = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch gold data");

      const result = await response.json();

      setData(result);

      const newPrice = result.price ?? 0;
      const newTime = new Date().toLocaleTimeString();

      setPrices((prev) => [...prev.slice(-29), newPrice]);
      setTimestamps((prev) => [...prev.slice(-29), newTime]);
      setLastUpdated(newTime);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData({});
    }
  };

  useEffect(() => {
    fetchGoldData();
    const interval = setInterval(fetchGoldData, 15000); // update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: timestamps,
    datasets: [
      {
        label: "Gold Price (USD/oz)",
        data: prices,
        borderColor: "#FFD700",
        backgroundColor: "rgba(255, 215, 0, 0.2)",
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: { display: true },
      y: { beginAtZero: false, ticks: { callback: (value) => `$${value}` } },
    },
    plugins: { legend: { display: true, position: "top" } },
  };

  const thStyle = { textAlign: "left", backgroundColor: "#E9CECD", padding: "10px", borderBottom: "1px solid #727070ff", width: "40%" };
  const tdStyle = { padding: "10px", borderBottom: "1px solid #E9CECD", width: "60%" };
  const tableStyle = { marginBottom: "60px" };

  const display = (value) => (value !== undefined && value !== null ? value : "-");

  return (
    <div style={{ width: "80%", margin: "auto", marginTop: "20px" }}>
     

      {/* Chart Section */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <h2> Real-Time Gold Price (USD)</h2>
        <Line data={chartData} options={chartOptions} />
        <p style={{ color: "gray", marginTop: "10px" }}>
          Last updated: {lastUpdated || "Loading..."}
        </p>
      </div>

      {/* Table Section */}
      <div style={{ marginTop: "40px" }}>
        <h2 style={{ textAlign: "center" }}> Gold Price Details</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px", border: "1px solid #c5c1c1ff;" }}>
          <tbody style={tableStyle}>
            <tr><th style={thStyle}>Metal</th><td style={tdStyle}>{display(data?.name)}</td></tr>
            <tr><th style={thStyle}>Symbol</th><td style={tdStyle}>{display(data?.symbol)}</td></tr>
            <tr><th style={thStyle}>Current Price</th><td style={tdStyle}>${display(data?.price)}</td></tr>
            <tr><th style={thStyle}>Last Updated</th><td style={tdStyle}>{display(data?.newTime)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GoldDashboard;
