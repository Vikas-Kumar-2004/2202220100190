import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

const AUTH_DETAILS = {
  email: "ramkrishna@abc.edu",
  name: "ram krishna",
  rollNo: "aalbb",
  accessCode: "xgAsNO",
  clientID: "d9cbb699-6a27-44a5-8d59-8b1befa816da",
  clientSecret: "tVJaaaRBSeXcRXeM",
};

let token = null;

const getAccessToken = async () => {
  const response = await fetch(
    "http://20.244.56.144/evaluation-service/auth",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(AUTH_DETAILS),
    }
  );
  if (!response.ok) throw new Error("Failed to fetch auth token");
  const data = await response.json();
  return data.access_token;
};

const fetchStockList = async () => {
  if (!token) token = await getAccessToken();

  const response = await fetch(
    "http://20.244.56.144/evaluation-service/stocks",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch stock list");
  const data = await response.json();
  return data.stocks;
};

const fetchStockData = async (symbol, minutes = 50) => {
  if (!token) token = await getAccessToken();

  const url = `http://20.244.56.144/evaluation-service/stocks/${symbol}?minutes=${minutes}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch stock data");
  const data = await response.json();
  return Array.isArray(data) ? data : [data];
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600"></div>
    </div>
  );
}

function StockPage() {
  const [stockList, setStockList] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [minutes, setMinutes] = useState(50);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await fetchStockList();
        const entries = Object.entries(stocks);
        setStockList(entries);
        if (entries.length > 0) setSymbol(entries[0][1]);
      } catch (err) {
        setError("Could not load stock list. " + err.message);
      }
    };
    loadStocks();
  }, []);

  useEffect(() => {
    if (!symbol) return;

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const prices = await fetchStockData(symbol, minutes);
        const chartData = prices.map((entry) => ({
          date: new Date(entry.lastUpdatedAt).toLocaleTimeString(),
          close: entry.price,
        }));
        setData(chartData);
        setLastUpdated(
          prices.length > 0
            ? new Date(prices[prices.length - 1].lastUpdatedAt).toLocaleString()
            : null
        );
      } catch (err) {
        setError("Could not load stock data. " + err.message);
        setData([]);
        setLastUpdated(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [symbol, minutes]);

  const averagePrice =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.close, 0) / data.length
      : 0;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-6 flex items-center gap-3">
        
        Stock Prices Dashboard
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="font-bold text-red-700 hover:text-red-900"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <label
              htmlFor="symbol"
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              Select Stock
            </label>
            <select
              id="symbol"
              className="w-full border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              disabled={stockList.length === 0}
            >
              {stockList.map(([name, sym]) => (
                <option key={sym} value={sym}>
                  {name} ({sym})
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <label
              htmlFor="minutes"
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              Time Window
            </label>
            <select
              id="minutes"
              className="w-full border border-gray-300 rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {[5, 10, 15, 30, 50, 60, 120].map((m) => (
                <option key={m} value={m}>
                  Last {m} minutes
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {loading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <p className="text-gray-600 text-center py-10">
            No data available for this stock and time range.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data}>
                <XAxis
                  dataKey="date"
                  stroke="#3b82f6"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  stroke="#3b82f6"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toFixed(2)}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e3a8a",
                    borderRadius: 8,
                    border: "none",
                    color: "white",
                  }}
                  labelStyle={{ color: "#93c5fd" }}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2563eb" }}
                  animationDuration={800}
                />
                <ReferenceLine
                  y={averagePrice}
                  label={{
                    position: "right",
                    value: `Avg: ${averagePrice.toFixed(2)}`,
                    fill: "#ef4444",
                    fontWeight: "bold",
                  }}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
            {lastUpdated && (
              <p className="text-right text-gray-500 text-sm mt-2 italic">
                Last updated: {lastUpdated}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CorrelationHeatmap() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-6">
        Correlation Heatmap
      </h1>
      <div className="bg-white rounded-lg shadow-md p-6 text-gray-600 text-center">
        Coming soon: correlation heatmap implementation.
      </div>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     
        <Router>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-blue-600 text-white shadow-md py-4">
          <nav className="max-w-5xl mx-auto flex justify-start gap-8 px-4">
            <Link
              to="/"
              className="font-semibold hover:underline hover:text-blue-200"
            >
              Stock Prices
            </Link>
            <Link
              to="/heatmap"
              className="font-semibold hover:underline hover:text-blue-200"
            >
              Correlation Heatmap
            </Link>
          </nav>
        </header>
        <main className="py-8">
          <Routes>
            <Route path="/" element={<StockPage />} />
            <Route path="/heatmap" element={<CorrelationHeatmap />} />
          </Routes>
        </main>
        <footer className="text-center text-sm text-gray-400 py-6">
          © 2025 Stock Aggregator App. All rights reserved.
        </footer>
      </div>
    </Router>
    </>
  )
}

export default App
