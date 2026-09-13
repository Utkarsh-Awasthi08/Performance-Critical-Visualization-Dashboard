// Worker thread for high-frequency data generation and aggregation

export type WorkerMessage = 
  | { type: 'START' }
  | { type: 'STOP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SET_LOAD'; load: number }
  | { type: 'SET_ZOOM'; zoomMs: number };

export type DataPayload = {
  type: 'DATA_TICK';
  points: Float64Array;
  aggregates: {
    oneMinAvg: number;
    fiveMinAvg: number;
    oneHourAvg: number;
  };
};

let intervalId: ReturnType<typeof setInterval> | null = null;
let isPaused = false;
let currentLoadSize = 10000;
let currentZoomMs = 15000; // Default 15s
const TICK_INTERVAL_MS = 100;

// Dynamically adjust points per tick so the buffer always exactly fills the zoom window
const updateTickRate = () => {
  POINTS_PER_TICK = Math.floor((currentLoadSize / (currentZoomMs / 1000)) / (1000 / TICK_INTERVAL_MS));
  if (POINTS_PER_TICK < 1) POINTS_PER_TICK = 1;
};

let POINTS_PER_TICK = 66;
updateTickRate();

let currentTime = Date.now();

// 3600 buckets representing 1 second each for 1 hour of history
interface Bucket { sum: number; count: number; timestampSec: number; }
const buckets = new Array<Bucket>(3600);

// Initialize all buckets to 0
for (let i = 0; i < 3600; i++) buckets[i] = { sum: 0, count: 0, timestampSec: 0 };

let historySeeded = false;

function generateData() {
  if (isPaused) return;

  const now = Date.now();
  const currentSec = Math.floor(now / 1000);

  // Pre-seed 1 hour of historical data on the first tick so aggregates diverge instantly
  if (!historySeeded) {
    for (let i = 1; i <= 3600; i++) {
      const historicalSec = currentSec - i;
      const bucketIdx = historicalSec >= 0 ? historicalSec % 3600 : (3600 + (historicalSec % 3600)) % 3600;
      
      // Calculate a rough approximation of our mathematical formula to seed the history
      // The true mean is ~67.5. We add slight variations.
      const simulatedMean = 67.5 + Math.sin(historicalSec / 10) * 5;
      buckets[bucketIdx] = { sum: simulatedMean * 1000, count: 1000, timestampSec: historicalSec };
    }
    historySeeded = true;
  }

  const buffer = new Float64Array(POINTS_PER_TICK * 2);
  const timeStep = (now - currentTime) / POINTS_PER_TICK;
  const bucketIdx = currentSec % 3600;
  
  // If we crossed into a new second, reset the bucket
  if (buckets[bucketIdx].timestampSec !== currentSec) {
    buckets[bucketIdx] = { sum: 0, count: 0, timestampSec: currentSec };
  }
  
  for (let i = 0; i < POINTS_PER_TICK; i++) {
    const t = currentTime + i * timeStep;
    const val = Math.sin(t / 800) * 40 + Math.cos(t / 200) * 10 + Math.random() * 15 + 60; 
    
    buffer[i * 2] = t;       // X (timestamp)
    buffer[i * 2 + 1] = val; // Y (value)
    
    buckets[bucketIdx].sum += val;
    buckets[bucketIdx].count++;
  }
  
  currentTime = now;

  // Calculate sliding windows
  let min1Sum = 0, min1Count = 0;
  let min5Sum = 0, min5Count = 0;
  let hr1Sum = 0, hr1Count = 0;

  for (let i = 0; i < 3600; i++) {
    const b = buckets[i];
    if (b.count === 0) continue;
    
    const ageSec = currentSec - b.timestampSec;
    // Discard outdated buckets that haven't been overwritten yet
    if (ageSec < 0 || ageSec >= 3600) continue;

    hr1Sum += b.sum; hr1Count += b.count;
    if (ageSec < 300) {
      min5Sum += b.sum; min5Count += b.count;
      if (ageSec < 60) {
        min1Sum += b.sum; min1Count += b.count;
      }
    }
  }

  const message: DataPayload = {
    type: 'DATA_TICK',
    points: buffer,
    aggregates: {
      oneMinAvg: min1Count > 0 ? min1Sum / min1Count : 0,
      fiveMinAvg: min5Count > 0 ? min5Sum / min5Count : 0,
      oneHourAvg: hr1Count > 0 ? hr1Sum / hr1Count : 0,
    }
  };

  self.postMessage(message, { transfer: [buffer.buffer] });
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === 'START') {
    if (!intervalId) {
      currentTime = Date.now();
      intervalId = setInterval(generateData, TICK_INTERVAL_MS);
    }
  } else if (e.data.type === 'STOP') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  } else if (e.data.type === 'PAUSE') {
    isPaused = true;
  } else if (e.data.type === 'RESUME') {
    isPaused = false;
    currentTime = Date.now(); // Prevents a massive jump in data when resuming
  } else if (e.data.type === 'SET_LOAD') {
    currentLoadSize = e.data.load;
    updateTickRate();
  } else if (e.data.type === 'SET_ZOOM') {
    currentZoomMs = e.data.zoomMs;
    updateTickRate();
  }
};
