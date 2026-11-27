(() => {
  'use strict';
  const $=id=>document.getElementById(id), bridge=window.__JUCE__?.backend, colors=['#e8c88f','#b6ca9e','#9ab9d2','#cfb1cc'];
  const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
  const fresh=()=>SW.project(SW.defaults(),seed());
  const emit=(type,body={})=>bridge?.emitEvent('songweave',{type,...body});
  let p=fresh(),song,scope=-1,history=[],mute=[false,false,false,false],solo=[false,false,false,false],hostTempo=0;
  let ready=!bridge,playing=false,awaitingPreview=false,epoch=0,cacheTimer,context,timer,playFrom=0,playTo=0,startTime=0,clock=0,position=0,queue=[],index=0;
  const active=new Set(), native=Boolean(bridge);
  const bpm=()=>native&&$('sync').checked&&hostTempo>0?hostTempo:p.config.bpm;
  const audible=r=>!mute[r]&&(!solo.some(Boolean)||solo[r]);
  const status=s=>$('status').textContent=s;
  const options=(id,items)=>items.forEach((v,i)=>$(id).add(new Option(v,id==='key'?i:v)));
  options('genre',Object.keys(SW.styles));options('key',SW.keys);options('mode',Object.keys(SW.scales));
  options('meter',Object.keys(SW.meters));options('form',Object.keys(SW.forms));options('bars',[32,64,96,128]);
  $('syncWrap').style.display=native?'flex':'none';
  function remember(){history.push(JSON.stringify(p));if(history.length>24)history.shift();}
  function stored(){return JSON.stringify({project:p,sync:$('sync').checked,scope,mute,solo});}
  function persist(){
    if(!ready)return;
    if(native)emit('state',{json:stored(),epoch});else try{localStorage.setItem('songweave.v1',stored());}catch{}
  }
  function restore(data){
    const saved=typeof data==='string'?JSON.parse(data):data, item=saved?.project??saved;
    if(!SW.valid(item))throw Error('This file is not a supported Songweave project.');
    p=item;scope=Number.isInteger(saved.scope)&&saved.scope>=0&&saved.scope<SW.sections(p.config).length?saved.scope:-1;
    const flags=a=>Array.isArray(a)&&a.length===4&&a.every(x=>typeof x==='boolean')?a:[false,false,false,false];
    mute=flags(saved.mute);solo=flags(saved.solo);$('sync').checked=saved.sync!==false;
  }
  function loading(data){
    if(!data)return;
    const previous=JSON.stringify(p);
    try{restore(data);stop();history.push(previous);render();status('Project opened.');}
    catch(err){status(err.message);}
  }
  function encoded(arr){
    let out='';for(let i=0;i<arr.length;i+=8192)out+=String.fromCharCode(...arr.subarray(i,i+8192));
    return btoa(out);
  }
  const scopeName=()=>scope<0?'Whole song':song.sections[scope].name;
  const stamp=()=>p.seed.toString(16).slice(-6).padStart(6,'0');
  const fileName=(r=-1)=>[p.config.genre,SW.keys[p.config.key],p.config.mode,stamp(),scope<0?'Song':scopeName(),r<0?'All':SW.parts[r]].join('-').replace(/[^a-zA-Z0-9♯♭_-]+/g,'_')+'.mid';
  function download(bytes,name,type){
    const url=URL.createObjectURL(new Blob([bytes],{type})), a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
  }
  function saveMidi(r){
    const bytes=SW.midi(song,r,scope,bpm()),name=fileName(r);
    if(native)emit('save',{name,data:encoded(bytes)});else download(bytes,name,'audio/midi');
    if(!native)status(name+' • ready for Arrangement View.');
  }
  function cache(){
    clearTimeout(cacheTimer);
    if(!native||!ready)return;
    // Native drag handles always refer to a complete, immutable MIDI file.
    emit('clearDrags');
    cacheTimer=setTimeout(()=>{
      const files=[-1,0,1,2,3].map(r=>({name:fileName(r),data:encoded(SW.midi(song,r,scope,bpm()))}));
      emit('cache',{files});
    },45);
  }
  function summary(){
    const c=p.config, seconds=Math.round(song.total/SW.PPQ*60/bpm());
    $('summary').textContent=c.bars+' bars  ·  '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+'  ·  '+Math.round(bpm()*10)/10+' BPM';
    $('bpm').disabled=native&&$('sync').checked&&hostTempo>0;$('bpm').value=Number(bpm().toFixed(1));
  }
  function draw(canvas,r){
    const width=600,height=55;canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d'),[from,to]=SW.region(song,scope),notes=song.tracks[r].filter(n=>n.t<to&&n.t+n.d>from);
    if(!notes.length)return;
    let low=127,high=0;notes.forEach(n=>{low=Math.min(low,n.n);high=Math.max(high,n.n);});
    ctx.fillStyle=colors[r];ctx.globalAlpha=audible(r)?0.85:0.24;
    for(const n of notes){
      const begin=Math.max(n.t,from),end=Math.min(to,n.t+n.d);
      ctx.fillRect((begin-from)/(to-from)*width,5+(high-n.n)/(high-low||1)*(height-12),
        Math.max(1.5,(end-begin)/(to-from)*width),4);
    }
  }
  function setScope(next){stop();scope=next;render(false);status('Preview, Variation and MIDI export apply to '+scopeName().toLowerCase()+'.');}
  function render(recompose=true){
    if(recompose)song=SW.compose(p);
    const c=p.config;
    $('form').querySelector('[data-custom]')?.remove();$('bars').querySelector('[data-custom]')?.remove();
    if(c.layout){
      const opt=new Option('Custom','custom');opt.dataset.custom='true';$('form').add(opt);
      if(![32,64,96,128].includes(c.bars)){const length=new Option(c.bars,c.bars);length.dataset.custom='true';$('bars').add(length);}
    }
    for(const id of ['genre','key','mode','meter','bars','form'])$(id).value=c[id];
    if(c.layout)$('form').value='custom';
    $('editPanel').hidden=scope<0;
    if(scope>=0){
      const sec=song.sections[scope];$('sectionName').value=sec.name;$('sectionBars').value=sec.bars;
      $('left').disabled=scope===0;$('right').disabled=scope===song.sections.length-1;
      $('remove').disabled=song.sections.length===1;$('repeat').disabled=song.sections.length>=24||c.bars+sec.bars>256;
    }
    summary();$('sections').replaceChildren();
    song.sections.forEach((s,i)=>{
      const b=document.createElement('button');b.textContent=s.name;b.title=s.name+', bars '+(s.bar+1)+'–'+(s.bar+s.bars);
      b.style.flex=String(s.bars)+' 1 0';b.className=i===scope?'current':'';b.setAttribute('aria-pressed',i===scope);
      const range=document.createElement('small');range.textContent=(s.bar+1)+'–'+(s.bar+s.bars);b.append(range);
      b.onclick=()=>setScope(i);$('sections').append(b);
    });
    $('whole').className=scope<0?'current':'';$('scope').textContent=scopeName();
    $('selection').textContent=(scope<0?c.bars:song.sections[scope].bars)+' bars · '+SW.keys[c.key]+' '+c.mode;
    $('export').textContent=scope<0?'Export song MIDI':'Export section MIDI';
    $('variation').textContent=scope<0?'Variation':'Vary section';$('back').disabled=!history.length;
    $('variation').disabled=$('new').disabled=p.locks.every(Boolean);$('rows').replaceChildren();
    SW.parts.forEach((part,r)=>{
      const row=document.createElement('div');row.className='row';
      const b=document.createElement('b');b.textContent=part;b.style.color=colors[r];row.append(b);
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',part+' note overview');draw(canvas,r);row.append(canvas);
      function button(label,flag,action,title){
        const el=document.createElement('button');el.textContent=label;el.title=title;el.setAttribute('aria-label',title);
        if(flag!==undefined)el.setAttribute('aria-pressed',flag);el.onclick=action;row.append(el);
      }
      button('Lock',p.locks[r],()=>{p.locks[r]=!p.locks[r];render(false);},'Lock '+part+' across variations and new ideas');
      button('Solo',solo[r],()=>{solo[r]=!solo[r];mix();},'Solo '+part+' in preview');
      button('Mute',mute[r],()=>{mute[r]=!mute[r];mix();},'Mute '+part+' in preview');
      button('MIDI',undefined,()=>saveMidi(r),'Export '+part+' MIDI');$('rows').append(row);
    });
    $('play').textContent=playing?'■ Stop':'▶ Preview';
    if(!playing)$('progress').value=SW.region(song,scope)[0]/song.total;
    persist();cache();
  }
  function mix(){
    active.forEach(v=>{if(!audible(v.r))try{v.osc.stop();}catch{}});
    emit('mask',{mask:SW.parts.reduce((v,_,r)=>v|(audible(r)?1<<r:0),0)});render(false);
  }
  function stop(){
    clearInterval(timer);timer=undefined;
    active.forEach(v=>{try{v.osc.stop();}catch{}});active.clear();
    if(playing&&native)emit('stop');awaitingPreview=false;playing=false;$('play').textContent='▶ Preview';
  }
  async function preview(){
    if(playing){stop();return;}
    const [from,to]=SW.region(song,scope);
    queue=song.tracks.flatMap((track,r)=>track.filter(n=>n.t<to&&n.t+n.d>from).map(n=>({
      t:Math.max(n.t,from)-from,d:Math.min(n.t+n.d,to)-Math.max(n.t,from),n:n.n,v:n.v,r}))).sort((a,b)=>a.t-b.t);
    playFrom=from;playTo=to;index=0;clock=60/bpm()/SW.PPQ;playing=true;$('play').textContent='■ Stop';
    if(native){
      awaitingPreview=true;emit('play',{events:queue,length:to-from,bpm:bpm(),sync:$('sync').checked,
        mask:SW.parts.reduce((v,_,r)=>v|(audible(r)?1<<r:0),0)});return;
    }
    try{
      if(!context)context=new (window.AudioContext||window.webkitAudioContext)();
      await context.resume();if(!playing)return;
      startTime=context.currentTime+.045;
      const tick=()=>{
        const now=context.currentTime,elapsed=Math.max(0,now-startTime);
        position=Math.min(to,from+elapsed/clock);$('progress').value=position/song.total;
        while(index<queue.length&&startTime+queue[index].t*clock<now+.13){
          const note=queue[index++];if(!audible(note.r))continue;
          const osc=context.createOscillator(),gain=context.createGain(),t=Math.max(now,startTime+note.t*clock),d=note.d*clock;
          osc.type=['triangle','sine','triangle','sine'][note.r];osc.frequency.value=440*2**((note.n-69)/12);
          const level=[.12,.063,.115,.079][note.r]*note.v/127;
          gain.gain.setValueAtTime(.00001,t);gain.gain.linearRampToValueAtTime(level,t+Math.min(d/2,[.012,.09,.015,.005][note.r]));
          gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level*.70),t+d);
          gain.gain.exponentialRampToValueAtTime(.00001,t+d+.065);
          osc.connect(gain).connect(context.destination);const voice={osc,r:note.r};active.add(voice);
          osc.onended=()=>{active.delete(voice);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+d+.075);
        }
        if(position>=playTo)stop();
      };tick();timer=setInterval(tick,35);
    }catch(error){stop();status('Preview unavailable: '+error.message);}
  }
  for(const id of ['genre','key','mode','meter','bars','form']){
    $(id).onchange=()=>{
      const value=$(id).value;remember();stop();
      if(id==='genre'){const c=p.config;p=SW.project({...SW.defaults(value),bars:c.bars,...(c.layout?{layout:c.layout}:{})},seed());}
      else if(id==='form'||id==='bars'){
        const config={...p.config,[id]:id==='bars'?Number(value):value};delete config.layout;
        if(![32,64,96,128].includes(config.bars))config.bars=[32,64,96,128].reduce((a,b)=>Math.abs(config.bars-a)<=Math.abs(config.bars-b)?a:b);
        p=SW.project(config,p.seed);
      }else{p.config[id]=id==='key'?Number(value):value;}
      scope=-1;render();status('Arrangement updated. Back restores the previous take.');
    };
  }
  function edit(action,value){
    try{const result=SW.editSection(p,scope,action,value);stop();remember();p=result.project;scope=result.selected;render();status('Arrangement updated.');}
    catch(error){render(false);status(error.message);}
  }
  $('sectionName').onchange=()=>edit('rename',$('sectionName').value);
  $('sectionBars').onchange=()=>edit('length',$('sectionBars').value);
  for(const action of ['left','right','repeat','remove'])$(action).onclick=()=>edit(action);
  $('bpm').onchange=()=>{const n=Number($('bpm').value);if(!Number.isFinite(n)||n<20||n>400){summary();return;}
    remember();stop();p.config.bpm=n;render();};
  $('sync').onchange=()=>{stop();render(false);};
  $('play').onclick=preview;$('whole').onclick=()=>setScope(-1);
  $('new').onclick=()=>{stop();remember();p=SW.newIdea(p,seed());scope=-1;render();status('New take. Locked parts are preserved.');};
  $('variation').onclick=()=>{stop();remember();p=SW.vary(p,scope,seed());render();status('New variation of '+scopeName().toLowerCase()+'.');};
  $('back').onclick=()=>{if(history.length){stop();p=JSON.parse(history.pop());if(scope>=SW.sections(p.config).length)scope=-1;render();status('Previous take restored.');}};
  $('export').onclick=()=>saveMidi(-1);
  $('save').onclick=()=>{const data=new TextEncoder().encode(stored()),name='Songweave-'+stamp()+'.songweave';
    if(native)emit('save',{name,data:encoded(data)});else download(data,name,'application/json');};
  $('open').onclick=()=>native?emit('open'):$('file').click();
  $('file').onchange=async()=>{const f=$('file').files[0];if(f)loading(await f.text());$('file').value='';};
  if(native){
    const listen=(id,fn)=>bridge.addEventListener(id,fn);
    listen('swInit',msg=>{
      stop();history=[];epoch=msg.epoch??0;if(msg.state){try{restore(msg.state);}catch{status('The saved state could not be restored.');}}
      hostTempo=msg.bpm||0;ready=true;render();
    });
    listen('swStarted',()=>{awaitingPreview=false;});
    listen('swClock',msg=>{
      if(hostTempo!==msg.bpm){hostTempo=msg.bpm;summary();cache();}
      if(playing&&!awaitingPreview){$('progress').value=Math.min(1,(playFrom+msg.tick)/song.total);if(!msg.playing){playing=false;$('play').textContent='▶ Preview';}}
    });
    listen('swFile',msg=>loading(msg.data));listen('swMessage',msg=>status(msg.text));render();emit('ready');
  }else{
    try{const data=localStorage.getItem('songweave.v1');if(data)restore(data);}catch{}
    render();status('Select a section to preview, vary or export it. Solo and mute affect preview only.');
  }
})();
