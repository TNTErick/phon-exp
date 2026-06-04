import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import surveyHtmlForm from '@jspsych/plugin-survey-html-form';
import preload from '@jspsych/plugin-preload';

import { ITEMS, CCVC_ITEMS, CVCC_ITEMS, LEXTALE } from './stimuli.js';
import { shuffle, buildInterleavedTrials, buildDigitSequences } from './trials.js';
import { measureAmbientNoise } from './noise.js';
import { setupRecallUI } from './speech.js';

const BASE = import.meta.env.BASE_URL;

export function buildTimeline(jsPsych) {
  const tl = [];

  // ── PRELOAD ────────────────────────────────────────────────────────────
  tl.push({
    type: preload,
    audio: [
    ...ITEMS.map(x => x.audio),
    `${BASE}stimuli/volume_check.wav`,
    ...[1,2,3,4,5,6,7,8,9].map(n => `${BASE}stimuli/digit_${n}.wav`),
  ],
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
        <tr><td>Audio device</td>
            <td><select name="audio_device">
                  <option value="anc">Noise-cancelling headphones / buds (ANC)</option>
                  <option value="headphones">Regular headphones / earphones</option>
                  <option value="speakers">External speakers</option>
                  <option value="laptop">Laptop / built-in speakers</option>
                  <option value="phone">Phone speaker</option>
                </select></td></tr>
      </table>
    `,
    button_label: 'Continue',
    data: { task: 'demographics' },
  });

  // ── VOLUME CHECK ──────────────────────────────────────────────────────
  // Uses the same TTS voice as stimuli so participants calibrate to speech.
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <h3>Volume Check</h3>
      <p>Headphones or earphones are strongly recommended.</p>
      <p>Press Play and <strong>adjust your volume</strong> until the voice sounds
         <strong>clear and comfortable</strong> — not too quiet, not too loud.</p>
      <audio controls style="margin:24px auto">
        <source src="${BASE}stimuli/volume_check.wav" type="audio/wav">
      </audio>
      <p style="color:var(--muted);font-size:.9em">
        This is the same voice you will hear throughout the study.
      </p>
    `,
    choices: ['Voice is clear — continue'],
    data: { task: 'volume_check' },
  });

  // ── NOISE CHECK ───────────────────────────────────────────────────────
  // Measures ambient RMS via microphone for 3 s.
  // No audio is recorded — only the noise level number is stored.
  // Auto-advances after 4.5 s (0.5 s buffer after measurement).
  tl.push({
    type: htmlKeyboardResponse,
    stimulus() {
      const demo = jsPsych.data.get().filter({ task: 'demographics' }).values()[0]?.response;
      const isANC = demo?.audio_device === 'anc';
      const ancNote = isANC
        ? `<p style="color:var(--green);font-size:.88em;margin:.4em auto;max-width:420px">
             Noise-cancelling device detected — your actual listening environment is likely better than the room measurement.
           </p>`
        : '';
      return `
        <h3>Environment Check</h3>
        <p style="max-width:480px;margin:0 auto .8em">
          We will briefly measure your ambient noise level via microphone.<br>
          <span style="color:var(--muted);font-size:.9em">No audio is recorded — only a single number.</span>
        </p>
        ${ancNote}
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
        </div>`;
    },
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
        .then(({ rms, dbfs, dbfs_samples }) => {
          const el = document.getElementById('noise-status');
          if (el) {
            const label = dbfs > -30 ? 'Noisy' : dbfs > -45 ? 'Moderate' : 'Quiet';
            el.innerHTML =
              `<span style="color:var(--accent)">${dbfs}&thinsp;dBFS</span>` +
              `<span style="color:var(--muted);font-size:.8em;margin-left:12px">${label}</span>`;
          }
          jsPsych.data.addProperties({
            ambient_noise_dbfs: dbfs,
            ambient_noise_rms: rms,
            ambient_noise_samples: JSON.stringify(dbfs_samples),
          });
        })
        .catch(err => {
          const el = document.getElementById('noise-status');
          if (el) el.innerHTML =
            `<span style="color:var(--muted);font-size:.9em">Mic unavailable (${err.name})</span>`;
          jsPsych.data.addProperties({ ambient_noise_dbfs: null, ambient_noise_rms: null });
        });
    },
  });

  // ── NOISE GATE ────────────────────────────────────────────────────────
  // Show only if noise exceeds soft threshold. Records warning exposure
  // and participant choice as data quality flags.
  const NOISE_SOFT = -24;  // dBFS — soft warning: noticeably noisy
  const NOISE_HARD = -18;  // dBFS — hard warning: very loud environment

  tl.push({
    timeline: [{
      type: htmlButtonResponse,
      stimulus() {
        const noise = jsPsych.data.get().filter({ task: 'noise_check' }).values()[0]?.ambient_noise_dbfs;
        const hard = noise > NOISE_HARD;
        return `
          <h3 style="color:${hard ? 'var(--red)' : 'var(--accent)'}">
            ${hard ? '⚠ Environment too noisy' : '⚠ Somewhat noisy'}
          </h3>
          <p style="max-width:480px;margin:0 auto">
            Your measured noise level is
            <strong style="font-family:var(--mono)">${noise}&thinsp;dBFS</strong>.
            ${hard
              ? 'This is likely to interfere with the audio task. <strong>Please find a quieter environment</strong>, then reload the page to start again.'
              : 'This may slightly affect the audio task. A quieter environment is recommended.'}
          </p>
          <p style="color:var(--muted);font-size:.88em;margin-top:12px">
            ${hard ? 'You may still continue, but your data quality may be affected.' : 'You may continue if you cannot find a quieter spot.'}
          </p>
        `;
      },
      choices() {
        const noise = jsPsych.data.get().filter({ task: 'noise_check' }).values()[0]?.ambient_noise_dbfs;
        return noise > NOISE_HARD
          ? ['Continue anyway', 'Exit and retry']
          : ['Continue', 'I\'ll find a quieter place first'];
      },
      data: { task: 'noise_gate' },
      on_finish(data) {
        const noise = jsPsych.data.get().filter({ task: 'noise_check' }).values()[0]?.ambient_noise_dbfs;
        data.noise_level = noise;
        data.noise_hard_warning = noise > NOISE_HARD;
        // response 0 = continue, 1 = exit/retry
        data.chose_to_continue = data.response === 0;
        if (!data.chose_to_continue) {
          // Participant chose to exit — end experiment
          jsPsych.endExperiment('You can reload the page when you are in a quieter environment.');
        }
      },
    }],
    conditional_function() {
      const noise = jsPsych.data.get().filter({ task: 'noise_check' }).values()[0]?.ambient_noise_dbfs;
      // Skip if mic unavailable or noise acceptable
      if (noise === null || noise === undefined || noise <= NOISE_SOFT) return false;
      // Skip for ANC users — room mic overstates their actual listening noise
      const demo = jsPsych.data.get().filter({ task: 'demographics' }).values()[0]?.response;
      if (demo?.audio_device === 'anc') return false;
      return true;
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
      <p>You will <strong>hear</strong> a sequence of digits spoken one at a time.</p>
      <p>After the last one, <strong>say them back in order</strong> — then type what you said.</p>
      <p>Sequences get longer as you go. Do your best. &nbsp;<span style="color:#7A6E5C;font-size:.9em">≈ 5 minutes.</span></p>
    `,
    choices: ['Start'],
    data: { task: 'digit_span_instructions' },
  });

  for (const { digits, len, trial } of buildDigitSequences()) {
    // Auditory presentation — one digit audio per slot
    for (let i = 0; i < digits.length; i++) {
      tl.push({
        type: audioKeyboardResponse,
        stimulus: `${BASE}stimuli/digit_${digits[i]}.wav`,
        choices: 'NO_KEYS',
        trial_ends_after_audio: true,
        prompt: `<p class="listen-indicator">digit ${i + 1} of ${digits.length}</p>`,
        data: { task: 'digit_display', digit: digits[i], position: i, seq_len: len, trial_n: trial },
      });
      if (i < digits.length - 1) {
        tl.push({
          type: htmlKeyboardResponse,
          stimulus: `<p class="iti-cross">·</p>`,
          choices: 'NO_KEYS',
          trial_duration: 400,
        });
      }
    }

    // Spoken + typed recall
    const target_str = digits.join('');
    tl.push({
      type: surveyHtmlForm,
      preamble: `<p style="font-size:1.05em;margin-bottom:6px">Say the digits aloud, then type them below.</p>`,
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:10px">
          <button type="button" id="sr-btn" style="
            font-family:var(--mono);font-size:.95em;letter-spacing:.06em;
            background:transparent;color:var(--accent);border:1.5px solid var(--accent);
            border-radius:4px;padding:10px 28px;cursor:pointer">
            🎤 Speak
          </button>
          <div id="sr-status" style="
            font-family:var(--mono);font-size:1.1em;letter-spacing:.12em;
            color:var(--muted);min-height:1.6em">—</div>
          <input name="recall" id="sr-input" type="text" inputmode="numeric"
            autocomplete="off" placeholder="or type here">
        </div>
      `,
      button_label: 'Submit',
      data: { task: 'digit_recall', target: target_str, seq_len: len, trial_n: trial },
      on_load() { setupRecallUI(); },
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
