/**
 * Measure ambient noise level via Web Audio API.
 * Samples microphone RMS for `duration_ms` ms.
 * Returns { dbfs, rms } — never records or transmits audio.
 */
export async function measureAmbientNoise(duration_ms = 3000) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const buf = new Float32Array(analyser.frequencyBinCount);
  const samples = [];

  const handle = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    samples.push(Math.sqrt(sum / buf.length));
  }, 100);

  await new Promise(r => setTimeout(r, duration_ms));
  clearInterval(handle);
  stream.getTracks().forEach(t => t.stop());
  await ctx.close();

  const meanRms = samples.reduce((a, b) => a + b, 0) / samples.length;
  const dbfs = 20 * Math.log10(Math.max(meanRms, 1e-10));
  return { rms: meanRms, dbfs: Math.round(dbfs * 10) / 10 };
}
