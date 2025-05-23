
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import React, { useState } from "react";
import "./App.css";

const API_MAP = {
  p: "http://20.244.56.144/evaluation-service/primes",
  f: "http://20.244.56.144/evaluation-service/fibo",
  e: "http://20.244.56.144/evaluation-service/even",
  r: "http://20.244.56.144/evaluation-service/rand",
};

const WINDOW_SIZE = 10;


function App() {
    const [window, setWindow] = useState([]);
  const [prevWindow, setPrevWindow] = useState([]);
  const [responseNumbers, setResponseNumbers] = useState([]);
  const [avg, setAvg] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNumbers = async (type) => {
    const url = API_MAP[type];
    if (!url) {
      setError("Invalid type.");
      return;
    }

    setLoading(true);
    setError("");
    setPrevWindow([...window]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      const newNumbers = data.numbers || [];
      setResponseNumbers(newNumbers);

      const merged = [...window, ...newNumbers];
      const unique = [...new Set(merged)].slice(-WINDOW_SIZE);

      setWindow(unique);

      if (unique.length === WINDOW_SIZE) {
        const average =
          unique.reduce((sum, num) => sum + num, 0) / WINDOW_SIZE;
        setAvg(Number(average.toFixed(2)));
      } else {
        setAvg(null);
      }
    } catch (err) {
      setError("Request failed or took too long (500ms+).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
       <div className="App">
      <h1>Average Calculator</h1>
      <p>Click a button to fetch and calculate average of last {WINDOW_SIZE} numbers.</p>

      <div className="buttons">
        <button onClick={() => fetchNumbers("p")}>Prime (p)</button>
        <button onClick={() => fetchNumbers("f")}>Fibonacci (f)</button>
        <button onClick={() => fetchNumbers("e")}>Even (e)</button>
        <button onClick={() => fetchNumbers("r")}>Random (r)</button>
      </div>

      {loading && <p className="loading">Fetching data...</p>}
      {error && <p className="error">{error}</p>}

      <div className="data-section">
        <div>
          <h3>Window Previous State:</h3>
          <p>{JSON.stringify(prevWindow)}</p>
        </div>

        <div>
          <h3>Window Current State:</h3>
          <p>{JSON.stringify(window)}</p>
        </div>

        <div>
          <h3>Numbers Received:</h3>
          <p>{JSON.stringify(responseNumbers)}</p>
        </div>

        <div>
          <h3>Average:</h3>
          <p>{avg !== null ? avg : "Not enough data yet."}</p>
        </div>
      </div>
    </div>
      
    </>
  )
}

export default App
