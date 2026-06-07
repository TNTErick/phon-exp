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

    // Strip stimulus HTML (the only large field) and send all meaningful task rows.
    // Excludes instruction/transition screens which have no data value.
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

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Phon Experiment — ${participantId} completed`,
        from_name: 'Phon Experiment',
        participant_id: participantId,
        noise_dbfs: jsPsych.data.get().values()[0]?.ambient_noise_dbfs ?? null,
        digit_span_first_error: jsPsych.data.get().values()[0]?.digit_span_first_error ?? null,
        digit_span_final: jsPsych.data.get().values()[0]?.digit_span_final ?? null,
        data: rows,
      }),
    }).catch(() => {});

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phon_exp_${participantId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
});

jsPsych.data.addProperties({ participant_id: participantId });

jsPsych.run(buildTimeline(jsPsych));
