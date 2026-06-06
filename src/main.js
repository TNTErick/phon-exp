import { initJsPsych } from 'jspsych';
import 'jspsych/css/jspsych.css';

import { ITEMS } from './stimuli.js';
import { buildTimeline } from './timeline.js';

// Paste your Google Apps Script web app URL here.
// Leave empty to skip remote submission (CSV download still happens).
const SUBMIT_URL = '';

const participantId = Math.random().toString(36).slice(2, 8);

const jsPsych = initJsPsych({
  on_trial_finish() {
    const pct = jsPsych.getProgress().percent_complete;
    const fill = document.getElementById('exp-fill');
    if (fill) fill.style.width = pct + '%';
  },
  on_finish() {
    const csv = jsPsych.data.get().csv();

    // Remote submission — fire and forget, CSV download is the backup.
    if (SUBMIT_URL) {
      fetch(SUBMIT_URL, {
        method: 'POST',
        mode: 'no-cors',          // avoids CORS preflight; response is opaque but data saves
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ participant_id: participantId, csv }),
      }).catch(() => {});         // swallow network errors; participant still gets the CSV
    }

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
