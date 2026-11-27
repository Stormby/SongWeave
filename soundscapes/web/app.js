(()=>{
  const el=id=>document.getElementById(id),bridge=window.__JUCE__?.backend;
  const emit=(type,data={})=>bridge?.emitEvent('songweave',{type,...data});
  const say=s=>el('status').textContent=s;
  const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
  let p={version:1,library:'NADA',style:0,seed:seed(),variety:50,pulse:false,hit:60};
  let song,reference,midiData,scope=-1,route='internal',ready=false,epoch=0,playing=false,waiting=false,slot=0;
  let mute=SC.parts.map(()=>false),solo=mute.slice(),history=[];
  const flags=a=>Array.isArray(a)&&a.length===6&&a.every(x=>typeof x==='boolean')?a:SC.parts.map(()=>false);
  const active=r=>!mute[r]&&(!solo.some(Boolean)||solo[r]);
  const mask=()=>SC.parts.reduce((m,_,r)=>active(r)?m|(1<<r):m,0);
  const encode=b=>{let s='';for(let j=0;j<b.length;j+=8192)s+=String.fromCharCode(...b.subarray(j,j+8192));return btoa(s);};
  const state=()=>({project:p,scope,output:route,mute,solo,channels:SC.channels});
  function restore(s){
    if(!SC.valid(s.project))throw Error('Choose a Soundscapes project.');
    p=s.project;scope=Number.isInteger(s.scope)&&s.scope>=0&&s.scope<6?s.scope:-1;
    mute=flags(s.mute);solo=flags(s.solo);route=['virtual','vst'].includes(s.output)?s.output:'internal';
  }
  function stop(){if(playing)emit('stop');playing=waiting=false;el('play').textContent='Preview';}
  function checkpoint(){history.push({...p});if(history.length>16)history.shift();stop();}
  function file(r){
    const name=[p.library,SC.names[p.style],p.seed.toString(16),scope<0?'60min':SC.chapters[scope],r<0?'All':SC.parts[r]].join('-').replace(/[^a-zA-Z0-9_-]+/g,'_')+'.mid';
    return {name,data:encode(SC.midi(song,r,scope))};
  }
  function mix(){
    emit('mask',{mask:mask()});
    const s=state();if(route!=='internal'){
      if(reference!==song){midiData=encode(SC.midi(song));reference=song;}s.midiData=midiData;
    }
    if(ready)emit('state',{epoch,json:JSON.stringify(s)});
  }
  function routing(){
    const port='SongWave Soundscapes'+(slot>1?' '+slot:'');
    el('routing').textContent='For Engine Player 1.7, select virtual MIDI above. Enable Track for the '+port+' inputs in Live. Load one Engine instance on each receiving MIDI track, select its matching input and set Monitor to In. Play from the start of the Arrangement or use Preview with Live stopped.';
  }
  function render(recompose=true){
    if(recompose)song=SC.compose(p);
    const options=SC.libs[p.library][0];
    el('lib').value=p.library;el('style').replaceChildren(...options.map(i=>new Option(SC.names[i],i)));
    el('style').value=p.style;el('route').value=route;el('variety').value=p.variety;el('varval').textContent=p.variety+'%';
    el('desc').textContent=SC.styles[SC.names[p.style]][3];el('undo').disabled=!history.length;
    el('pulse').disabled=!song.inst[5];el('pulse').checked=p.pulse;el('hit').value=p.hit;
    el('tech').textContent=[3,4].includes(p.style)?'Melody uses MIDI pitch bend. Set the solo patch to ±2 semitones, equal temperament, and turn down automatic ornaments to hear the written tuning and slides.':
      p.library==='ERA II Vocal Codex'?'Use playable sustained vowels on the vocal lanes. Select a quiet soundscape for each background layer.':
      'Choose playable sustained articulations for winds and voices. Where a lane lists Soundscapes, Drones or Pads, choose a quiet patch in that category.';
    const [lo,hi]=SC.range(scope);el('scope').textContent=scope<0?'Whole hour':'Minutes '+scope*10+'–'+(scope+1)*10;
    el('progress').value=lo/SC.total;el('chapters').replaceChildren();
    ['Whole hour',...SC.chapters].forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.setAttribute('aria-pressed',scope===i-1);
      b.onclick=()=>{stop();scope=i-1;render(false);};el('chapters').append(b);});
    el('lanes').replaceChildren();
    SC.parts.forEach((name,r)=>{
      const row=document.createElement('div');row.className='row';
      const label=document.createElement('b'),patch=document.createElement('span');label.textContent=name;
      patch.textContent=(r===5&&!p.pulse?'Off':song.inst[r]||'Unused')+' · Ch '+SC.channels[r];
      const canvas=document.createElement('canvas');canvas.width=210;canvas.height=20;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#a4c8b5';
      for(const n of song.tracks[r])if(n.t<hi&&n.t+n.d>lo)ctx.fillRect((n.t-lo)/(hi-lo)*210,(85-n.n)%15,Math.max(1,n.d/(hi-lo)*210),3);
      row.append(label,patch,canvas);
      for(const [title,arr] of [['Solo',solo],['Mute',mute],['MIDI',null]]){
        const b=document.createElement('button');b.textContent=title;b.disabled=!song.tracks[r].length;
        if(arr)b.setAttribute('aria-pressed',arr[r]);b.onclick=()=>{if(!arr){emit('save',file(r));return;}arr[r]=!arr[r];b.setAttribute('aria-pressed',arr[r]);mix();};row.append(b);
      }
      el('lanes').append(row);
    });
    routing();mix();
    if(ready)emit('cache',{files:[-1,0,1,2,3,4,5].map(r=>r>=0&&!song.tracks[r].length?{name:'',data:''}:file(r))});
  }
  Object.keys(SC.libs).forEach(name=>el('lib').add(new Option(name,name)));
  el('lib').onchange=()=>{checkpoint();p.library=el('lib').value;const ids=SC.libs[p.library][0];p.style=ids.includes(p.style)?p.style:ids[0];p.pulse=p.style===8;p.seed=seed();render();};
  el('style').onchange=()=>{checkpoint();p.style=Number(el('style').value);p.seed=seed();p.pulse=p.style===8;render();};
  el('pulse').onchange=()=>{checkpoint();p.pulse=el('pulse').checked;render();};
  el('hit').onchange=()=>{const v=Number(el('hit').value);if(Number.isInteger(v)&&v>=0&&v<=127){checkpoint();p.hit=v;}render();};
  el('route').onchange=()=>{stop();route=el('route').value;render(false);};
  el('variety').oninput=()=>{el('varval').textContent=el('variety').value+'%';};
  el('variety').onchange=()=>{checkpoint();p.variety=Number(el('variety').value);render();};
  el('new').onclick=()=>{checkpoint();p.seed=seed();render();};el('undo').onclick=()=>{stop();p=history.pop();render();};
  el('export').onclick=()=>emit('save',file(-1));
  el('save').onclick=()=>emit('save',{name:'Soundscapes-'+p.seed.toString(16)+'.swscape',data:encode(new TextEncoder().encode(JSON.stringify(state())))});
  el('open').onclick=()=>emit('open');
  el('play').onclick=()=>{
    if(playing){stop();return;}
    const [lo,hi]=SC.range(scope),events=song.tracks.flat().filter(n=>n.t<hi&&n.t+n.d>lo).map(n=>({...n,t:Math.max(lo,n.t)-lo,d:Math.min(hi,n.t+n.d)-Math.max(lo,n.t)}));
    playing=waiting=true;el('play').textContent='Stop';emit('play',{events,from:lo,length:hi-lo,bpm:60,sync:false,mask:mask()});
  };
  if(bridge){
    const on=(id,fn)=>bridge.addEventListener(id,fn);
    on('swInit',m=>{stop();epoch=m.epoch??0;if(m.state){try{restore(JSON.parse(m.state));}catch(e){say(e.message);}}ready=true;render();});
    on('swStarted',()=>{waiting=false;});
    on('swClock',m=>{if(slot!==m.portSlot){slot=m.portSlot;routing();}if(m.portError)say('Virtual MIDI ports could not open. Select another output, then retry.');
      if(playing&&!waiting){el('progress').value=(SC.range(scope)[0]+m.tick)/SC.total;if(!m.playing)stop();}});
    on('swFile',m=>{try{const s=JSON.parse(m.data);if(!SC.valid(s.project))throw Error('Choose a Soundscapes project.');checkpoint();restore(s);render();}catch(e){say(e.message);}});
    on('swMessage',m=>say(m.text));emit('ready');
  }else render();
})();
