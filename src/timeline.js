import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import surveyHtmlForm from '@jspsych/plugin-survey-html-form';
import preload from '@jspsych/plugin-preload';

import { ITEMS, CCVC_ITEMS, CVCC_ITEMS, LEXTALE, LEXTALE_PRACTICE } from './stimuli.js';
import { shuffle, generateDigits, buildPracticeTrials, buildAllTrials } from './trials.js';
import { measureAmbientNoise } from './noise.js';

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
    continue_after_error: true,
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
      <p>If you are sure a word exists even if you don't know its exact meaning, press YES.<br>
         This test uses <strong>British spelling</strong> (e.g. <em>savoury</em>, not <em>savory</em>).</p>
      <p style="color:#7A6E5C;font-size:.9em">Three practice items with feedback first. &nbsp;≈ 3 minutes total.</p>
    `,
    choices: ['Start'],
    data: { task: 'lextale_instructions' },
  });

  // Practice items with feedback (not scored)
  for (const item of LEXTALE_PRACTICE) {
    tl.push({
      type: htmlButtonResponse,
      stimulus: `<div class="lextale-word">${item.w}</div>`,
      choices: ['YES — real word', 'NO — not a word'],
      data: { task: 'lextale_practice', word: item.w, is_word: item.real },
      on_finish(data) { data.correct = (data.response === 0) === item.real; },
    });
    const correctLabel = item.real ? 'YES — real word' : 'NO — not a word';
    tl.push({
      type: htmlKeyboardResponse,
      stimulus() {
        const last = jsPsych.data.get().last(1).values()[0];
        return last.correct
          ? `<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`
          : `<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">✗ The answer was <strong>${correctLabel}</strong></p>`;
      },
      choices: 'NO_KEYS',
      trial_duration: 1400,
    });
  }

  tl.push({
    type: htmlButtonResponse,
    stimulus: `<p style="font-size:1.1em">Practice done. <strong>No more feedback</strong> in the real test.</p>`,
    choices: ['Start test'],
    data: { task: 'lextale_practice_end' },
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
      <p>After the last one, <strong>type them all back in order</strong>.</p>
      <p>Sequences get longer as you go. Do your best. &nbsp;<span style="color:#7A6E5C;font-size:.9em">≈ 5 minutes.</span></p>
    `,
    choices: ['Start'],
    data: { task: 'digit_span_instructions' },
  });

  // Adaptive digit span: 2 trials per length, stop when both wrong.
  // Lengths 3–12; records digit_span_first_error and digit_span_final.
  const DS_MIN = 1, DS_MAX = 12;
  const ds = { firstError: null, finalLen: null, errorsNow: 0, stop: false };

  const RECALL_HTML = `<input name="recall" type="text" inputmode="numeric"
    autocomplete="off" placeholder="e.g. 4 7 2">`;

  function makeDigitBlock(len) {
    const blockTrials = [];

    for (let trialIdx = 0; trialIdx < 2; trialIdx++) {
      const digits = generateDigits(len);
      const target = digits.join('');

      for (let i = 0; i < digits.length; i++) {
        blockTrials.push({
          type: audioKeyboardResponse,
          stimulus: `${BASE}stimuli/digit_${digits[i]}.wav`,
          choices: 'NO_KEYS',
          trial_ends_after_audio: true,
          prompt: `<p class="listen-indicator">digit ${i + 1} of ${digits.length}</p>`,
          data: { task: 'digit_display', digit: digits[i], position: i, seq_len: len, trial_n: trialIdx },
        });
      }

      blockTrials.push({
        type: surveyHtmlForm,
        preamble: `<p style="font-size:1.05em;margin-bottom:18px">Type the digits you heard, <em>in order</em>:</p>`,
        html: RECALL_HTML,
        button_label: 'Submit',
        data: { task: 'digit_recall', target, seq_len: len, trial_n: trialIdx },
        on_load() {
          const input = document.querySelector('input[name="recall"]');
          if (input) input.focus();
        },
        on_finish(data) {
          const raw = (data.response.recall || '').replace(/\s+/g, '');
          data.correct = raw === target;
          data.response_cleaned = raw;
          if (!data.correct) {
            if (ds.firstError === null) ds.firstError = len;
            ds.errorsNow++;
            if (ds.errorsNow >= 2) {
              ds.finalLen = len;
              ds.stop = true;
              jsPsych.data.addProperties({
                digit_span_first_error: ds.firstError,
                digit_span_final:       ds.finalLen,
              });
            }
          }
        },
      });
    }

    return {
      timeline: blockTrials,
      conditional_function() {
        ds.errorsNow = 0; // reset per-length error count before block runs
        return !ds.stop;
      },
    };
  }

  for (let len = DS_MIN; len <= DS_MAX; len++) {
    tl.push(makeDigitBlock(len));
  }

  // Finalise if participant reached ceiling without both failing at any length
  tl.push({
    type: htmlKeyboardResponse,
    stimulus: '',
    choices: 'NO_KEYS',
    trial_duration: 1,
    on_start() {
      if (!ds.stop) {
        jsPsych.data.addProperties({
          digit_span_first_error: ds.firstError,
          digit_span_final:       null,   // null = ceiling reached (>= DS_MAX)
        });
      }
    },
  });

  // ── PART 3: SYLLABLE MEMORY ───────────────────────────────────────────
  // Serial recognition: hear N syllables (same condition) → 9 yes/no probes.
  // 28 trials across 5 conditions (CCVC/CVCC/CCCVC/CCVCC/VCCC), 7 blocks of 4.
  // Each block is self-paced: participant starts each trial manually.

  // ── Rest page before practice ─────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <span class="part-chip">Part 3 of 3</span>
      <h3>Syllable Memory</h3>
      <p>You will hear a short sequence of nonsense syllables, one at a time.</p>
      <p>Then answer <strong>9 yes/no questions</strong>: did you hear each syllable in the list?</p>
      <p>Focus on the sounds — the beginning <em>and</em> the end of each syllable matter.</p>
      <p style="color:#7A6E5C;font-size:.9em">Short practice with feedback first. Take a moment to rest before starting.</p>
    `,
    choices: ['I am ready — start practice'],
    data: { task: 'main_instructions' },
  });

  // ── Practice (2 trials, 4 probes each, with feedback) ─────────────────
  const practice_trials = buildPracticeTrials(2);

  for (let pi = 0; pi < practice_trials.length; pi++) {
    const { seq, probes, condition } = practice_trials[pi];

    tl.push({
      type: htmlButtonResponse,
      stimulus: `<p style="color:var(--muted);font-size:.9em;margin-bottom:8px">Practice trial ${pi + 1} of ${practice_trials.length}</p>
                 <p>Press when ready to listen.</p>`,
      choices: ['▶  Ready'],
      data: { task: 'practice_ready', condition },
    });

    for (let k = 0; k < seq.length; k++) {
      tl.push({
        type: audioKeyboardResponse,
        stimulus: seq[k].audio,
        choices: 'NO_KEYS',
        trial_ends_after_audio: true,
        prompt: `<p class="listen-indicator">syllable ${k + 1} of ${seq.length} — listen</p>`,
        data: { task: 'practice_listen', seq_pos: k, item_id: seq[k].id, condition },
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
        stimulus: `
          <p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
          <div class="lextale-word">/${p.id}/</div>
        `,
        choices: ['Yes — I heard it', 'No — I did not hear it'],
        button_html: ['<button class="jspsych-btn choice-btn">%choice%</button>',
                      '<button class="jspsych-btn choice-btn">%choice%</button>'],
        data: { task: 'practice_response', probe_id: p.id, in_list: p.in_list,
                foil_type: p.foil_type, condition: p.condition },
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
                 ✗ ${was_in_list ? 'That syllable was in the list.' : 'That syllable was not in the list.'}
               </p>`;
        },
        choices: 'NO_KEYS',
        trial_duration: 1200,
      });
    }

    tl.push({ type: htmlKeyboardResponse, stimulus: `<p class="iti-cross">·</p>`,
              choices: 'NO_KEYS', trial_duration: 600 });
  }

  // ── Rest page before main task ────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <p style="font-size:1.15em;margin-bottom:.6em">Practice complete.</p>
      <p><strong>No feedback</strong> in the real task.</p>
      <p style="color:#7A6E5C;font-size:.9em;margin-top:12px">
        7 blocks of 4 trials — you can rest between any blocks.<br>
        Take a moment now before starting.
      </p>
    `,
    choices: ['I am rested — begin Block 1'],
    data: { task: 'practice_end' },
  });

  // ── Main trials: 7 blocks × 4 trials ─────────────────────────────────
  const blocks = buildAllTrials();

  function pushTrial(trial, block_n, trial_n) {
    const { seq, probes, condition } = trial;

    tl.push({
      type: htmlButtonResponse,
      stimulus: `<p style="color:var(--muted);font-size:.88em;margin-bottom:12px">
                   Block ${block_n} of ${blocks.length} &nbsp;·&nbsp; Trial ${trial_n + 1} of ${blocks[block_n - 1].length}
                 </p>
                 <p>Press when ready to listen to the next sequence.</p>`,
      choices: ['▶  Ready'],
      data: { task: 'trial_ready', block: block_n, trial_n, condition },
    });

    for (let k = 0; k < seq.length; k++) {
      tl.push({
        type: audioKeyboardResponse,
        stimulus: seq[k].audio,
        choices: 'NO_KEYS',
        trial_ends_after_audio: true,
        prompt: `<p class="listen-indicator">syllable ${k + 1} of ${seq.length}</p>`,
        data: { task: 'main_listen', block: block_n, trial_n,
                seq_pos: k, item_id: seq[k].id, condition },
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
        stimulus: `
          <p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
          <div class="lextale-word">/${p.id}/</div>
        `,
        choices: ['Yes — I heard it', 'No — I did not hear it'],
        button_html: ['<button class="jspsych-btn choice-btn">%choice%</button>',
                      '<button class="jspsych-btn choice-btn">%choice%</button>'],
        data: {
          task: 'main_response', block: block_n, trial_n, probe_n: q,
          probe_id: p.id, in_list: p.in_list, foil_type: p.foil_type,
          condition: p.condition, onset_n: p.onset_n, coda_n: p.coda_n,
        },
        on_finish(data) { data.correct = (data.response === 0) === p.in_list; },
      });
    }

    tl.push({ type: htmlKeyboardResponse, stimulus: `<p class="iti-cross">+</p>`,
              choices: 'NO_KEYS', trial_duration: 700 });
  }

  for (let b = 0; b < blocks.length; b++) {
    if (b > 0) {
      tl.push({
        type: htmlButtonResponse,
        stimulus: `
          <h3>Block ${b} complete</h3>
          <p>${blocks.length - b} block${blocks.length - b > 1 ? 's' : ''} remaining.</p>
          <p style="color:#7A6E5C;font-size:.9em">Take as long as you need to rest.</p>
        `,
        choices: [`Continue to Block ${b + 1}`],
        data: { task: 'block_break', block: b },
      });
    }
    for (let i = 0; i < blocks[b].length; i++) {
      pushTrial(blocks[b][i], b + 1, i);
    }
  }

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
