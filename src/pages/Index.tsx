import { useEffect, useMemo, useState } from "react";

type SensorReading = {
  ph: number | null;
  turbidity: number | null;
  turbidityStatus: string | null;
  turbidityMessage: string | null;
  turbiditySafe: boolean | null;
  turbidityStandard: string | null;
  timestamp: string | null;
};

const WAITING_TEXT = "Waiting for data...";
const API_BASE_URL = (() => {
  const envOverride = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envOverride) {
    return envOverride.replace(/\/$/, "");
  }

  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  return "";
})();

type StatusInfo = {
  label: string;
  toneClass: string;
  badgeClass: string;
  suggestion: string;
  isSafe?: boolean;
};

const getPhStatus = (ph: number | null): StatusInfo => {
  if (ph === null) {
    return {
      label: WAITING_TEXT,
      toneClass: "text-slate-500",
      badgeClass: "bg-slate-500/20 text-slate-100",
      suggestion: "Awaiting first sensor reading.",
    };
  }

  if (ph < 6.5) {
    return {
      label: "Too Acidic",
      toneClass: "text-red-200",
      badgeClass: "bg-red-500/20 text-red-100",
      suggestion: "Add mild base (like baking soda) to neutralize.",
      isSafe: false,
    };
  }

  if (ph > 8.5) {
    return {
      label: "Too Alkaline",
      toneClass: "text-amber-200",
      badgeClass: "bg-amber-500/20 text-amber-100",
      suggestion: "Add mild acid (like vinegar or CO₂ infusion).",
      isSafe: false,
    };
  }

  return {
    label: "Safe",
    toneClass: "text-emerald-200",
    badgeClass: "bg-emerald-500/20 text-emerald-100",
    suggestion: "No purification needed — water is balanced.",
    isSafe: true,
  };
};

type TurbidityMeta = {
  status?: string | null;
  message?: string | null;
  safe?: boolean | null;
  standard?: string | null;
};

const getTurbidityStatus = (ntu: number | null, meta?: TurbidityMeta): StatusInfo => {
  const statusText = meta?.status && !["No data", "Unknown"].includes(meta.status)
    ? meta.status
    : null;
  const message = meta?.message ?? "Monitoring turbidity levels.";
  const standardDetail = meta?.standard ? ` (Standard: ${meta.standard})` : "";

  if (ntu === null) {
    return {
      label: WAITING_TEXT,
      toneClass: "text-slate-500",
      badgeClass: "bg-slate-500/20 text-slate-100",
      suggestion: "Awaiting turbidity reading.",
    };
  }

  const isSafe = meta?.safe ?? ntu <= 49;

  if (isSafe) {
    return {
      label: statusText ?? "Clear Water",
      toneClass: "text-emerald-200",
      badgeClass: "bg-emerald-500/20 text-emerald-100",
      suggestion: "No purification needed — water clarity is excellent.",
      isSafe: true,
    };
  }

  if (ntu > 150) {
    return {
      label: statusText ?? "Extremely Turbid",
      toneClass: "text-rose-200",
      badgeClass: "bg-rose-500/20 text-rose-100",
      suggestion: "Apply coagulation & flocculation, followed by membrane filtration for best results.",
      isSafe: false,
    };
  }

  if (ntu > 75) {
    return {
      label: statusText ?? "Very Cloudy",
      toneClass: "text-red-200",
      badgeClass: "bg-red-500/20 text-red-100",
      suggestion: "Use sedimentation + filtration or membrane filtration to reduce turbidity.",
      isSafe: false,
    };
  }

  if (ntu > 49) {
    return {
      label: statusText ?? "Cloudy",
      toneClass: "text-amber-200",
      badgeClass: "bg-amber-500/20 text-amber-100",
      suggestion: "Apply rapid sand filtration or multimedia filters to clarify water.",
      isSafe: false,
    };
  }

  return {
    label: statusText ?? "Moderate Turbidity",
    toneClass: "text-amber-200",
    badgeClass: "bg-amber-500/20 text-amber-100",
    suggestion: "Monitor closely. Consider filtration if levels rise above 50 NTU.",
    isSafe: false,
  };
};

