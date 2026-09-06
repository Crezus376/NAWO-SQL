const target = process.env["LOAD_URL"] ?? "http://127.0.0.1:8000/api/health";
const total = Number(process.env["LOAD_REQUESTS"] ?? 200);
const concurrency = Number(process.env["LOAD_CONCURRENCY"] ?? 20);
const maximumP95 = Number(process.env["LOAD_MAX_P95_MS"] ?? 1000);
const durations = [];
let failures = 0;
let cursor = 0;

async function worker() {
  while (cursor < total) {
    cursor += 1;
    const started = performance.now();
    try {
      const response = await fetch(target, { headers: { Accept: "application/json" } });
      if (!response.ok) failures += 1;
      await response.arrayBuffer();
    } catch {
      failures += 1;
    } finally {
      durations.push(performance.now() - started);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
durations.sort((a, b) => a - b);
const percentile = (value) =>
  durations[Math.min(Math.ceil(durations.length * value) - 1, durations.length - 1)] ?? 0;
const result = {
  target,
  requests: total,
  concurrency,
  failures,
  p50_ms: Math.round(percentile(0.5)),
  p95_ms: Math.round(percentile(0.95)),
  p99_ms: Math.round(percentile(0.99)),
};
console.log(JSON.stringify(result, null, 2));
if (failures > 0 || result.p95_ms > maximumP95) process.exitCode = 1;
