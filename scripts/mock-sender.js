const SERVER_URL = process.env.SERVER_URL ?? "http://127.0.0.1:8080/api/data";
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 3000);

const sendMockReading = async () => {
  const ph = 6.5 + Math.random() * 2; // 6.5 - 8.5 range
  const turbidity = 1 + Math.random() * 8; // 1 - 9 NTU
  const payload = {
    ph: Number(ph.toFixed(2)),
    turbidity: Number(turbidity.toFixed(2)),
    ts: new Date().toISOString(),
  };

  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`POST failed: ${response.status} ${response.statusText} -> ${text}`);
    } else {
  console.log(`Sent mock pH ${payload.ph} | NTU ${payload.turbidity}`);
    }
  } catch (error) {
    console.error("Network error", error);
  }
};

console.log(`Starting mock sender -> ${SERVER_URL} every ${INTERVAL_MS}ms`);
sendMockReading();
setInterval(sendMockReading, INTERVAL_MS);