const getOverallStatus = (phStatus: StatusInfo, turbidityStatus: StatusInfo) => {
  const waiting = phStatus.label === WAITING_TEXT || turbidityStatus.label === WAITING_TEXT;
  if (waiting) {
    return {
      label: WAITING_TEXT,
      badgeClass: "bg-slate-500/20 text-slate-100",
    };
  }

  const isPhSafe = phStatus.isSafe ?? phStatus.label === "Safe";
  const isTurbidityClear = turbidityStatus.isSafe ?? turbidityStatus.label === "Clear";

  if (isPhSafe && isTurbidityClear) {
    return {
      label: "Water Quality: Optimal",
      badgeClass: "bg-emerald-500/20 text-emerald-100",
    };
  }

  return {
    label: "Water Quality: Attention Needed",
    badgeClass: "bg-amber-500/20 text-amber-100",
  };
};

const Index = () => {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const purificationMethods = useMemo(
    () => [
      {
        method: "Sedimentation",
        description:
          "Allows suspended solids to settle by gravity before downstream treatment, reducing turbidity upfront.",
        equipment: "Settling tanks, clarifiers, detention basins",
        efficiency: "50–70",
      },
      {
        method: "Coagulation & Flocculation",
        description:
          "Coagulants neutralize particle charges while gentle mixing forms larger flocs that settle or filter easily.",
        equipment: "Flash mixers, flocculation basins, chemical feed systems",
        efficiency: "70–90",
      },
      {
        method: "Filtration",
        description:
          "Passes partially clarified water through granular media to capture remaining suspended solids.",
        equipment: "Rapid sand filters, multimedia filters, pressure filters",
        efficiency: "85–95",
      },
      {
        method: "Membrane Filtration",
        description:
          "Uses micro/ultrafiltration membranes to screen fine particles, colloids, and microorganisms.",
        equipment: "Hollow-fiber modules, spiral-wound membranes, crossflow systems",
        efficiency: "95–99",
      },
      {
        method: "Disinfection",
        description:
          "Inactivates remaining pathogens after turbidity reduction to ensure microbiological safety.",
        equipment: "Chlorination systems, UV reactors, ozone generators",
        efficiency: "90–99",
      },
    ],
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchLatest = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/water-quality`, {
          headers: {
            "Cache-Control": "no-store",
          },
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setError("Unable to load sensor data.");
          return;
        }

        const payload = (await response.json()) as {
          ph?: { ph?: number | string | null; ts?: unknown; timestamp?: string | null } | null;
          turbidity?: {
            turbidity?: number | string | null;
            status?: string | null;
            message?: string | null;
            standard?: string | null;
            safe?: boolean | null;
            ts?: unknown;
            timestamp?: string | null;
          } | null;
          timestamp?: string | null;
        };

        const rawPh = payload.ph?.ph;
        const phValue =
          rawPh !== undefined && rawPh !== null && !Number.isNaN(Number(rawPh))
            ? Number.parseFloat(String(rawPh))
            : null;
        const phTimestamp = payload.ph?.timestamp ?? null;

        const rawTurbidity = payload.turbidity?.turbidity;
        const turbidityValue =
          rawTurbidity !== undefined && rawTurbidity !== null && !Number.isNaN(Number(rawTurbidity))
            ? Number.parseFloat(String(rawTurbidity))
            : null;
        const turbidityTimestamp = payload.turbidity?.timestamp ?? null;

        if (phValue === null && turbidityValue === null) {
          setReading(null);
          setError(null);
          return;
        }

        setReading({
          ph: phTimestamp ? phValue : null,
          turbidity: turbidityTimestamp ? turbidityValue : null,
          turbidityStatus: turbidityTimestamp ? payload.turbidity?.status ?? null : null,
          turbidityMessage: turbidityTimestamp ? payload.turbidity?.message ?? null : null,
          turbiditySafe: turbidityTimestamp ? payload.turbidity?.safe ?? null : null,
          turbidityStandard: turbidityTimestamp ? payload.turbidity?.standard ?? null : null,
          timestamp: payload.timestamp ?? phTimestamp ?? turbidityTimestamp ?? null,
        });
        setError(null);
      } catch (err) {
        if (isMounted) {
          setError("Network error while fetching data.");
        }
      }
    };

    fetchLatest();
    const intervalId = window.setInterval(fetchLatest, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const phStatus = useMemo(() => getPhStatus(reading?.ph ?? null), [reading]);
  const turbidityStatus = useMemo(
    () =>
      getTurbidityStatus(reading?.turbidity ?? null, {
        status: reading?.turbidityStatus ?? null,
        message: reading?.turbidityMessage ?? null,
        safe: reading?.turbiditySafe ?? null,
        standard: reading?.turbidityStandard ?? null,
      }),
    [reading],
  );
  const overallStatus = useMemo(
    () => getOverallStatus(phStatus, turbidityStatus),
    [phStatus, turbidityStatus],
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-sky-100 via-sky-200 to-cyan-200 p-4">
      <div className="w-full max-w-5xl">
        <div className="rounded-3xl bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/40 shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] opacity-90">Water Quality Monitor</p>
                <h1 className="mt-2 text-3xl font-semibold">ClearFlow Station</h1>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${overallStatus.badgeClass}`}>
                {overallStatus.label}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-6 text-center">
                <p className="text-sm font-medium text-slate-600 uppercase tracking-widest">
                  Live pH Value
                </p>
                <p className={`mt-3 text-5xl font-semibold ${phStatus.toneClass}`}>
                  {typeof reading?.ph === "number" ? reading.ph.toFixed(2) : WAITING_TEXT}
                </p>
                <span className={`mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${phStatus.badgeClass}`}>
                  {phStatus.label}
                </span>
                <p className="mt-3 text-sm text-slate-600">{phStatus.suggestion}</p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-6 text-center">
                <p className="text-sm font-medium text-slate-600 uppercase tracking-widest">
                  Turbidity (NTU)
                </p>
                <p className={`mt-3 text-5xl font-semibold ${turbidityStatus.toneClass}`}>
                  {typeof reading?.turbidity === "number" ? reading.turbidity.toFixed(2) : WAITING_TEXT}
                </p>
                <span className={`mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${turbidityStatus.badgeClass}`}>
                  {turbidityStatus.label}
                </span>
                <p className="mt-3 text-sm text-slate-600">{turbidityStatus.suggestion}</p>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <p className="text-xs text-center text-slate-500">
              Updating automatically every 3 seconds. Powered by ESP32 • Node.js • Vite
            </p>
          </div>
        </div>
      </div>

      <section className="mt-12 w-full max-w-6xl">
        <div className="rounded-3xl bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg border border-white/60 p-8 md:p-12">
          <h2 className="text-center text-3xl md:text-4xl font-semibold text-sky-900">
            💧 Water Purification Methods for Turbidity Reduction
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {purificationMethods.map((item) => (
              <article
                key={item.method}
                className="rounded-2xl border border-sky-100 bg-sky-50/70 p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold text-sky-900">{item.method}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-sky-900">Typical Equipment:</span> {item.equipment}
                  </p>
                  <p>
                    <span className="font-semibold text-sky-900">Efficiency:</span> {item.efficiency}%
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-sky-100 bg-white shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead className="bg-sky-100/70 text-sky-900 uppercase text-sm tracking-wide">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Method</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Typical Equipment</th>
                    <th className="px-6 py-4 font-semibold">Efficiency (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {purificationMethods.map((item, idx) => (
                    <tr
                      key={item.method}
                      className={`text-sm text-slate-700 transition-colors duration-150 hover:bg-sky-100/60 ${
                        idx % 2 === 0 ? "bg-sky-50/50" : "bg-white"
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-sky-900">{item.method}</td>
                      <td className="px-6 py-4 leading-relaxed">{item.description}</td>
                      <td className="px-6 py-4">{item.equipment}</td>
                      <td className="px-6 py-4 font-semibold text-sky-900">{item.efficiency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            © 2025 Turbidity Monitoring Project – All Rights Reserved
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
