import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import audioKeyboardResponse from '@jspsych/plugin-audio-keyboard-response';
import surveyHtmlForm from '@jspsych/plugin-survey-html-form';
import preload from '@jspsych/plugin-preload';

import { ITEMS, CCVC_ITEMS, CVCC_ITEMS, LEXTALE } from './stimuli.js';
import { shuffle, generateDigits } from './trials.js';
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
      <p>After the last one, <strong>type them all back in order</strong>.</p>
      <p>Sequences get longer as you go. Do your best. &nbsp;<span style="color:#7A6E5C;font-size:.9em">≈ 5 minutes.</span></p>
    `,
    choices: ['Start'],
    data: { task: 'digit_span_instructions' },
  });

  // Adaptive digit span: 2 trials per length, stop when both wrong.
  // Lengths 3–12; records digit_span_first_error and digit_span_final.
  const DS_MIN = 3, DS_MAX = 12;
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
        if (i < digits.length - 1) {
          blockTrials.push({
            type: htmlKeyboardResponse,
            stimulus: `<p class="iti-cross">·</p>`,
            choices: 'NO_KEYS',
            trial_duration: 400,
          });
        }
      }

      blockTrials.push({
        type: surveyHtmlForm,
        preamble: `<p style="font-size:1.05em;margin-bottom:18px">Type the digits you heard, <em>in order</em>:</p>`,
        html: RECALL_HTML,
        button_label: 'Submit',
        data: { task: 'digit_recall', target, seq_len: len, trial_n: trialIdx },
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

  // ── PART 3: MAIN TASK ─────────────────────────────────────────────────
  // Session = 10-syllable study list (one condition) + 5-probe memory test.
  // Each study trial: hear syllable → choose from 3 options (same condition).
  // Test: 5 × 2-AFC — which of two was in the list?
  // 2 sessions (CCVC + CVCC), order counterbalanced.

  const N_STUDY  = 10;  // syllables per session
  const N_TEST   = 5;   // memory probes per session
  const N_CHOICES = 3;  // options shown at encoding (target + distractors)

  const ISI = { type: htmlKeyboardResponse, stimulus: `<p class="iti-cross">·</p>`,
                choices: 'NO_KEYS', trial_duration: 600 };

  // Build one encoding trial: hear target → choose from N_CHOICES same-condition items
  function encodingTrial(target, pool, task, extra = {}) {
    const distractors = shuffle(pool.filter(x => x.id !== target.id)).slice(0, N_CHOICES - 1);
    const choices = shuffle([target, ...distractors]);
    return [
      {
        type: audioKeyboardResponse,
        stimulus: target.audio,
        choices: 'NO_KEYS',
        trial_ends_after_audio: true,
        prompt: `<p class="listen-indicator">listen</p>`,
        data: { task: task + '_listen', item_id: target.id, condition: target.condition, ...extra },
      },
      {
        type: htmlButtonResponse,
        stimulus: `<p style="font-size:1.1em;margin-bottom:24px">Which syllable did you just hear?</p>`,
        choices: choices.map(c => `/${c.id}/`),
        button_html: choices.map(() => '<button class="jspsych-btn choice-btn">%choice%</button>'),
        data: { task: task + '_choice', target: target.id, condition: target.condition, ...extra },
        on_finish(data) {
          data.correct = choices[data.response].id === target.id;
          data.choice_order = JSON.stringify(choices.map(c => c.id));
        },
      },
      ISI,
    ];
  }

  // Build one full session
  function buildSession(sessionN, condition) {
    const pool    = condition === 'CCVC' ? CCVC_ITEMS : CVCC_ITEMS;
    const studied = shuffle(pool).slice(0, N_STUDY);
    const studiedIds = new Set(studied.map(x => x.id));
    const foilPool   = shuffle(pool.filter(x => !studiedIds.has(x.id)));
    const sessionTl  = [];

    // Encoding
    studied.forEach((target, i) => {
      sessionTl.push(...encodingTrial(target, pool, 'study',
        { session: sessionN, position: i }));
    });

    // Transition to test
    sessionTl.push({
      type: htmlButtonResponse,
      stimulus: `
        <h3>Memory Test</h3>
        <p>You heard <strong>${N_STUDY} syllables</strong>.</p>
        <p>Now: choose which syllable <em>appeared in the list</em> — ${N_TEST} questions.</p>
      `,
      choices: ['Begin test'],
      data: { task: 'test_start', session: sessionN, condition },
    });

    // Test: N_TEST probed 2-AFC recognition
    const testTargets = shuffle(studied).slice(0, N_TEST);
    testTargets.forEach((probe, i) => {
      const foil = foilPool[i % foilPool.length];
      const choices = shuffle([probe, foil]);
      sessionTl.push(
        {
          type: htmlButtonResponse,
          stimulus: `<p style="font-size:1.1em;margin-bottom:24px">Which of these was in the list you just heard?</p>`,
          choices: choices.map(c => `/${c.id}/`),
          button_html: choices.map(() => '<button class="jspsych-btn choice-btn">%choice%</button>'),
          data: { task: 'test_recognition', session: sessionN, condition,
                  probe_id: probe.id, foil_id: foil.id },
          on_finish(data) {
            data.correct = choices[data.response].id === probe.id;
            data.choice_order = JSON.stringify(choices.map(c => c.id));
          },
        },
        ISI,
      );
    });

    return sessionTl;
  }

  // ── PRACTICE ──────────────────────────────────────────────────────────
  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <span class="part-chip">Part 3 of 3</span>
      <h3>Syllable Memory</h3>
      <p>You will hear <strong>${N_STUDY} syllables</strong>, one at a time.</p>
      <p>After each one, choose which syllable you just heard from three options.</p>
      <p>At the end, answer <strong>${N_TEST} memory questions</strong> about the list.</p>
      <p style="color:#7A6E5C;font-size:.9em">Short practice with feedback first. &nbsp;≈ 15 minutes total.</p>
    `,
    choices: ['Start practice'],
    data: { task: 'main_instructions' },
  });

  // 3 practice items (mix of conditions), with correctness feedback
  const practiceItems = shuffle([CCVC_ITEMS[0], CVCC_ITEMS[0], CCVC_ITEMS[1]]);
  for (const target of practiceItems) {
    const pool = target.condition === 'CCVC' ? CCVC_ITEMS : CVCC_ITEMS;
    const [listenTrial, choiceTrial, isiTrial] =
      encodingTrial(target, pool, 'practice', {});
    tl.push(listenTrial);
    // Override on_finish on the choice trial to also record correct_id for feedback
    const correct_id = target.id;
    choiceTrial.on_finish = function(data) {
      data.correct = JSON.parse(data.choice_order)[data.response] === correct_id;
      data.choice_order = data.choice_order; // keep
    };
    tl.push(choiceTrial);
    // Feedback
    tl.push({
      type: htmlKeyboardResponse,
      stimulus() {
        const last = jsPsych.data.get().last(1).values()[0];
        return last.correct
          ? `<p style="font-size:1.5em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`
          : `<p style="font-size:1.5em;color:#C05858;font-family:'EB Garamond',serif">✗ It was <span style="font-family:'JetBrains Mono',monospace">/${correct_id}/</span></p>`;
      },
      choices: 'NO_KEYS',
      trial_duration: 1500,
    });
    tl.push(isiTrial);
  }

  tl.push({
    type: htmlButtonResponse,
    stimulus: `
      <p style="font-size:1.15em;margin-bottom:.6em">Practice complete.</p>
      <p><strong>No more feedback</strong> in the real task.</p>
    `,
    choices: ['Start Session 1'],
    data: { task: 'practice_end' },
  });

  // ── SESSIONS ──────────────────────────────────────────────────────────
  // Counterbalance condition order across participants
  const firstCond  = Math.random() < 0.5 ? 'CCVC' : 'CVCC';
  const conditions = [firstCond, firstCond === 'CCVC' ? 'CVCC' : 'CCVC'];

  conditions.forEach((cond, s) => {
    tl.push(...buildSession(s + 1, cond));
    if (s < conditions.length - 1) {
      tl.push({
        type: htmlButtonResponse,
        stimulus: `
          <h3>Session ${s + 1} complete</h3>
          <p>Take a short break if you like.</p>
        `,
        choices: [`Start Session ${s + 2}`],
        data: { task: 'session_break', session: s + 1 },
      });
    }
  });

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
