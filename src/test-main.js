import { initJsPsych } from 'jspsych';
import 'jspsych/css/jspsych.css';
import htmlButtonResponse    from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse  from '@jspsych/plugin-html-keyboard-response';
import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import surveyHtmlForm        from '@jspsych/plugin-survey-html-form';

import { LEXTALE, LEXTALE_PRACTICE } from './stimuli.js';
import { shuffle, generateDigits, buildPracticeTrials, buildAllTrials } from './trials.js';
import { measureAmbientNoise } from './noise.js';

const BASE   = import.meta.env.BASE_URL;
const menuEl = document.getElementById('test-menu');
const runEl  = document.getElementById('test-run');
let activeJsPsych = null;

// ── Runner ────────────────────────────────────────────────────────────────

function backToMenu() {
  try { activeJsPsych?.endExperiment?.(); } catch (_) {}
  activeJsPsych = null;
  runEl.style.display  = 'none';
  menuEl.style.display = 'block';
}

function runSection(section) {
  menuEl.style.display = 'none';
  runEl.style.display  = 'block';
  runEl.innerHTML = '';

  const back = document.createElement('button');
  back.className   = 'back-btn';
  back.textContent = '← menu';
  back.onclick     = backToMenu;
  runEl.appendChild(back);

  const el = document.createElement('div');
  el.id = 'jspsych-display-element';
  runEl.appendChild(el);

  activeJsPsych = initJsPsych({
    display_element: 'jspsych-display-element',
    on_finish: backToMenu,
  });
  activeJsPsych.run(section.build(activeJsPsych));
}

// ── Section builders ──────────────────────────────────────────────────────

function buildConsent(_jsPsych) {
  return [{
    type: htmlButtonResponse,
    stimulus: `
      <h2>Speech Perception Study</h2>
      <div style="text-align:left;max-width:600px;margin:0 auto;line-height:1.8">
        <p>In this study you will listen to short spoken words and answer memory questions.
           The study takes about <strong>15–20 minutes</strong>.</p>
        <p><strong>Requirements:</strong> fluent English speaker, quiet environment,
           <strong>headphones strongly recommended</strong>.</p>
        <p>Your responses are anonymous. You may stop at any time by closing this page.</p>
        <p>By clicking below you confirm you have read this and agree to participate.</p>
      </div>`,
    choices: ['I consent — begin'],
  }];
}

function buildDemographics(_jsPsych) {
  return [{
    type: surveyHtmlForm,
    preamble: `<h3>About You</h3><p style="color:#7A6E5C;font-size:.95em;margin-bottom:8px">A few background questions before we begin.</p>`,
    html: `
      <table style="margin:0 auto;border-spacing:10px 16px;text-align:left">
        <tr><td>Age</td>
            <td><input name="age" type="number" min="18" max="80" required></td></tr>
        <tr><td>First language (L1)</td>
            <td><input name="l1" type="text" required placeholder="e.g. English, Mandarin" style="width:200px!important"></td></tr>
        <tr><td>Other languages</td>
            <td><input name="other_langs" type="text" placeholder="e.g. French, or 'none'" style="width:200px!important"></td></tr>
        <tr><td>Years studying English</td>
            <td><input name="eng_years" type="number" min="0" max="40" required></td></tr>
        <tr><td>Hearing impairments?</td>
            <td><select name="hearing">
                  <option value="no">No</option><option value="yes">Yes</option>
                </select></td></tr>
        <tr><td>Audio device</td>
            <td><select name="audio_device">
                  <option value="anc">Noise-cancelling headphones / buds (ANC)</option>
                  <option value="headphones">Regular headphones / earphones</option>
                  <option value="speakers">External speakers</option>
                  <option value="laptop">Laptop / built-in speakers</option>
                  <option value="phone">Phone speaker</option>
                </select></td></tr>
      </table>`,
    button_label: 'Continue',
  }];
}

function buildVolumeCheck(_jsPsych) {
  return [{
    type: htmlButtonResponse,
    stimulus: `
      <h3>Volume Check</h3>
      <p>Headphones or earphones are strongly recommended.</p>
      <p>Press Play and <strong>adjust your volume</strong> until the voice sounds
         <strong>clear and comfortable</strong> — not too quiet, not too loud.</p>
      <audio controls style="margin:24px auto">
        <source src="${BASE}stimuli/volume_check.wav" type="audio/wav">
      </audio>
      <p style="color:var(--muted);font-size:.9em">This is the same voice you will hear throughout the study.</p>`,
    choices: ['Voice is clear — continue'],
  }];
}

