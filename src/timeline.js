import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import surveyHtmlForm from '@jspsych/plugin-survey-html-form';
import preload from '@jspsych/plugin-preload';

import { ITEMS, CCVC_ITEMS, CVCC_ITEMS, LEXTALE } from './stimuli.js';
import { shuffle, buildInterleavedTrials, buildDigitSequences } from './trials.js';
import { measureAmbientNoise } from './noise.js';

const BASE = import.meta.env.BASE_URL;

export function buildTimeline(jsPsych) {
  const tl = [];

  // ── PRELOAD ────────────────────────────────────────────────────────────
  tl.push({
    type: preload,
    audio: [...ITEMS.map(x => x.audio), `${BASE}stimuli/calibration.wav`],
    show_progress_bar: true,
    message: `<p style="font-family:'EB Garamond',serif;color:#7A6E5C;font-size:15px;letter-spacing:.08em">Preparing audio…</p>`,
    error_message: `<p style="color:#C05858;font-family:'EB Garamond',serif">Audio failed to load. Check that the stimuli/ folder is present.</p>`,
  });

  // ── CONSENT ───────────────────────────────────────────────────────────
  tl.push({
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
      </div>
    `,
    choices: ['I consent — begin'],
    data: { task: 'consent' },
  });

  // ── DEMOGRAPHICS ──────────────────────────────────────────────────────
  tl.push({
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
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select></td></tr>
        <tr><td>Environment noise now</td>
            <td><select name="noise_self_report">
                  <option value="1">1 — Silent</option>
                  <option value="2">2 — Quiet</option>
                  <option value="3" selected>3 — Moderate</option>
                  <option value="4">4 — Noisy</option>
                  <option value="5">5 — Very noisy</option>
                </select></td></tr>
      </table>
    `,
    button_label: 'Continue',
    data: { task: 'demographics' },
  });

  // ── VOLUME CHECK ──────────────────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <h3>Volume Check</h3>
      <p>Put on headphones if you have them. Press Play below.</p>
      <audio controls>
        <source src="${BASE}stimuli/calibration.wav" type="audio/wav">
      </audio>
      <p>Adjust volume so the tone is <strong>clear and comfortable</strong>.<br>
         Clear audio is essential for this study.</p>
    `,
    choices: ['Audio is clear — continue'],
    data: { task: 'volume_check' },
  });

  // ── NOISE CHECK ───────────────────────────────────────────────────────
  // Measures ambient RMS via microphone for 3 s.
  // No audio is recorded — only the noise level number is stored.
  // Auto-advances after 4.5 s (0.5 s buffer after measurement).
  tl.push({
    type: htmlKeyboardResponse,
    stimulus: `
      <h3>Environment Check</h3>
      <p style="max-width:480px;margin:0 auto .8em">
        We will briefly measure your ambient noise level via microphone.<br>
        <span style="color:var(--muted);font-size:.9em">No audio is recorded — only a single number.</span>
      </p>
      <div id="noise-status" style="
        font-family:var(--mono);font-size:1.1em;letter-spacing:.08em;
        color:var(--muted);margin:32px 0 8px;min-height:2em">
        Requesting microphone…
      </div>
      <div id="noise-bar-wrap" style="
        width:260px;height:3px;background:var(--surface2);
        margin:0 auto;border-radius:2px;overflow:hidden">
        <div id="noise-bar" style="
          height:100%;width:0%;
          background:linear-gradient(90deg,var(--accent),var(--accent-hi));
          transition:width 3s linear"></div>
      </div>
    `,
    choices: 'NO_KEYS',
    trial_duration: 4500,
    data: { task: 'noise_check' },
    on_load() {
      // Kick off progress bar animation
      requestAnimationFrame(() => {
        const bar = document.getElementById('noise-bar');
        if (bar) bar.style.width = '100%';
      });

      measureAmbientNoise(3000)
        .then(({ rms, dbfs }) => {
          const el = document.getElementById('noise-status');
          if (el) {
            const label = dbfs > -30 ? 'Noisy' : dbfs > -45 ? 'Moderate' : 'Quiet';
            el.innerHTML =
              `<span style="color:var(--accent)">${dbfs}&thinsp;dBFS</span>` +
              `<span style="color:var(--muted);font-size:.8em;margin-left:12px">${label}</span>`;
          }
          jsPsych.data.addProperties({ ambient_noise_dbfs: dbfs, ambient_noise_rms: rms });
        })
        .catch(err => {
          const el = document.getElementById('noise-status');
          if (el) el.innerHTML =
            `<span style="color:var(--muted);font-size:.9em">Mic unavailable (${err.name})</span>`;
          jsPsych.data.addProperties({ ambient_noise_dbfs: null, ambient_noise_rms: null });
        });
    },
  });

  // ── PART 1: LexTALE ───────────────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <span class="part-chip">Part 1 of 3</span>
      <h3>Word Recognition</h3>
      <p>A string of letters will appear. Decide: <strong>is it a real English word?</strong></p>
      <p>Press <strong>YES</strong> or <strong>NO</strong> as quickly as you can. Go with your first instinct.</p>
      <p style="color:#7A6E5C;font-size:.9em">Some items are rare or technical — that is normal. &nbsp;≈ 3 minutes.</p>
    `,
    choices: ['Start'],
    data: { task: 'lextale_instructions' },
  });

  for (const item of shuffle(LEXTALE)) {
    tl.push({
      type: htmlButtonResponse,
      stimulus: `<div class="lextale-word">${item.w}</div>`,
      choices: ['YES — real word', 'NO — not a word'],
      data: { task: 'lextale', word: item.w, is_word: item.real },
      on_finish(data) {
        data.correct = (data.response === 0) === item.real;
      },
    });
  }

  // ── PART 2: DIGIT SPAN ────────────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <span class="part-chip">Part 2 of 3</span>
      <h3>Number Memory</h3>
      <p>Digits will appear on screen one at a time.</p>
      <p>After the last one disappears, <strong>type them all back in order</strong>.</p>
      <p>Sequences get longer as you go. Do your best. &nbsp;<span style="color:#7A6E5C;font-size:.9em">≈ 5 minutes.</span></p>
    `,
    choices: ['Start'],
    data: { task: 'digit_span_instructions' },
  });

  for (const { digits, len, trial } of buildDigitSequences()) {
    for (let i = 0; i < digits.length; i++) {
      tl.push({
        type: htmlKeyboardResponse,
        stimulus: `<div class="big-digit">${digits[i]}</div>`,
        choices: 'NO_KEYS',
        trial_duration: 1000,
        data: { task: 'digit_display', digit: digits[i], position: i, seq_len: len, trial_n: trial },
      });
      tl.push({
        type: htmlKeyboardResponse,
        stimulus: `<div class="big-digit" style="color:transparent">0</div>`,
        choices: 'NO_KEYS',
        trial_duration: 250,
      });
    }
    const target_str = digits.join('');
    tl.push({
      type: surveyHtmlForm,
      preamble: `<p style="font-size:1.05em;margin-bottom:18px">Type the numbers you saw, <em>in order</em>:</p>`,
      html: `<input name="recall" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 4 7 2">`,
      button_label: 'Submit',
      data: { task: 'digit_recall', target: target_str, seq_len: len, trial_n: trial },
      on_finish(data) {
        const raw = (data.response.recall || '').replace(/\s+/g, '');
        data.correct = raw === target_str;
        data.response_cleaned = raw;
      },
    });
  }

  // ── PART 3: MAIN TASK ─────────────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <span class="part-chip">Part 3 of 3</span>
      <h3>Word Memory</h3>
      <p>You will hear <strong>3 short nonsense words</strong>, one after another.</p>
      <p>Then choose which of two options you <strong>actually heard</strong>.</p>
      <p>Focus on the sounds at the <em>beginning</em> and <em>end</em> of each word.</p>
      <p style="color:#7A6E5C;font-size:.9em">A short practice with feedback comes first. &nbsp;≈ 10 minutes total.</p>
    `,
    choices: ['Start practice'],
    data: { task: 'main_instructions' },
  });

  // ── PRACTICE (3 trials, with feedback) ───────────────────────────────
  const practice_items = shuffle([CCVC_ITEMS[0], CVCC_ITEMS[0], CCVC_ITEMS[1]]);

  for (const probe of practice_items) {
    for (let k = 0; k < 3; k++) {
      tl.push({
        type: audioKeyboardResponse,
        stimulus: probe.audio,
        choices: 'NO_KEYS',
        trial_ends_after_audio: true,
        prompt: `<p class="listen-indicator">word ${k + 1} of 3 — listen carefully</p>`,
        data: { task: 'practice_listen', seq_pos: k, item_id: probe.id },
      });
      if (k < 2) {
        tl.push({
          type: htmlKeyboardResponse,
          stimulus: `<p class="iti-cross">·</p>`,
          choices: 'NO_KEYS',
          trial_duration: 900,
        });
      }
    }
    const choices_order = shuffle([probe.id, probe.foil]);
    tl.push({
      type: htmlButtonResponse,
      stimulus: `<p style="font-size:1.15em;margin-bottom:28px">Which word did you hear in the sequence?</p>`,
      choices: choices_order.map(c => `/${c}/`),
      button_html: choices_order.map(() => '<button class="jspsych-btn choice-btn">%choice%</button>'),
      data: { task: 'practice_response', target: probe.id, foil: probe.foil, condition: probe.condition },
      on_finish(data) {
        data.correct = choices_order[data.response] === probe.id;
      },
    });
    const correct_id = probe.id;
    tl.push({
      type: htmlKeyboardResponse,
      stimulus() {
        const last = jsPsych.data.get().last(1).values()[0];
        return last.correct
          ? `<p style="font-size:1.5em;font-family:'EB Garamond',serif;color:#5BA97A">✓ Correct!</p>`
          : `<p style="font-size:1.5em;font-family:'EB Garamond',serif;color:#C05858">✗ The answer was <span style="font-family:'JetBrains Mono',monospace">/${correct_id}/</span></p>`;
      },
      choices: 'NO_KEYS',
      trial_duration: 1600,
    });
  }

  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <p style="font-size:1.15em;margin-bottom:.6em">Practice complete.</p>
      <p><strong>No more feedback</strong> in the real task.</p>
      <p style="color:#7A6E5C;font-size:.9em;margin-top:12px">Two blocks — take a break between them if needed.</p>
    `,
    choices: ['Start Block 1'],
    data: { task: 'practice_end' },
  });

  // ── MAIN TRIALS ────────────────────────────────────────────────────────
  const all_trials = buildInterleavedTrials(20);   // 20 per condition = 40 main trials
  const half = Math.floor(all_trials.length / 2);
  const block1_trials = all_trials.slice(0, half);
  const block2_trials = all_trials.slice(half);

  let catch_counter = 0;

  function pushMainTrials(trial_list, block_n) {
    for (let i = 0; i < trial_list.length; i++) {
      const { seq, probe_pos, probe } = trial_list[i];

      if (i > 0 && i % 5 === 0) {
        catch_counter++;
        tl.push({
          type: htmlButtonResponse,
          stimulus: `<p style="font-size:1em;color:#7A6E5C;font-style:italic;margin-bottom:16px">Attention check</p>
                     <p style="font-size:1.1em">Which of these is a real English word?</p>`,
          choices: ['BRISK', 'BLORF'],
          data: { task: 'catch', catch_n: catch_counter },
          on_finish(data) { data.correct = data.response === 0; },
        });
      }

      for (let k = 0; k < seq.length; k++) {
        tl.push({
          type: audioKeyboardResponse,
          stimulus: seq[k].audio,
          choices: 'NO_KEYS',
          trial_ends_after_audio: true,
          prompt: `<p class="listen-indicator">word ${k + 1} of 3</p>`,
          data: { task: 'main_listen', block: block_n, trial_n: i, seq_pos: k, item_id: seq[k].id },
        });
        if (k < 2) {
          tl.push({
            type: htmlKeyboardResponse,
            stimulus: `<p class="iti-cross">·</p>`,
            choices: 'NO_KEYS',
            trial_duration: 900,
          });
        }
      }

      const choices_order = shuffle([probe.id, probe.foil]);
      tl.push({
        type: htmlButtonResponse,
        stimulus: `<p style="font-size:1.15em;margin-bottom:24px">Which of these did you hear?</p>`,
        choices: choices_order.map(c => `/${c}/`),
        button_html: choices_order.map(() => '<button class="jspsych-btn choice-btn">%choice%</button>'),
        data: {
          task: 'main_response',
          block: block_n,
          trial_n: i,
          probe_id: probe.id,
          probe_foil: probe.foil,
          condition: probe.condition,
          onset_n: probe.onset_n,
          coda_n: probe.coda_n,
          probe_pos,
          choices_order: JSON.stringify(choices_order),
        },
        on_finish(data) {
          data.correct = choices_order[data.response] === probe.id;
        },
      });

      tl.push({
        type: htmlKeyboardResponse,
        stimulus: `<p class="iti-cross">+</p>`,
        choices: 'NO_KEYS',
        trial_duration: 700,
      });
    }
  }

  pushMainTrials(block1_trials, 1);

  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <h3>Block 1 complete</h3>
      <p>Take a short break if you like.</p>
      <p style="color:#7A6E5C;font-size:.9em">Block 2 starts when you are ready.</p>
    `,
    choices: ['Start Block 2'],
    data: { task: 'block_break' },
  });

  pushMainTrials(block2_trials, 2);

  // ── END ────────────────────────────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <h3>Study Complete</h3>
      <p>Thank you for participating.</p>
      <p>Clicking below will download your results as a CSV file.<br>
         Please send the file to the researcher.</p>
    `,
    choices: ['Download my results'],
    data: { task: 'end' },
  });

  return tl;
}
