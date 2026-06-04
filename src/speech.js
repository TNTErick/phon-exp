/**
 * Speech recognition helper for digit span recall.
 * Returns a controller object, or null if browser unsupported.
 */

const WORD_TO_DIGIT = {
  zero:'0', one:'1', two:'2', three:'3', four:'4',
  five:'5', six:'6', seven:'7', eight:'8', nine:'9',
};

function wordsToDigits(transcript) {
  return transcript
    .toLowerCase()
    .split(/[\s,]+/)
    .map(w => WORD_TO_DIGIT[w] ?? w.replace(/\D/g, ''))
    .join('');
}

export function createRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

export function setupRecallUI(onResult) {
  const rec = createRecognition();
  const btn    = document.getElementById('sr-btn');
  const status = document.getElementById('sr-status');
  const input  = document.getElementById('sr-input');

  if (!rec) {
    if (btn) { btn.disabled = true; btn.textContent = 'Mic unavailable'; }
    return;
  }

  btn?.addEventListener('click', () => {
    status.textContent = 'Listening…';
    btn.disabled = true;
    try { rec.start(); } catch (_) { /* already running */ }
  });

  rec.onresult = e => {
    const raw = e.results[0][0].transcript;
    const digits = wordsToDigits(raw);
    if (input) input.value = digits;
    if (status) status.textContent = digits || raw;
    if (btn) { btn.disabled = false; btn.textContent = '🎤 Speak again'; }
    onResult?.(digits);
  };

  rec.onerror = () => {
    if (status) status.textContent = 'Not recognised — type instead';
    if (btn) { btn.disabled = false; btn.textContent = '🎤 Try again'; }
  };

  rec.onend = () => {
    if (btn) btn.disabled = false;
  };
}
