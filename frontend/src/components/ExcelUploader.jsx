import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import Plot from "react-plotly.js";
import axios from "axios";
import {
  HiCloudUpload,
  HiChartBar,
  HiMoon,
  HiSun,
  HiDocumentText,
  HiAdjustments,
  HiExclamationCircle,
  HiCheckCircle,
  HiLightningBolt,
  HiCursorClick,
  HiTrash,
  HiCalculator
} from "react-icons/hi";
import ExportExcel from "./ExportExcel";

// --- Configuration ---
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const THEME_KEY = "dca-theme";

// --- Helper Components ---
const StatCard = ({ label, value, unit, icon: Icon, colorClass }) => (
  <div
    className="
      p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950
      border border-slate-800 shadow-lg hover:shadow-xl transition-all
      w-full relative overflow-hidden
    "
  >
    <div
      className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorClass}`}
    />

    <div className="relative z-10 flex flex-col h-full justify-center gap-3 text-center">
      <div className="flex justify-center items-center gap-2">
        {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-[150px] flex items-center justify-center gap-4 bg-red-500 rounded-4xl mx-2">
          <span className="text-3xl font-black tracking-tight text-white">
            {value}
          </span>
          <span className="text-sm font-bold text-white mb-1">
            {unit}
          </span>
        </div>
      </div>

    </div>
  </div>
);


function ExcelUploader() {

  const [plotData, setPlotData] = useState({ x: [], y: [] });
  const [displayDates, setDisplayDates] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [declineCurve, setDeclineCurve] = useState({});
  const [cutoff_q, setCutoff_q] = useState(5);
  const [declineType, setDeclineType] = useState("exponential");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(THEME_KEY) === "dark";
  });


  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    }
  }, [darkMode]);


  const currentStep = useMemo(() => {
    if (plotData.x.length === 0) return 1;
    if (selectedPoints.length < 2) return 2;
    if (declineCurve.Np_total) return 3;
    return 2;
  }, [plotData.x.length, selectedPoints.length, declineCurve.Np_total]);

  // --- Handlers ---
  const handleFileUpload = useCallback((e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const dates = [];
        const flowRates = [];

        jsonData.forEach((row) => {
          let parsedDate = null;
          // Robust date parsing
          if (typeof row.Date === "number") {
            const jsDate = XLSX.SSF.parse_date_code(row.Date);
            parsedDate = new Date(jsDate.y, jsDate.m - 1, jsDate.d);
          } else if (row.Date) {
            const tryDate = new Date(row.Date);
            if (!isNaN(tryDate.getTime())) parsedDate = tryDate;
          }

          if (parsedDate && row.FlowRate !== undefined) {
            dates.push(parsedDate.toLocaleDateString("en-CA"));
            flowRates.push(Number(row.FlowRate));
          }
        });

        if (dates.length === 0) throw new Error("No valid data found. columns: 'Date', 'FlowRate'");

        setDisplayDates(dates);
        setPlotData({ x: dates, y: flowRates });
        setSelectedPoints([]);
        setDeclineCurve({});
      } catch (err) {
        setError(err.message || "Failed to parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  }, []);

  const handleCalculate = async () => {
    if (selectedPoints.length < 2) return;
    setLoading(true);
    setError("");

    try {
      const payload = {
        t1: selectedPoints[0].t,
        q1: selectedPoints[0].q,
        t2: selectedPoints[1].t,
        q2: selectedPoints[1].q,
        original_q: plotData.y,
        decline_type: declineType,
        start_date: displayDates[0],
        qf: Number(cutoff_q),
      };

      const { data } = await axios.post(`${API_BASE}/calculate`, payload);
      setDeclineCurve(data);
    } catch (err) {
      setError("Calculation failed. Please check your parameters or server status.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const chartLayout = useMemo(() => ({
    autosize: true,
    height: 500,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { l: 60, r: 20, t: 40, b: 50 }, 
    font: {
      color: darkMode ? "#94a3b8" : "#475569",
      family: "Inter, sans-serif"
    },
    xaxis: {
      showgrid: false,
      zeroline: false,
      title: "Date"
    },
    yaxis: {
      gridcolor: darkMode ? "#1e293b" : "#f1f5f9",
      title: "Flow Rate (STB/d)"
    },
    legend: {
      orientation: "h",
      y: 1.1,
      x: 0.5,
      xanchor: "center",
      font: {
        size: 14,               
        color: darkMode ? "#e5e7eb" : "#1f2933",
        family: "Inter, sans-serif",
      },
      itemwidth: 40,             
      itemsizing: "constant",
    },

    hovermode: "closest",
     revision: plotData.x.length,
  }), [darkMode]);

  const chartData = useMemo(() => {
    const traces = [
      {
        x: plotData.x,
        y: plotData.y,
        type: "scatter",
        mode: "markers",
        marker: { color: darkMode ? "#3b82f6" : "#2563eb", size: 5, opacity: 0.6 },
        name: "Historical Data",
        showlegend: true,
      }
    ];

    if (declineCurve.curve) {
      traces.push({
        x: declineCurve.curve.map(p => p.Date),
        y: declineCurve.curve.map(p => p.q),
        type: "scatter",
        mode: "lines",
        line: { color: "#ef4444", width: 3, dash: "dash" },
        name: "Forecast",
      });
    }

    if (selectedPoints.length > 0) {
      traces.push({
        x: selectedPoints.map(p => displayDates[p.t]),
        y: selectedPoints.map(p => p.q),
        type: "scatter",
        mode: "markers",
        marker: { color: "#10b981", size: 10, line: { width: 2, color: "white" } },
        name: "Selected Points",
        hoverinfo: "skip"
      });
    }

    return traces;
  }, [plotData, declineCurve, darkMode, selectedPoints, displayDates]);


  return (
    <div className={`w-full min-h-screen flex flex-col items-center font-sans transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-blue-300 text-black"
      }`}>
      <header className={`w-full sticky top-0 z-50 backdrop-blur-md border-b mb-3 py-2 flex justify-center transition-colors ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
        }`}>
        <div className="w-full max-w-7xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <HiChartBar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">DCA Pro</h1>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Analytics Platform</p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
          >
            {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl px-4 sm:px-6 py-10 space-y-8 flex-grow">

        <div className="flex justify-center py-5 w-full mt-3 mb-3">
          <div className="flex items-center w-full max-w-xl relative">
            <div className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full ${darkMode ? "bg-slate-800" : "bg-slate-200"
              }`} />
            <div
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full transition-all duration-700 bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {["Upload Data", "Select Points", "View Results"].map((label, idx) => {
              const num = idx + 1;
              const isCompleted = currentStep > num;
              const isActive = currentStep === num;

              return (
                <div key={num} className="flex-1 flex flex-col items-center gap-3 relative z-10 group">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 border-4
                    ${isActive || isCompleted
                      ? "bg-blue-600 text-white border-blue-600 scale-110 shadow-lg shadow-blue-500/30"
                      : darkMode ? "bg-slate-900 text-slate-500 border-slate-800" : "bg-white text-slate-400 border-slate-100"
                    }
                  `}>
                    {isCompleted ? <HiCheckCircle className="w-6 h-6" /> : num}
                  </div>
                  <span className={`
                    text-[10px] font-black uppercase tracking-wider transition-colors duration-300
                    ${isActive ? "text-blue-600" : "opacity-40"}
                  `}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner - Centered */}
        {error && (
          <div className="w-full flex justify-center animate-in fade-in slide-in-from-top-2 p-3">
            <div className="w-full max-w-3xl p-5 rounded-xl bg-black border border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400">
              <HiExclamationCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Controls Card - Spanning Full Width */}
        <div className={`w-full p-1 rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-sm border ${darkMode ? "border-slate-800" : "border-slate-200"
          }`}>
          <div className="p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6">

            <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto justify-center">
              {/* Model Selector */}
              <div className="flex flex-row gap-8 relative group w-full sm:w-auto">
                <div>
                  <HiAdjustments className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <select
                  value={declineType}
                  onChange={(e) => setDeclineType(e.target.value)}
                  className={`w-full sm:w-auto pl-15 py-2.5 rounded-xl border-2 font-semibold text-sm outline-none transition-all cursor-pointer appearance-none ${darkMode
                    ? "bg-slate-900 border-slate-700 hover:border-slate-600 focus:border-blue-500 text-slate-200"
                    : "bg-white border-slate-200 hover:border-slate-300 focus:border-blue-500 text-slate-700"
                    }`}
                >
                  <option value="exponential">Exponential Model</option>
                  <option value="hyperbolic">Hyperbolic Model</option>
                  <option value="harmonic">Harmonic Model</option>
                </select>
              </div>

              {/* Upload Button */}
              <label className="w-full sm:w-auto cursor-pointer group relative overflow-hidden flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 px-3 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                <HiCloudUpload className="w-8 h-7 text-2xl group-hover:animate-bounce" />
                <span>Import Dataset</span>
              </label>
            </div>

            {/* Status Badge */}
            <div className={`px-4 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 ${plotData.x.length > 0
              ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
              : "text-slate-400 bg-slate-400/10 border-slate-400/20"
              }`}>
              <span className={`w-2 h-2 rounded-full ${plotData.x.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              {plotData.x.length > 0 ? `${plotData.x.length} Records Loaded` : "No Data Loaded"}
            </div>
          </div>
        </div>

        {/* Chart Area - Full Width */}
        <div
          className={`w-full relative rounded-3xl border shadow-xl overflow-hidden min-h-[500px] transition-colors ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
            }`}
        >
          {plotData.x.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none">
              <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <HiDocumentText className="w-12 h-12 text-slate-400" />
              </div>
              <p className="font-bold uppercase tracking-widest text-sm text-slate-500">
                Waiting for Excel Import...
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Supports .xlsx with 'Date' & 'FlowRate' columns
              </p>
            </div>
          ) : (
            <div className="p-6 w-full h-full flex flex-col gap-1">

              <div className="flex justify-center z-10">
                <div
                  className={`px-5 py-2 rounded-full backdrop-blur-md border shadow-sm flex items-center gap-4 transition-colors ${darkMode
                    ? "bg-slate-800/90 border-slate-700"
                    : "bg-white/90 border-slate-200"
                    }`}
                >
                  <div className="flex items-center">
                    <HiCursorClick
                      className={`w-4 h-4 ${selectedPoints.length > 0
                        ? "text-emerald-500"
                        : "text-blue-500"
                        }`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      Selection
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-sm font-bold">
                    <span
                      className={
                        selectedPoints.length > 0
                          ? "text-blue-500"
                          : "opacity-40"
                      }
                    >
                      {selectedPoints.length}
                    </span>
                    <span className="opacity-30">/</span>
                    <span className="opacity-40">2</span>
                  </div>

                  {selectedPoints.length > 0 && (
                    <button
                      onClick={() => setSelectedPoints([])}
                      className="ml-1 p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
                      title="Clear Selection"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Plot */}
              <div className="flex-1 animate-in fade-in duration-700 w-full h-full relative">
                <Plot
                  data={chartData}
                  layout={chartLayout}
                  useResizeHandler
                  className="w-full h-full"
                  style={{ width: "100%", height: "100%" }}
                  onClick={(data) => {
                    const p = data.points[0];
                    if (p.curveNumber !== 0) return;

                    const index = displayDates.indexOf(p.x);
                    setSelectedPoints((prev) => {
                      if (prev.some((pt) => pt.t === index)) return prev;
                      if (prev.length >= 2) return [{ t: index, q: p.y }];
                      return [...prev, { t: index, q: p.y }];
                    });
                  }}
                />
              </div>
            </div>
          )}
        </div>


        {selectedPoints.length === 2 && (
          <div className="w-full flex flex-col animate-in slide-in-from-bottom-6 duration-500 pb-12 mt-2 gap-3">

            <div className={`w-full mx-auto p-2 rounded-2xl border shadow-lg flex flex-col justify-center gap-2 h-[75px] ${darkMode ? "bg-green-800/50 border-slate-700" : "bg-blue-400 border-slate-200 shadow-sm"
              }`}>
              <div className="p-4 flex flex-col md:flex-row items-end gap-6 justify-center">

                <div className="flex-1 w-full md:max-w-xs">
                  <label className="text-[10px] font-bold uppercase text-black-400  tracking-widest block mb-2 ml-1">
                    Economic Limit ($q_f$)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={cutoff_q}
                      onChange={(e) => setCutoff_q(e.target.value)}
                      className={`w-full text-center pr-16 h-[32px] leading-[52px] rounded-xl border-2 font-bold text-lg outline-none focus:ring-4 transition-all ${darkMode
                        ? "bg-slate-900 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 text-white"
                        : "bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 text-slate-800"
                        }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">STB/d</span>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  style={{
                    backgroundColor: loading
                      ? '#94a3b8' // Slate-400 (Gray for loading)
                      : darkMode
                        ? '#2563eb' // Blue-600 (Dark Mode)
                        : '#16a34a' // Green-600 (Light Mode)
                  }}
                  className={`
                    /* --- Base Layout --- */
                    relative h-[54px] w-full md:w-auto px-12 mx-2 rounded-xl font-bold text-white 
                    transition-all duration-200 outline-none flex items-center justify-center gap-3 whitespace-nowrap
                    
                    /* --- Hover & Active States (Handled by CSS classes) --- */
                    ${!loading && (darkMode
                      ? "hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-900/40"
                      : "hover:bg-green-800 active:scale-95 shadow-lg shadow-green-500/30"
                    )}

                    /* --- Focus Ring --- */
                    focus:ring-4 ${darkMode ? "focus:ring-blue-500/50" : "focus:ring-green-500/30"}
                    
                    /* --- Loading Cursor --- */
                    ${loading ? "cursor-wait opacity-90 scale-[0.98]" : ""}
                  `}
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center items-center gap-1 pr-4">
                        <HiLightningBolt className="w-5 h-5" />
                        <span>Generate Forecast</span>
                      </div>
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* Stats Display - Grid Below */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {declineCurve.Np_observed && (
                <>
                  <StatCard
                    label="Historical Production"
                    value={declineCurve.Np_observed.toFixed(2)}
                    unit="MMbbl"
                    colorClass="text-blue-500"
                    icon={HiChartBar}
                  />
                  <StatCard
                    label="Forecasted Production"
                    value={declineCurve.Np_extrapolated.toFixed(2)}
                    unit="MMbbl"
                    colorClass="text-indigo-500"
                    icon={HiCalculator}
                  />

                  {/* Hero Card */}
                  <div className="md:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-150 transition-transform duration-700" />

                    <div className="relative z-10 flex flex-col h-full justify-center gap-4">

                      <div className="flex justify-center align-middle">
                        <div className="text-center">
                          <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-2">
                            Total EUR
                          </p>

                          <div className="flex justify-center">
                            <div className="flex items-center justify-center gap-2 bg-red-500 w-[150px] rounded-4xl">
                              <span className="text-4xl font-black tracking-tight">
                                {declineCurve.Np_total.toFixed(2)}
                              </span>
                              <span className="text-base font-bold opacity-80 mb-1">
                                MMbbl
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-white/20 flex justify-center">
                        <ExportExcel data={declineCurve.curve} fileName="DCA_Analysis_Report" />
                      </div>

                    </div>
                  </div>

                </>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default ExcelUploader;