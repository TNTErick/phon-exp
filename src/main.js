import { initJsPsych } from 'jspsych';
import 'jspsych/css/jspsych.css';

import { ITEMS } from './stimuli.js';
import { buildTimeline } from './timeline.js';

const WEB3FORMS_KEY = '187294d3-4dcb-4a54-96ff-006c01d6f8a6';

const participantId = Math.random().toString(36).slice(2, 8);

const jsPsych = initJsPsych({
  on_trial_finish() {
    const pct = jsPsych.getProgress().percent_complete;
    const fill = document.getElementById('exp-fill');
    if (fill) fill.style.width = pct + '%';
  },
  on_finish() {
    const csv = jsPsych.data.get().csv();

    const rows = jsPsych.data.get()
      .filter({ task: [
        'demographics',
        'lextale_practice', 'lextale',
        'digit_recall',
        'practice_listen', 'practice_response',
        'main_listen', 'main_response',
      ]})
      .ignore('stimulus')
      .csv();

    const demo = jsPsych.data.get().filter({ task: 'demographics' }).values()[0]?.response ?? {};
    const filename = `phon_exp_${participantId}.csv`;

    // Upload CSV to paste.rs via corsproxy.io (bypasses CORS), then notify via Web3Forms.
    fetch('https://corsproxy.io/?https://paste.rs', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rows,
    })
      .then(r => (r.status === 200 || r.status === 201) ? r.text() : Promise.reject(r.status))
      .then(u => u.trim())
      .catch(() => null)
      .then(csvUrl => {
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: `Phon Experiment — ${participantId} completed`,
            from_name: 'Phon Experiment',
            participant_id: participantId,
            age: demo.age ?? null,
            gender: demo.gender ?? null,
            l1: demo.l1 ?? null,
            other_langs: demo.other_langs ?? null,
            eng_years: demo.eng_years ?? null,
            hearing: demo.hearing ?? null,
            audio_device: demo.audio_device ?? null,
            noise_dbfs: jsPsych.data.get().values()[0]?.ambient_noise_dbfs ?? null,
            digit_span_first_error: jsPsych.data.get().values()[0]?.digit_span_first_error ?? null,
            digit_span_final: jsPsych.data.get().values()[0]?.digit_span_final ?? null,
            csv_url: csvUrl ?? '(upload failed)',
            message: csvUrl ? `CSV download: ${csvUrl}` : rows.slice(0, 8000),
          }),
        }).catch(() => {});
      });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
});

jsPsych.data.addProperties({ participant_id: participantId });

if (import.meta.env.DEV) window._jsPsych = jsPsych;

jsPsych.run(buildTimeline(jsPsych));