function buildNoiseCheck(jsPsych) {
  return [{
    type: htmlKeyboardResponse,
    stimulus: `
      <h3>Environment Check</h3>
      <p style="max-width:480px;margin:0 auto .8em">Measuring ambient noise via microphone.<br>
        <span style="color:var(--muted);font-size:.9em">No audio recorded — single number only.</span></p>
      <div id="noise-status" style="font-family:var(--mono);font-size:1.1em;color:var(--muted);margin:32px 0 8px;min-height:2em">
        Requesting microphone…
      </div>
      <div style="width:260px;height:3px;background:var(--surface2);margin:0 auto;border-radius:2px;overflow:hidden">
        <div id="noise-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent),var(--accent-hi));transition:width 3s linear"></div>
      </div>`,
    choices: 'NO_KEYS',
    trial_duration: 4500,
    on_load() {
      requestAnimationFrame(() => {
        const bar = document.getElementById('noise-bar');
        if (bar) bar.style.width = '100%';
      });
      measureAmbientNoise(3000)
        .then(({ dbfs }) => {
          const el = document.getElementById('noise-status');
          if (!el) return;
          const label = dbfs > -30 ? 'Noisy' : dbfs > -45 ? 'Moderate' : 'Quiet';
          el.innerHTML = `<span style="color:var(--accent)">${dbfs}&thinsp;dBFS</span>
                          <span style="color:var(--muted);font-size:.8em;margin-left:10px">${label}</span>`;
          jsPsych.data.addProperties({ ambient_noise_dbfs: dbfs });
        })
        .catch(err => {
          const el = document.getElementById('noise-status');
          if (el) el.innerHTML = `<span style="color:var(--muted);font-size:.9em">Mic unavailable (${err.name})</span>`;
        });
    },
  }];
}

function buildLexTALEPractice(jsPsych) {
  const tl = [];
  for (const item of LEXTALE_PRACTICE) {
    tl.push({
      type: htmlButtonResponse,
      stimulus: `<div class="lextale-word">${item.w}</div>`,
      choices: ['YES — real word', 'NO — not a word'],
      on_finish(data) { data.correct = (data.response === 0) === item.real; },
    });
    const correctLabel = item.real ? 'YES — real word' : 'NO — not a word';
    tl.push({
      type: htmlKeyboardResponse,
      stimulus() {
        const last = jsPsych.data.get().last(1).values()[0];
        return last.correct
          ? `<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`
          : `<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">✗ Answer: <strong>${correctLabel}</strong></p>`;
      },
      choices: 'NO_KEYS',
      trial_duration: 1400,
    });
  }
  return tl;
}

function buildLexTALE(_jsPsych) {
  return shuffle(LEXTALE).slice(0, 8).map(item => ({
    type: htmlButtonResponse,
    stimulus: `<div class="lextale-word">${item.w}</div>`,
    choices: ['YES — real word', 'NO — not a word'],
    on_finish(data) { data.correct = (data.response === 0) === item.real; },
  }));
}

function buildDigitSpan(_jsPsych) {
  const tl = [];
  const RECALL_HTML = `<input name="recall" type="text" inputmode="numeric"
    autocomplete="off" placeholder="e.g. 4 7 2">`;

  for (let len = 1; len <= 5; len++) {
    for (let trial = 0; trial < 2; trial++) {
      const digits = generateDigits(len);
      const target = digits.join('');

      for (let i = 0; i < digits.length; i++) {
        tl.push({
          type: audioKeyboardResponse,
          stimulus: `${BASE}stimuli/digit_${digits[i]}.wav`,
          choices: 'NO_KEYS',
          trial_ends_after_audio: true,
          prompt: `<p class="listen-indicator">digit ${i + 1} of ${digits.length}</p>`,
        });
      }
      tl.push({
        type: surveyHtmlForm,
        preamble: `<p style="font-size:1.05em;margin-bottom:18px">Type the digits you heard, <em>in order</em>:</p>`,
        html: RECALL_HTML,
        button_label: 'Submit',
        on_load() {
          const input = document.querySelector('input[name="recall"]');
          if (input) input.focus();
        },
        on_finish(data) {
          const raw = (data.response.recall || '').replace(/\s+/g, '');
          data.correct = raw === target;
        },
      });
    }
  }
  return tl;
}

function buildSyllablePractice(jsPsych) {
  const tl = [];
  const [trial] = buildPracticeTrials(1);
  const SEQ_LEN = 6;

  const { seq, probes, condition } = trial;
  for (let k = 0; k < seq.length; k++) {
    tl.push({
      type: audioKeyboardResponse,
      stimulus: seq[k].audio,
      choices: 'NO_KEYS',
      trial_ends_after_audio: true,
      prompt: `<p class="listen-indicator">syllable ${k + 1} of ${SEQ_LEN} — listen</p>`,
      data: { item_id: seq[k].id, condition },
    });
    if (k < seq.length - 1) {
      tl.push({ type: htmlKeyboardResponse, stimulus: `<p class="iti-cross">·</p>`,
                choices: 'NO_KEYS', trial_duration: 600 });
    }
  }
  for (const probe of probes) {
    const p = probe;
    tl.push({
      type: htmlButtonResponse,
      stimulus: `<p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
                 <div class="lextale-word">/${p.id}/</div>`,
      choices: ['Yes — I heard it', 'No — I did not hear it'],
      button_html: ['<button class="jspsych-btn choice-btn">%choice%</button>',
                    '<button class="jspsych-btn choice-btn">%choice%</button>'],
      on_finish(data) { data.correct = (data.response === 0) === p.in_list; },
    });
    const was_in_list = probe.in_list;
    tl.push({
      type: htmlKeyboardResponse,
      stimulus() {
        const last = jsPsych.data.get().last(1).values()[0];
        return last.correct
          ? `<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`
          : `<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">
               ✗ ${was_in_list ? 'That syllable WAS in the list.' : 'That syllable was NOT in the list.'}
             </p>`;
      },
      choices: 'NO_KEYS',
      trial_duration: 1200,
    });
  }
  return tl;
}

