import{P as y,I as H,H as f,S as j,a as w,m as K,L as F,s as D,b as G,A as B,c as V,g as U,d as J,i as W}from"./noise-SnK5AGpW.js";const X={name:"preload",parameters:{auto_preload:{type:y.BOOL,pretty_name:"Auto-preload",default:!1},trials:{type:y.TIMELINE,pretty_name:"Trials",default:[]},images:{type:y.STRING,pretty_name:"Images",default:[],array:!0},audio:{type:y.STRING,pretty_name:"Audio",default:[],array:!0},video:{type:y.STRING,pretty_name:"Video",default:[],array:!0},message:{type:y.HTML_STRING,pretty_name:"Message",default:null},show_progress_bar:{type:y.BOOL,pretty_name:"Show progress bar",default:!0},continue_after_error:{type:y.BOOL,pretty_name:"Continue after error",default:!1},error_message:{type:y.HTML_STRING,pretty_name:"Error message",default:"The experiment failed to load."},show_detailed_errors:{type:y.BOOL,pretty_name:"Show detailed errors",default:!1},max_load_time:{type:y.INT,pretty_name:"Max load time",default:null},on_error:{type:y.FUNCTION,pretty_name:"On error",default:null},on_success:{type:y.FUNCTION,pretty_name:"On success",default:null}}};class M{constructor(t){this.jsPsych=t}trial(t,o){var l=null,h=!1,E=[],m=[],N=[],T=[],S=this.jsPsych.getSafeModeStatus(),d=[],_=[],e=[];if(o.auto_preload){var s=this.jsPsych.getTimeline(),i=this.jsPsych.pluginAPI.getAutoPreloadList(s);d=d.concat(i.images),_=_.concat(i.audio),e=e.concat(i.video)}if(o.trials.length>0){var n=this.jsPsych.pluginAPI.getAutoPreloadList(o.trials);d=d.concat(n.images),_=_.concat(n.audio),e=e.concat(n.video)}d=d.concat(o.images),_=_.concat(o.audio),e=e.concat(o.video),d=this.jsPsych.utils.unique(d.flat()),_=this.jsPsych.utils.unique(_.flat()),e=this.jsPsych.utils.unique(e.flat()),S&&(e=[]);var c="";o.message!==null&&(c+=o.message),o.show_progress_bar&&(c+=`
            <div id='jspsych-loading-progress-bar-container' style='height: 10px; width: 300px; background-color: #ddd; margin: auto;'>
              <div id='jspsych-loading-progress-bar' style='height: 10px; width: 0%; background-color: #777;'></div>
            </div>`),t.innerHTML=c;const r=()=>{if($++,o.show_progress_bar){var a=$/P*100,b=t.querySelector("#jspsych-loading-progress-bar");b!==null&&(b.style.width=a+"%")}},u=()=>{typeof h<"u"&&h===!1&&(this.jsPsych.pluginAPI.clearAllTimeouts(),this.jsPsych.pluginAPI.cancelPreloads(),l=!0,I())},g=()=>{this.jsPsych.pluginAPI.cancelPreloads(),typeof l<"u"&&(l===!1||l===null)&&(h=!0,q<P&&(l=!1),z("timeout"),T.push("<p><strong>Loading timed out.</strong><br>Consider compressing your stimuli files, loading your files in smaller batches,<br>and/or increasing the <i>max_load_time</i> parameter.</p>"),o.continue_after_error?I():x())},x=()=>{this.jsPsych.pluginAPI.clearAllTimeouts(),this.jsPsych.pluginAPI.cancelPreloads(),t.innerHTML=o.error_message,o.show_detailed_errors&&(t.innerHTML+="<p><strong>Error details:</strong></p>",T.forEach(a=>{t.innerHTML+=a}))},I=()=>{this.jsPsych.pluginAPI.clearAllTimeouts();var a={success:l,timeout:h,failed_images:E,failed_audio:m,failed_video:N};t.innerHTML="",this.jsPsych.finishTrial(a)};o.max_load_time!==null&&this.jsPsych.pluginAPI.setTimeout(g,o.max_load_time);var P=d.length+_.length+e.length,$=0,q=0;if(P==0)u();else{const a=A=>{this.jsPsych.pluginAPI.preloadVideo(e,A,Y,L)},b=A=>{this.jsPsych.pluginAPI.preloadAudio(_,A,Y,L)},v=A=>{this.jsPsych.pluginAPI.preloadImages(d,A,Y,L)};e.length>0&&a(()=>{}),_.length>0&&b(()=>{}),d.length>0&&v(()=>{})}function L(a){r(),l==null&&(l=!1);var b="unknown file";a.source&&(b=a.source),a.error&&a.error.path&&a.error.path.length>0&&(a.error.path[0].localName=="img"?E.push(b):a.error.path[0].localName=="audio"?m.push(b):a.error.path[0].localName=="video"&&N.push(b));var v="<p><strong>Error loading file: "+b+"</strong><br>";a.error.statusText&&(v+="File request response status: "+a.error.statusText+"<br>"),a.error=="404"&&(v+="404 - file not found.<br>"),typeof a.error.loaded<"u"&&a.error.loaded!==null&&a.error.loaded!==0?v+=a.error.loaded+" bytes transferred.":v+="File did not begin loading. Check that file path is correct and reachable by the browser,<br>and that loading is not blocked by cross-origin resource sharing (CORS) errors.",v+="</p>",T.push(v),z(b),$==P&&(o.continue_after_error?I():x())}function Y(a){r(),R(a),q++,q==P?u():$==P&&(o.continue_after_error?I():x())}function z(a){o.on_error!==null&&o.on_error(a)}function R(a){o.on_success!==null&&o.on_success(a)}}simulate(t,o,l,h){o=="data-only"&&(h(),this.simulate_data_only(t,l)),o=="visual"&&this.simulate_visual(t,l,h)}create_simulation_data(t,o){const l={success:!0,timeout:!1,failed_images:[],failed_audio:[],failed_video:[]};return this.jsPsych.pluginAPI.mergeSimulationData(l,o)}simulate_data_only(t,o){const l=this.create_simulation_data(t,o);this.jsPsych.finishTrial(l)}simulate_visual(t,o,l){const h=this.jsPsych.getDisplayElement();this.trial(h,t),l()}}M.info=X;const C="/phon-exp/";function Q(p){const t=[];t.push({type:M,audio:[...H.map(e=>e.audio),`${C}stimuli/volume_check.wav`,...[1,2,3,4,5,6,7,8,9].map(e=>`${C}stimuli/digit_${e}.wav`)],show_progress_bar:!0,continue_after_error:!0,message:`<p style="font-family:'EB Garamond',serif;color:#7A6E5C;font-size:15px;letter-spacing:.08em">Preparing audio…</p>`,error_message:`<p style="color:#C05858;font-family:'EB Garamond',serif">Audio failed to load. Check that the stimuli/ folder is present.</p>`}),t.push({type:f,stimulus:`
      <h2>Speech Perception Study</h2>
      <div style="text-align:left;max-width:600px;margin:0 auto;line-height:1.8">
        <p>In this study you will listen to short spoken words and answer memory questions.
           The study takes about <strong>15–20 minutes</strong>.</p>
        <p><strong>Requirements:</strong> fluent English speaker, quiet environment,
           <strong>headphones strongly recommended</strong>.</p>
        <p>Your responses are anonymous. You may stop at any time by closing this page.</p>
        <p>By clicking below you confirm you have read this and agree to participate.</p>
      </div>
    `,choices:["I consent — begin"],data:{task:"consent"}}),t.push({type:j,preamble:'<h3>About You</h3><p style="color:#7A6E5C;font-size:.95em;margin-bottom:8px">A few background questions before we begin.</p>',html:`
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
    `,button_label:"Continue",data:{task:"demographics"}}),t.push({type:f,stimulus:`
      <h3>Volume Check</h3>
      <p>Headphones or earphones are strongly recommended.</p>
      <p>Press Play and <strong>adjust your volume</strong> until the voice sounds
         <strong>clear and comfortable</strong> — not too quiet, not too loud.</p>
      <audio controls style="margin:24px auto">
        <source src="${C}stimuli/volume_check.wav" type="audio/wav">
      </audio>
      <p style="color:var(--muted);font-size:.9em">
        This is the same voice you will hear throughout the study.
      </p>
    `,choices:["Voice is clear — continue"],data:{task:"volume_check"}}),t.push({type:w,stimulus(){var n;const e=(n=p.data.get().filter({task:"demographics"}).values()[0])==null?void 0:n.response;return`
        <h3>Environment Check</h3>
        <p style="max-width:480px;margin:0 auto .8em">
          We will briefly measure your ambient noise level via microphone.<br>
          <span style="color:var(--muted);font-size:.9em">No audio is recorded — only a single number.</span>
        </p>
        ${(e==null?void 0:e.audio_device)==="anc"?`<p style="color:var(--green);font-size:.88em;margin:.4em auto;max-width:420px">
             Noise-cancelling device detected — your actual listening environment is likely better than the room measurement.
           </p>`:""}
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
        </div>`},choices:"NO_KEYS",trial_duration:4500,data:{task:"noise_check"},on_load(){requestAnimationFrame(()=>{const e=document.getElementById("noise-bar");e&&(e.style.width="100%")}),K(3e3).then(({rms:e,dbfs:s,dbfs_samples:i})=>{const n=document.getElementById("noise-status");if(n){const c=s>-30?"Noisy":s>-45?"Moderate":"Quiet";n.innerHTML=`<span style="color:var(--accent)">${s}&thinsp;dBFS</span><span style="color:var(--muted);font-size:.8em;margin-left:12px">${c}</span>`}p.data.addProperties({ambient_noise_dbfs:s,ambient_noise_rms:e,ambient_noise_samples:JSON.stringify(i)})}).catch(e=>{const s=document.getElementById("noise-status");s&&(s.innerHTML=`<span style="color:var(--muted);font-size:.9em">Mic unavailable (${e.name})</span>`),p.data.addProperties({ambient_noise_dbfs:null,ambient_noise_rms:null})})}});const o=-24,l=-18;t.push({timeline:[{type:f,stimulus(){var i;const e=(i=p.data.get().filter({task:"noise_check"}).values()[0])==null?void 0:i.ambient_noise_dbfs,s=e>l;return`
          <h3 style="color:${s?"var(--red)":"var(--accent)"}">
            ${s?"⚠ Environment too noisy":"⚠ Somewhat noisy"}
          </h3>
          <p style="max-width:480px;margin:0 auto">
            Your measured noise level is
            <strong style="font-family:var(--mono)">${e}&thinsp;dBFS</strong>.
            ${s?"This is likely to interfere with the audio task. <strong>Please find a quieter environment</strong>, then reload the page to start again.":"This may slightly affect the audio task. A quieter environment is recommended."}
          </p>
          <p style="color:var(--muted);font-size:.88em;margin-top:12px">
            ${s?"You may still continue, but your data quality may be affected.":"You may continue if you cannot find a quieter spot."}
          </p>
        `},choices(){var s;return((s=p.data.get().filter({task:"noise_check"}).values()[0])==null?void 0:s.ambient_noise_dbfs)>l?["Continue anyway","Exit and retry"]:["Continue","I'll find a quieter place first"]},data:{task:"noise_gate"},on_finish(e){var i;const s=(i=p.data.get().filter({task:"noise_check"}).values()[0])==null?void 0:i.ambient_noise_dbfs;e.noise_level=s,e.noise_hard_warning=s>l,e.chose_to_continue=e.response===0,e.chose_to_continue||p.endExperiment("You can reload the page when you are in a quieter environment.")}}],conditional_function(){var i,n;const e=(i=p.data.get().filter({task:"noise_check"}).values()[0])==null?void 0:i.ambient_noise_dbfs;if(e==null||e<=o)return!1;const s=(n=p.data.get().filter({task:"demographics"}).values()[0])==null?void 0:n.response;return(s==null?void 0:s.audio_device)!=="anc"}}),t.push({type:f,stimulus:`
      <span class="part-chip">Part 1 of 3</span>
      <h3>Word Recognition</h3>
      <p>A string of letters will appear. Decide: <strong>is it a real English word?</strong></p>
      <p>Press <strong>YES</strong> or <strong>NO</strong> as quickly as you can. Go with your first instinct.</p>
      <p>If you are sure a word exists even if you don't know its exact meaning, press YES.<br>
         This test uses <strong>British spelling</strong> (e.g. <em>savoury</em>, not <em>savory</em>).</p>
      <p style="color:#7A6E5C;font-size:.9em">Three practice items with feedback first. &nbsp;≈ 3 minutes total.</p>
    `,choices:["Start"],data:{task:"lextale_instructions"}});for(const e of F){t.push({type:f,stimulus:`<div class="lextale-word">${e.w}</div>`,choices:["YES — real word","NO — not a word"],data:{task:"lextale_practice",word:e.w,is_word:e.real},on_finish(i){i.correct=i.response===0===e.real}});const s=e.real?"YES — real word":"NO — not a word";t.push({type:w,stimulus(){return p.data.get().last(1).values()[0].correct?`<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`:`<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">✗ The answer was <strong>${s}</strong></p>`},choices:"NO_KEYS",trial_duration:1400})}t.push({type:f,stimulus:'<p style="font-size:1.1em">Practice done. <strong>No more feedback</strong> in the real test.</p>',choices:["Start test"],data:{task:"lextale_practice_end"}});for(const e of D(J))t.push({type:f,stimulus:`<div class="lextale-word">${e.w}</div>`,choices:["YES — real word","NO — not a word"],data:{task:"lextale",word:e.w,is_word:e.real},on_finish(s){s.correct=s.response===0===e.real}});t.push({type:f,stimulus:`
      <span class="part-chip">Part 2 of 3</span>
      <h3>Number Memory</h3>
      <p>You will <strong>hear</strong> a sequence of digits spoken one at a time.</p>
      <p>After the last one, <strong>type them all back in order</strong>.</p>
      <p>Sequences get longer as you go. Do your best. &nbsp;<span style="color:#7A6E5C;font-size:.9em">≈ 5 minutes.</span></p>
    `,choices:["Start"],data:{task:"digit_span_instructions"}});const h=1,E=12,m={firstError:null,finalLen:null,errorsNow:0,stop:!1},N=`<input name="recall" type="text" inputmode="numeric"
    autocomplete="off" placeholder="e.g. 4 7 2">`;function T(e){const s=[];for(let i=0;i<2;i++){const n=U(e),c=n.join("");for(let r=0;r<n.length;r++)s.push({type:B,stimulus:`${C}stimuli/digit_${n[r]}.wav`,choices:"NO_KEYS",trial_ends_after_audio:!0,prompt:`<p class="listen-indicator">digit ${r+1} of ${n.length}</p>`,data:{task:"digit_display",digit:n[r],position:r,seq_len:e,trial_n:i}});s.push({type:j,preamble:'<p style="font-size:1.05em;margin-bottom:18px">Type the digits you heard, <em>in order</em>:</p>',html:N,button_label:"Submit",data:{task:"digit_recall",target:c,seq_len:e,trial_n:i},on_load(){const r=document.querySelector('input[name="recall"]');r&&r.focus()},on_finish(r){const u=(r.response.recall||"").replace(/\s+/g,"");r.correct=u===c,r.response_cleaned=u,r.correct||(m.firstError===null&&(m.firstError=e),m.errorsNow++,m.errorsNow>=2&&(m.finalLen=e,m.stop=!0,p.data.addProperties({digit_span_first_error:m.firstError,digit_span_final:m.finalLen})))}})}return{timeline:s,conditional_function(){return m.errorsNow=0,!m.stop}}}for(let e=h;e<=E;e++)t.push(T(e));t.push({type:w,stimulus:"",choices:"NO_KEYS",trial_duration:1,on_start(){m.stop||p.data.addProperties({digit_span_first_error:m.firstError,digit_span_final:null})}}),t.push({type:f,stimulus:`
      <span class="part-chip">Part 3 of 3</span>
      <h3>Syllable Memory</h3>
      <p>You will hear a short sequence of nonsense syllables, one at a time.</p>
      <p>Then answer <strong>9 yes/no questions</strong>: did you hear each syllable in the list?</p>
      <p>Focus on the sounds — the beginning <em>and</em> the end of each syllable matter.</p>
      <p style="color:#7A6E5C;font-size:.9em">Short practice with feedback first. Take a moment to rest before starting.</p>
    `,choices:["I am ready — start practice"],data:{task:"main_instructions"}});const S=G(2);for(let e=0;e<S.length;e++){const{seq:s,probes:i,condition:n}=S[e];t.push({type:f,stimulus:`<p style="color:var(--muted);font-size:.9em;margin-bottom:8px">Practice trial ${e+1} of ${S.length}</p>
                 <p>Press when ready to listen.</p>`,choices:["▶  Ready"],data:{task:"practice_ready",condition:n}});for(let c=0;c<s.length;c++)t.push({type:B,stimulus:s[c].audio,choices:"NO_KEYS",trial_ends_after_audio:!0,prompt:`<p class="listen-indicator">syllable ${c+1} of ${s.length} — listen</p>`,data:{task:"practice_listen",seq_pos:c,item_id:s[c].id,condition:n}}),c<s.length-1&&t.push({type:w,stimulus:'<p class="iti-cross">·</p>',choices:"NO_KEYS",trial_duration:600});for(const c of i){const r=c;t.push({type:f,stimulus:`
          <p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
          <div class="lextale-word">/${r.id}/</div>
        `,choices:["Yes — I heard it","No — I did not hear it"],button_html:['<button class="jspsych-btn choice-btn">%choice%</button>','<button class="jspsych-btn choice-btn">%choice%</button>'],data:{task:"practice_response",probe_id:r.id,in_list:r.in_list,foil_type:r.foil_type,condition:r.condition},on_finish(g){g.correct=g.response===0===r.in_list}});const u=c.in_list;t.push({type:w,stimulus(){return p.data.get().last(1).values()[0].correct?`<p style="font-size:1.4em;color:#5BA97A;font-family:'EB Garamond',serif">✓ Correct!</p>`:`<p style="font-size:1.4em;color:#C05858;font-family:'EB Garamond',serif">
                 ✗ ${u?"That syllable was in the list.":"That syllable was not in the list."}
               </p>`},choices:"NO_KEYS",trial_duration:1200})}t.push({type:w,stimulus:'<p class="iti-cross">·</p>',choices:"NO_KEYS",trial_duration:600})}t.push({type:f,stimulus:`
      <p style="font-size:1.15em;margin-bottom:.6em">Practice complete.</p>
      <p><strong>No feedback</strong> in the real task.</p>
      <p style="color:#7A6E5C;font-size:.9em;margin-top:12px">
        7 blocks of 4 trials — you can rest between any blocks.<br>
        Take a moment now before starting.
      </p>
    `,choices:["I am rested — begin Block 1"],data:{task:"practice_end"}});const d=V();function _(e,s,i){const{seq:n,probes:c,condition:r}=e;t.push({type:f,stimulus:`<p style="color:var(--muted);font-size:.88em;margin-bottom:12px">
                   Block ${s} of ${d.length} &nbsp;·&nbsp; Trial ${i+1} of ${d[s-1].length}
                 </p>
                 <p>Press when ready to listen to the next sequence.</p>`,choices:["▶  Ready"],data:{task:"trial_ready",block:s,trial_n:i,condition:r}});for(let u=0;u<n.length;u++)t.push({type:B,stimulus:n[u].audio,choices:"NO_KEYS",trial_ends_after_audio:!0,prompt:`<p class="listen-indicator">syllable ${u+1} of ${n.length}</p>`,data:{task:"main_listen",block:s,trial_n:i,seq_pos:u,item_id:n[u].id,condition:r}}),u<n.length-1&&t.push({type:w,stimulus:'<p class="iti-cross">·</p>',choices:"NO_KEYS",trial_duration:600});for(let u=0;u<c.length;u++){const g=c[u];t.push({type:f,stimulus:`
          <p style="font-size:1em;color:var(--muted);margin-bottom:20px">Did you hear this syllable in the list?</p>
          <div class="lextale-word">/${g.id}/</div>
        `,choices:["Yes — I heard it","No — I did not hear it"],button_html:['<button class="jspsych-btn choice-btn">%choice%</button>','<button class="jspsych-btn choice-btn">%choice%</button>'],data:{task:"main_response",block:s,trial_n:i,probe_n:u,probe_id:g.id,in_list:g.in_list,foil_type:g.foil_type,condition:g.condition,onset_n:g.onset_n,coda_n:g.coda_n},on_finish(x){x.correct=x.response===0===g.in_list}})}t.push({type:w,stimulus:'<p class="iti-cross">+</p>',choices:"NO_KEYS",trial_duration:700})}for(let e=0;e<d.length;e++){e>0&&t.push({type:f,stimulus:`
          <h3>Block ${e} complete</h3>
          <p>${d.length-e} block${d.length-e>1?"s":""} remaining.</p>
          <p style="color:#7A6E5C;font-size:.9em">Take as long as you need to rest.</p>
        `,choices:[`Continue to Block ${e+1}`],data:{task:"block_break",block:e}});for(let s=0;s<d[e].length;s++)_(d[e][s],e+1,s)}return t.push({type:f,stimulus:`
      <h3>Study Complete</h3>
      <p>Thank you for participating.</p>
      <p>Clicking below will download your results as a CSV file.<br>
         Please send the file to the researcher.</p>
    `,choices:["Download my results"],data:{task:"end"}}),t}const Z="187294d3-4dcb-4a54-96ff-006c01d6f8a6",O=Math.random().toString(36).slice(2,8),k=W({on_trial_finish(){const p=k.getProgress().percent_complete,t=document.getElementById("exp-fill");t&&(t.style.width=p+"%")},on_finish(){var E,m;const p=k.data.get().csv(),t=k.data.get().filter({task:["main_response","digit_recall","lextale"]}).ignore("stimulus").csv();fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({access_key:Z,subject:`Phon Experiment — ${O} completed`,from_name:"Phon Experiment",participant_id:O,noise_dbfs:((E=k.data.get().values()[0])==null?void 0:E.ambient_noise_dbfs)??null,digit_span:((m=k.data.get().values()[0])==null?void 0:m.digit_span_final)??null,response_rows:t})}).catch(()=>{});const o=new Blob([p],{type:"text/csv"}),l=URL.createObjectURL(o),h=document.createElement("a");h.href=l,h.download=`phon_exp_${O}.csv`,document.body.appendChild(h),h.click(),document.body.removeChild(h)}});k.data.addProperties({participant_id:O});k.run(Q(k));
