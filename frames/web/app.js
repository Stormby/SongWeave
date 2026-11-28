(()=>{
  const el=id=>document.getElementById(id),bridge=window.__JUCE__?.backend;
  const emit=(type,data={})=>bridge?.emitEvent('songweave',{type,...data});
  const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
  const encode=bytes=>{
    let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(s);
  };
  const flags=a=>Array.isArray(a)&&a.length===6&&a.every(x=>typeof x==='boolean')?a:[false,false,false,false,false,false];
  const mask=()=>F.parts.reduce((bits,_,i)=>!mute[i]&&(!solo.some(Boolean)||solo[i])?bits|(1<<i):bits,0);
  const say=s=>{el('status').textContent=s;};
  let p={...F.defaults(),seed:seed(),melody:seed()},song,files,epoch=0,ready=false,scope=-1,route='internal',slot=1;
  let mute=flags(),solo=flags(),takes=[],index=-1,playing=false,waiting=false,start=0;
  const history=[],channels=[1,2,3,4,5,6];
  const state=()=>({project:p,output:route,mute,solo,channels});
  function mix(){
    emit('mask',{mask:mask()});
    if(ready)emit('state',{epoch,json:JSON.stringify({...state(),midiData:route==='internal'?'':files[0].data})});
  }
  function stop(){if(playing)emit('stop');playing=waiting=false;el('play').textContent='Preview';}
  function resetTakes(){takes=[];index=-1;}
  function edit(changes){
    stop();history.push(p);if(history.length>24)history.shift();
    p={...p,...changes};resetTakes();render();
  }
  function restore(s){
    if(!F.valid(s.project))throw Error('Choose a SongWave Frames project.');
    stop();resetTakes();scope=-1;p=s.project;mute=flags(s.mute);solo=flags(s.solo);
    route=['virtual','vst'].includes(s.output)?s.output:'internal';
  }
  function button(title,action){
    const b=document.createElement('button');b.textContent=title;b.onclick=action;return b;
  }
  function options(id,names,values){names.forEach((name,i)=>el(id).add(new Option(name,values?values[i]:i)));}
  function file(lane){
    const name=[p.theme,p.seed.toString(16),p.melody.toString(16),F.parts[lane]||'All'].join('-')+'.mid';
    return {name,data:lane>=0&&!song.tracks[lane].length?'':encode(F.midi(song,lane))};
  }
  function showTakes(){
    el('prev').disabled=index<1;el('replay').disabled=el('apply').disabled=index<0;
    el('take').textContent=index>=0?'Take '+(index+1)+' · audition':'Keep the backing while trying a new phrase.';
  }
  function instructions(){
    const port='SongWave Frames'+(slot>1?' '+slot:'');
    el('routing').textContent='Select virtual MIDI, then enable Track for the '+port+' inputs in Live. Load a piano on one MIDI track and a Kontakt 8 FRAMES instance on each additional track. Choose the matching input on each and set Monitor to In. Stop Live to audition here, or play from bar 1 in Arrangement at '+song.bpm+' BPM.';
  }
  function sectionButtons(){
    const buttons=['Whole song',...song.sections.map(x=>x.name)].map((name,i)=>{
      const b=button(name,()=>{stop();scope=i-1;firstBar=0;sectionButtons();drawRoll(song);});b.setAttribute('aria-pressed',scope===i-1);return b;
    });el('chapters').replaceChildren(...buttons);
    el('progress').value=(scope<0?0:song.sections[scope].bar)/song.bars;
  }
  const colours=['#efc996','#89c8bc','#a2acd9','#8cabbe','#bf9999','#b7c790'];
  let focus=-1,firstBar=0,zoom=0,displayScore;
  function drawRoll(score=displayScore||song){
    displayScore=score;
    const canvas=el('roll'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,left=43;
    const begin=scope<0?0:score.sections[scope].bar,end=scope<0||scope===5?score.bars:score.sections[scope+1].bar;
    const span=Math.min(zoom||end-begin,end-begin);firstBar=Math.max(begin,Math.min(firstBar,end-span));
    const from=firstBar*score.barTicks,to=(firstBar+span)*score.barTicks;
    const visible=score.tracks.flatMap((notes,i)=>focus<0||focus===i?notes.filter(n=>n.t<to&&n.t+n.d>from):[]);
    let low=36,high=84;if(visible.length){low=127;high=0;for(const n of visible){low=Math.min(low,n.n);high=Math.max(high,n.n);}
      low=Math.max(0,12*Math.floor((low-1)/12));high=Math.min(127,12*Math.ceil((high+1)/12));}
    const y=n=>9+(high-n)/(high-low)*(h-29);
    ctx.fillStyle='#171d23';ctx.fillRect(0,0,w,h);ctx.font='12px sans-serif';
    for(let n=low;n<=high;n+=12){ctx.fillStyle='#364048';ctx.fillRect(left,y(n),w-left,1);ctx.fillStyle='#b8c2c6';ctx.fillText('C'+(n/12-2),6,y(n)+4);}
    const stride=Math.max(1,Math.ceil(span/8));
    for(let b=0;b<span;b+=stride){const x=left+b/span*(w-left);ctx.fillStyle='#30383e';ctx.fillRect(x,4,1,h-23);ctx.fillStyle='#9aa6ac';ctx.fillText(String(firstBar+b+1),x+3,h-3);}
    for(const n of visible){const x=left+(Math.max(from,n.t)-from)/(to-from)*(w-left);
      ctx.fillStyle=colours[n.r];ctx.fillRect(x,y(n.n)-1,Math.max(1,(Math.min(to,n.t+n.d)-Math.max(n.t,from))/(to-from)*(w-left)),3);}
    if(!visible.length){ctx.fillStyle='#e3d9cf';ctx.fillText('No notes in this view',w/2-58,h/2);}
    el('back').disabled=firstBar<=begin;el('forward').disabled=firstBar+span>=end;
    el('rollinfo').textContent=(focus<0?'All instruments':F.parts[focus])+' · Bars '+(firstBar+1)+'–'+(firstBar+span)+(score!==song?' · Melody audition':'');
  }
  el('zoom').onchange=()=>{zoom=Number(el('zoom').value);drawRoll();};
  el('view').onchange=()=>{focus=Number(el('view').value);drawRoll();};
  options('view',['All instruments',...F.parts],[-1,0,1,2,3,4,5]);
  el('back').onclick=()=>{firstBar-=zoom;drawRoll();};el('forward').onclick=()=>{firstBar+=zoom;drawRoll();};
  function lanes(){
    const patches=['Felt piano or soft upright · sustain pedal','Foundations · playable lead','Foundations · bowed or sustained source','Designed · evolving pad','Designed · low sustained texture',p.held?'Designed · rhythmic snapshot':'Foundations · short pluck'];
    el('lanes').replaceChildren();
    F.parts.forEach((name,i)=>{
      const row=document.createElement('div');row.className='row';
      const title=button(name,()=>{focus=i;el('view').value=i;drawRoll();}),patch=document.createElement('small');
      title.style.color=colours[i];const count=song.tracks[i].length;row.className+=count?'':' empty';
      patch.textContent=count?count.toLocaleString()+' notes · '+patches[i]:'No notes · empty lane';row.append(title,patch);
      const label=document.createElement('label');
      if(i){const input=document.createElement('input');input.type='range';input.min=0;input.max=100;input.value=p.depths[i];
        input.setAttribute('aria-label',name+' sound movement');const out=document.createElement('small');
        const update=()=>out.textContent=Number(input.value)===0?'Still':Number(input.value)<45?'Subtle':Number(input.value)<75?'Gentle':'Strong';update();input.oninput=update;
        input.disabled=!count;input.onchange=()=>{const depths=p.depths.slice();depths[i]=Number(input.value);edit({depths});};label.append(input,out);
      }else label.textContent=p.mode===2?'—':'Sustain pedal · auto';
      row.append(label);
      for(const [text,arr] of [['Solo',solo],['Mute',mute],['MIDI',null]]){
        const b=button(text,()=>{if(!arr){emit('save',files[i+1]);return;}arr[i]=!arr[i];b.setAttribute('aria-pressed',arr[i]);mix();});
        if(arr)b.setAttribute('aria-pressed',arr[i]);b.disabled=!song.tracks[i].length;row.append(b);
      }
      el('lanes').append(row);
    });
  }
  function render(){
    if(ready)emit('clearDrags');song=F.compose(p);files=[-1,0,1,2,3,4,5].map(file);
    for(const id of ['theme','mode','level','minutes'])el(id).value=p[id];
    el('held').checked=p.held;el('route').value=route;el('undo').disabled=!history.length;
    el('time').textContent=p.minutes+':00 · '+song.bpm+' BPM';el('cue').textContent=F.themes[p.theme].cue;
    el('patches').textContent=F.themes[p.theme].sound;
    sectionButtons();drawRoll(song);lanes();instructions();showTakes();mix();if(ready)emit('cache',{files});
  }
  function preview(score,lo,hi,draft){
    stop();start=lo;firstBar=Math.floor(lo/score.barTicks);drawRoll(score);
    const pedal=score.cc[0],ends=new Map();
    // Extend sketch piano voices through pedal-up. Routed MIDI uses the recorded CC64.
    if(route==='internal'){
      let up=0;
      for(let i=pedal.length-1;i>=0;i--){if(pedal[i].v<64)up=pedal[i].t;else ends.set(pedal[i].t,up);}
    }
    const events=[];
    for(const lane of score.tracks)for(const n of lane){
      if(n.t>=hi)break;let end=n.t+n.d;
      if(n.r===0&&ends.size){
        let a=0,b=pedal.length;while(a<b){const m=(a+b)>>1;if(pedal[m].t<=end)a=m+1;else b=m;}
        if(a&&pedal[a-1].v>=64)end=Math.max(end,ends.get(pedal[a-1].t)||0);
      }
      if(end>lo)events.push({...n,t:Math.max(n.t,lo)-lo,d:Math.min(hi,end)-Math.max(n.t,lo)});
    }
    playing=waiting=true;el('play').textContent='Stop';
    const movement=[];
    if(route==='internal')score.cc.forEach((controls,r)=>{
      if(!r)return;let initial=0;
      for(const c of controls){if(c.t<=lo){initial=c.v;continue;}if(c.t>=hi)break;movement.push([c.t-lo,r,c.v]);}
      movement.push([0,r,initial]);
    });
    emit('play',{movement,events,from:lo,length:hi-lo,bpm:score.bpm,sync:false,mask:mask(),previewMidi:draft&&route!=='internal'?encode(F.midi(score)):''});
  }
  function hear(){
    const score=F.compose({...p,melody:takes[index]});
    const lo=score.sections[scope<0?1:scope].bar*song.barTicks;
    preview(score,lo,Math.min(score.total,lo+score.bpm/2*480),true);showTakes();
  }
  for(const [label,names] of [['Themes',Object.keys(F.themes).slice(0,8)],['Composer inspirations',Object.keys(F.themes).slice(8).sort((a,b)=>a.localeCompare(b))]]){
    const group=document.createElement('optgroup');group.label=label;for(const n of names)group.append(new Option(n,n));el('theme').append(group);
  };options('mode',F.modes);options('level',F.levels);
  const mins=Array.from({length:60},(_,i)=>i+1);options('minutes',mins.map(x=>x+' min'),mins);
  for(const id of ['theme','mode','level','minutes'])el(id).onchange=()=>{
    if(id==='theme'){
      const theme=el(id).value,voice=F.themes[theme].voice;
      edit({theme,held:!['chimes','interlock','mallet','waltz'].includes(voice)});
    }else edit({[id]:Number(el(id).value)});
  };
  el('held').onchange=()=>edit({held:el('held').checked});
  el('new').onclick=()=>{scope=-1;firstBar=0;edit({seed:seed(),melody:seed()});preview(song,0,song.total,false);};
  el('undo').onclick=()=>{if(history.length){stop();p=history.pop();resetTakes();render();}};
  el('mel').onclick=()=>{takes.splice(index+1);takes.push(seed());if(takes.length>64)takes.shift();index=takes.length-1;hear();};
  el('prev').onclick=()=>{if(index>0){index--;hear();}};el('replay').onclick=hear;
  el('apply').onclick=()=>{if(index>=0){edit({melody:takes[index]});say('Melody applied to the full song.');}};
  el('play').onclick=()=>{if(playing){stop();drawRoll(song);return;}const lo=scope<0?0:song.sections[scope].bar*song.barTicks;
    const hi=scope<0||scope===5?song.total:song.sections[scope+1].bar*song.barTicks;preview(song,lo,hi,false);};
  el('route').onchange=()=>{stop();route=el('route').value;mix();};
  el('export').onclick=()=>emit('save',files[0]);el('open').onclick=()=>emit('open');
  el('save').onclick=()=>emit('save',{name:'SongWave-Frames-'+p.seed.toString(16)+'.swframes',data:encode(new TextEncoder().encode(JSON.stringify(state())))});
  if(bridge){
    bridge.addEventListener('swInit',m=>{stop();epoch=m.epoch??0;if(m.state){try{restore(JSON.parse(m.state));}catch(e){say(e.message);}}ready=true;render();});
    bridge.addEventListener('swStarted',()=>{waiting=false;});
    bridge.addEventListener('swClock',m=>{if(slot!==m.portSlot){slot=m.portSlot;instructions();}
      if(m.portError)say('Virtual ports could not open. Switch output and try again.');
      if(playing&&!waiting){el('progress').value=(start+m.tick)/song.total;if(!m.playing){stop();drawRoll(song);}}});
    bridge.addEventListener('swMessage',m=>say(m.text));
    bridge.addEventListener('swFile',m=>{try{restore(JSON.parse(m.data));history.length=0;render();}catch(e){say(e.message);}});emit('ready');
  }else render();
})();