function buildMainTask(_jsPsych) {
  const tl = [];
  const trials = buildAllTrials().flat().slice(0, 4);
  const SEQ_LEN = 6;

  for (let i = 0; i < trials.length; i++) {
    const { seq, probes, condition } = trials[i];
    for (let k = 0; k < seq.length; k++) {
      tl.push({
        type: audioKeyboardResponse,
        stimulus: seq[k].audio,
        choices: 'NO_KEYS',
        trial_ends_after_audio: true,
        prompt: `<p class="listen-indicator">syllable ${k + 1} of ${SEQ_LEN}</p>`,
        data: { item_id: seq[k].id, condition },
      });
      if (k < seq.length - 1) {
        tl.push({ type: htmlKeyboardResponse, stimulus: `<p class="iti-cross">·</p>`,
                  choices: 'NO_KEYS', trial_duration: 600 });
      }
    }
    for (let q = 0; q < probes.length; q++) {
      const p = probes[q];
      tl.push({
        type: htmlButtonResponse,
        stimulus: `<p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
                   <div class="lextale-word">/${p.id}/</div>`,
        choices: ['Yes — I heard it', 'No — I did not hear it'],
        button_html: ['<button class="jspsych-btn choice-btn">%choice%</button>',
                      '<button class="jspsych-btn choice-btn">%choice%</button>'],
        data: { trial_n: i, probe_n: q, probe_id: p.id, in_list: p.in_list,
                condition: p.condition, onset_n: p.onset_n, coda_n: p.coda_n },
        on_finish(data) { data.correct = (data.response === 0) === p.in_list; },
      });
    }
    tl.push({ type: htmlKeyboardResponse, stimulus: `<p class="iti-cross">+</p>`,
              choices: 'NO_KEYS', trial_duration: 700 });
  }
  return tl;
}

function buildEndScreen(_jsPsych) {
  return [{
    type: htmlButtonResponse,
    stimulus: `<h3>Study Complete</h3>
               <p>Thank you for participating.</p>
               <p>Clicking below will download your results as a CSV file.<br>
                  Please send the file to the researcher.</p>`,
    choices: ['Download my results'],
  }];
}

// ── Registry ──────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'consent',           label: 'Consent',            desc: 'Information & consent screen',         build: buildConsent },
  { id: 'demographics',      label: 'Demographics',        desc: 'Background questions form',            build: buildDemographics },
  { id: 'volume',            label: 'Volume Check',        desc: 'Audio playback & volume calibration',  build: buildVolumeCheck },
  { id: 'noise',             label: 'Noise Check',         desc: 'Microphone ambient noise measurement', build: buildNoiseCheck },
  { id: 'lextale-practice',  label: 'LexTALE Practice',   desc: 'Practice items with feedback',         build: buildLexTALEPractice },
  { id: 'lextale',           label: 'LexTALE (8 items)',  desc: '8 random items from the scored list',  build: buildLexTALE },
  { id: 'digit-span',        label: 'Digit Span',          desc: 'Lengths 1–5, 2 trials each',           build: buildDigitSpan },
  { id: 'syllable-practice', label: 'Syllable Practice',   desc: '1 trial, 2 probes with feedback',      build: buildSyllablePractice, needsAudio: true },
  { id: 'main-task',         label: 'Main Task',           desc: '4 trials (2 CCVC + 2 CVCC)',           build: buildMainTask,         needsAudio: true },
  { id: 'end',               label: 'End Screen',          desc: 'Study complete screen',                build: buildEndScreen },
];

// ── Render menu ───────────────────────────────────────────────────────────

const grid = document.getElementById('section-grid');
for (const section of SECTIONS) {
  const card = document.createElement('div');
  card.className = 'section-card';
  card.innerHTML = `
    <div class="s-label">${section.label}</div>
    <div class="s-desc">${section.desc}</div>
    ${section.needsAudio ? '<div class="s-warn">⚠ needs generated audio</div>' : ''}
  `;
  card.onclick = () => runSection(section);
  grid.appendChild(card);
}
