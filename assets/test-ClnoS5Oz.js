import{H as d,S as g,a as m,m as v,L as E,s as w,d as x,g as k,A as y,b as S,c as C,i as A}from"./noise-SnK5AGpW.js";const f="/phon-exp/",_=document.getElementById("test-menu"),h=document.getElementById("test-run");let c=null;function b(){var t;try{(t=c==null?void 0:c.endExperiment)==null||t.call(c)}catch{}c=null,h.style.display="none",_.style.display="block"}function N(t){_.style.display="none",h.style.display="block",h.innerHTML="";const e=document.createElement("button");e.className="back-btn",e.textContent="← menu",e.onclick=b,h.appendChild(e);const n=document.createElement("div");n.id="jspsych-display-element",h.appendChild(n),c=A({display_element:"jspsych-display-element",on_finish:b}),c.run(t.build(c))}function L(t){return[{type:d,stimulus:`
      <h2>Speech Perception Study</h2>
      <div style="text-align:left;max-width:600px;margin:0 auto;line-height:1.8">
        <p>In this study you will listen to short spoken words and answer memory questions.
           The study takes about <strong>15–20 minutes</strong>.</p>
        <p><strong>Requirements:</strong> fluent English speaker, quiet environment,
           <strong>headphones strongly recommended</strong>.</p>
        <p>Your responses are anonymous. You may stop at any time by closing this page.</p>
        <p>By clicking below you confirm you have read this and agree to participate.</p>
      </div>`,choices:["I consent — begin"]}]}function T(t){return[{type:g,preamble:'<h3>About You</h3><p style="color:#7A6E5C;font-size:.95em;margin-bottom:8px">A few background questions before we begin.</p>',html:`
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
      </table>`,button_label:"Continue"}]}function P(t){return[{type:d,stimulus:`
      <h3>Volume Check</h3>
      <p>Headphones or earphones are strongly recommended.</p>
      <p>Press Play and <strong>adjust your volume</strong> until the voice sounds
         <strong>clear and comfortable</strong> — not too quiet, not too loud.</p>
      <audio controls style="margin:24px auto">
        <source src="${f}stimuli/volume_check.wav" type="audio/wav">
      </audio>
      <p style="color:var(--muted);font-size:.9em">This is the same voice you will hear throughout the study.</p>`,choices:["Voice is clear — continue"]}]}function $(t){return[{type:m,stimulus:`
      <h3>Environment Check</h3>
      <p style="max-width:480px;margin:0 auto .8em">Measuring ambient noise via microphone.<br>
        <span style="color:var(--muted);font-size:.9em">No audio recorded — single number only.</span></p>
      <div id="noise-status" style="font-family:var(--mono);font-size:1.1em;color:var(--muted);margin:32px 0 8px;min-height:2em">
        Requesting microphone…
      </div>
      <div style="width:260px;height:3px;background:var(--surface2);margin:0 auto;border-radius:2px;overflow:hidden">
        <div id="noise-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent),var(--accent-hi));transition:width 3s linear"></div>
      </div>`,choices:"NO_KEYS",trial_duration:4500,on_load(){requestAnimationFrame(()=>{const e=document.getElementById("noise-bar");e&&(e.style.width="100%")}),v(3e3).then(({dbfs:e})=>{const n=document.getElementById("noise-status");if(!n)return;const l=e>-30?"Noisy":e>-45?"Moderate":"Quiet";n.innerHTML=`<span style="color:var(--accent)">${e}&thinsp;dBFS</span>
                          <span style="color:var(--muted);font-size:.8em;margin-left:10px">${l}</span>`,t.data.addProperties({ambient_noise_dbfs:e})}).catch(e=>{const n=document.getElementById("noise-status");n&&(n.innerHTML=`<span style="color:var(--muted);font-size:.9em">Mic unavailable (${e.name})</span>`)})}}]}function Y(t){const e=[];for(const n of E){e.push({type:d,stimulus:`<div class="lextale-word">${n.w}</div>`,choices:["YES — real word","NO — not a word"],on_finish(s){s.correct=s.response===0===n.real}});const l=n.real?"YES — real word":"NO — not a word";e.push({type:m,stimulus(){return t.data.get().last(1).values()[0].correct?`<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`:`<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">✗ Answer: <strong>${l}</strong></p>`},choices:"NO_KEYS",trial_duration:1400})}return e}function B(t){return w(x).slice(0,8).map(e=>({type:d,stimulus:`<div class="lextale-word">${e.w}</div>`,choices:["YES — real word","NO — not a word"],on_finish(n){n.correct=n.response===0===e.real}}))}function j(t){const e=[],n=`<input name="recall" type="text" inputmode="numeric"
    autocomplete="off" placeholder="e.g. 4 7 2">`;for(let l=1;l<=5;l++)for(let s=0;s<2;s++){const a=k(l),u=a.join("");for(let i=0;i<a.length;i++)e.push({type:y,stimulus:`${f}stimuli/digit_${a[i]}.wav`,choices:"NO_KEYS",trial_ends_after_audio:!0,prompt:`<p class="listen-indicator">digit ${i+1} of ${a.length}</p>`});e.push({type:g,preamble:'<p style="font-size:1.05em;margin-bottom:18px">Type the digits you heard, <em>in order</em>:</p>',html:n,button_label:"Submit",on_load(){const i=document.querySelector('input[name="recall"]');i&&i.focus()},on_finish(i){const o=(i.response.recall||"").replace(/\s+/g,"");i.correct=o===u}})}return e}function q(t){const e=[],[n]=S(1),l=6,{seq:s,probes:a,condition:u}=n;for(let i=0;i<s.length;i++)e.push({type:y,stimulus:s[i].audio,choices:"NO_KEYS",trial_ends_after_audio:!0,prompt:`<p class="listen-indicator">syllable ${i+1} of ${l} — listen</p>`,data:{item_id:s[i].id,condition:u}}),i<s.length-1&&e.push({type:m,stimulus:'<p class="iti-cross">·</p>',choices:"NO_KEYS",trial_duration:600});for(const i of a){const o=i;e.push({type:d,stimulus:`<p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
                 <div class="lextale-word">/${o.id}/</div>`,choices:["Yes — I heard it","No — I did not hear it"],button_html:['<button class="jspsych-btn choice-btn">%choice%</button>','<button class="jspsych-btn choice-btn">%choice%</button>'],on_finish(p){p.correct=p.response===0===o.in_list}});const r=i.in_list;e.push({type:m,stimulus(){return t.data.get().last(1).values()[0].correct?`<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`:`<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">
               ✗ ${r?"That syllable WAS in the list.":"That syllable was NOT in the list."}
             </p>`},choices:"NO_KEYS",trial_duration:1200})}return e}function I(t){const e=[],n=C().flat().slice(0,4),l=6;for(let s=0;s<n.length;s++){const{seq:a,probes:u,condition:i}=n[s];for(let o=0;o<a.length;o++)e.push({type:y,stimulus:a[o].audio,choices:"NO_KEYS",trial_ends_after_audio:!0,prompt:`<p class="listen-indicator">syllable ${o+1} of ${l}</p>`,data:{item_id:a[o].id,condition:i}}),o<a.length-1&&e.push({type:m,stimulus:'<p class="iti-cross">·</p>',choices:"NO_KEYS",trial_duration:600});for(let o=0;o<u.length;o++){const r=u[o];e.push({type:d,stimulus:`<p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
                   <div class="lextale-word">/${r.id}/</div>`,choices:["Yes — I heard it","No — I did not hear it"],button_html:['<button class="jspsych-btn choice-btn">%choice%</button>','<button class="jspsych-btn choice-btn">%choice%</button>'],data:{trial_n:s,probe_n:o,probe_id:r.id,in_list:r.in_list,condition:r.condition,onset_n:r.onset_n,coda_n:r.coda_n},on_finish(p){p.correct=p.response===0===r.in_list}})}e.push({type:m,stimulus:'<p class="iti-cross">+</p>',choices:"NO_KEYS",trial_duration:700})}return e}function O(t){return[{type:d,stimulus:`<h3>Study Complete</h3>
               <p>Thank you for participating.</p>
               <p>Clicking below will download your results as a CSV file.<br>
                  Please send the file to the researcher.</p>`,choices:["Download my results"]}]}const z=[{id:"consent",label:"Consent",desc:"Information & consent screen",build:L},{id:"demographics",label:"Demographics",desc:"Background questions form",build:T},{id:"volume",label:"Volume Check",desc:"Audio playback & volume calibration",build:P},{id:"noise",label:"Noise Check",desc:"Microphone ambient noise measurement",build:$},{id:"lextale-practice",label:"LexTALE Practice",desc:"Practice items with feedback",build:Y},{id:"lextale",label:"LexTALE (8 items)",desc:"8 random items from the scored list",build:B},{id:"digit-span",label:"Digit Span",desc:"Lengths 1–5, 2 trials each",build:j},{id:"syllable-practice",label:"Syllable Practice",desc:"1 trial, 2 probes with feedback",build:q,needsAudio:!0},{id:"main-task",label:"Main Task",desc:"4 trials (2 CCVC + 2 CVCC)",build:I,needsAudio:!0},{id:"end",label:"End Screen",desc:"Study complete screen",build:O}],M=document.getElementById("section-grid");for(const t of z){const e=document.createElement("div");e.className="section-card",e.innerHTML=`
    <div class="s-label">${t.label}</div>
    <div class="s-desc">${t.desc}</div>
    ${t.needsAudio?'<div class="s-warn">⚠ needs generated audio</div>':""}
  `,e.onclick=()=>N(t),M.appendChild(e)}
