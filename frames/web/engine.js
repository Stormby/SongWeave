const F=(()=>{
  const ppq=480,parts=['Piano','Lead','Strings','Pad','Drone','Pulse'];
  const modes=['Piano-led','Sparse piano','No piano'],levels=['Simple','Expressive','Intricate'];
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const minor=[0,2,3,5,7,8,10],dorian=[0,2,3,5,7,9,10],major=[0,2,4,5,7,9,11],lydian=[0,2,4,6,7,9,11];
  // Ordered scale degrees, not recorded phrases. Each theme separately describes
  // harmonic rhythm, attack grid, left-hand texture and orchestration.
  const themes={
    'Dark Score':{bpm:48,scale:minor,harm:[[0,5,3,4],[0,0,1,4],[0,3,5,1]],pace:2,
      hand:'noir',attacks:[.45,1.75,3.25],line:[0,-1,3,-2,-1],space:.42,swing:.16,colour:26,
      cue:'A low bass pedal, widely spaced minor ninths and a high, delayed answer. Leave room between attacks.',sound:'Muted, breathy lead; grainy bowed pad; deep, stable drone.'},
    'Intimate Piano':{bpm:68,scale:major,harm:[[0,5,3,0],[0,2,5,3],[3,0,1,4]],pace:1,
      hand:'broken',attacks:[0,.75,1.5,2.25,3.5],line:[0,1,2,-1,-2],space:.13,swing:.025,colour:23,
      cue:'Close-register melody over a gently broken left hand. The motif returns with a changed ending.',sound:'Soft felt or upright piano; a quiet sustained FRAMES pad.'},
    'Melancholic Strings':{bpm:60,scale:minor,harm:[[0,5,2,6],[0,3,5,4],[5,2,3,0]],pace:2,
      hand:'hymn',attacks:[0,1.5,2.75],line:[0,2,-1,-1,-2],space:.22,swing:.02,colour:38,
      cue:'A descending piano phrase hangs over moving inner voices and long string swells.',sound:'Warm piano; bowed FRAMES sound source with a gentle attack.'},
    'Nordic Suspense':{bpm:72,scale:dorian,harm:[[0,0,3,1],[0,4,1,0],[3,0,1,4]],pace:2,
      hand:'pedal',attacks:[0,.5,1.75,2.5,3.25],line:[0,0,3,-1,-2],space:.25,swing:.015,colour:32,
      cue:'A quiet recurring low figure leaves irregular openings for short, high replies.',sound:'Dry prepared attack, cold sustained tone, low textured drone.'},
    'Dreamlike Ambient':{bpm:64,scale:lydian,harm:[[0,1,4,0],[0,4,1,5],[3,1,0,4]],pace:2,
      hand:'float',attacks:[.5,1.75,2.75,3.5],line:[0,2,2,-1,1],space:.31,swing:.07,colour:47,
      cue:'Suspended upper notes and rising intervals drift across overlapping pad colours.',sound:'Resonant keys, diffuse upper textures and a morphing stereo pad.'},
    'Hypnotic Pulse':{bpm:92,scale:dorian,harm:[[0,3,0,5],[0,5,3,4],[0,2,3,0]],pace:2,
      hand:'ostinato',attacks:[0,.5,1,1.75,2.5,3,3.5],line:[0,1,-1,2,-2],space:.08,swing:.02,colour:52,
      cue:'An asymmetric repeating cell turns against a steady pulse as bass and harmony change beneath it.',sound:'Short prepared pluck, restrained pad and a Motion-led pulse.'},
    'Meditative Drift':{bpm:52,scale:major,harm:[[0,0,4,0],[0,3,0,4],[0,5,4,0]],pace:4,
      hand:'bells',attacks:[0,2.75],line:[0,2,-2,1,-1],space:.48,swing:.025,colour:20,
      cue:'Single piano tones and open fifths decay into silence. A drone carries the quieter passages.',sound:'Soft piano or mallet, low drone and very slow Morph.'},
    'Cinematic Ascent':{bpm:80,scale:minor,harm:[[0,5,2,6],[0,3,5,6],[5,6,0,3]],pace:1,
      hand:'rise',attacks:[0,.75,1.5,2,2.75,3.5],line:[0,1,1,2,-1],space:.11,swing:.015,colour:62,
      cue:'Wide broken chords build toward a high-register statement, then fall back to the opening motif.',sound:'Clear piano, sustained strings, broad pad and a gradually emerging pulse.'}
  };
  const defaults=()=>({version:1,theme:'Dark Score',mode:0,level:1,minutes:3,seed:1,melody:2,depths:[0,52,62,65,40,56],held:true});
  const seedOK=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
  function valid(p){return p?.version===1&&Object.hasOwn(themes,p.theme)&&Number.isInteger(p.minutes)&&p.minutes>=1&&p.minutes<=10&&
    Number.isInteger(p.mode)&&modes[p.mode]&&Number.isInteger(p.level)&&levels[p.level]&&seedOK(p.seed)&&seedOK(p.melody)&&typeof p.held==='boolean'&&
    Array.isArray(p.depths)&&p.depths.length===6&&p.depths.every(x=>Number.isInteger(x)&&x>=0&&x<=100);}
  function rng(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
  const pick=(a,r)=>a[Math.floor(r()*a.length)];
  function compose(p){
    if(!valid(p))throw Error('Unsupported Frames project.');
    const s=themes[p.theme],r=rng(p.seed),mel=rng(p.melody),bpm=s.bpm+pick([-4,0,0,4],r);
    const bars=bpm*p.minutes/4,total=bars*4*ppq,tracks=parts.map(()=>[]),cc=parts.map(()=>[]);
    const key=pick([0,2,3,5,7,9,10],r),scale=s.scale;
    const pitch=(base,d)=>base+key+12*Math.floor(d/7)+scale[(d%7+7)%7];
    const prog=pick(s.harm,r),contrast=pick(s.harm.filter(x=>x!==prog),r);
    const sections=['Opening','Theme','Development','Interlude','Return','Coda'].map((name,i)=>({name,bar:Math.floor(bars*([0,.12,.32,.55,.70,.89][i]+(i?(r()-.5)*.055:0)))}));
    const add=(lane,beat,length,n,v,hand='')=>{
      const t=clamp(Math.round(beat*ppq),0,total-1),d=clamp(Math.round(length*ppq),1,total-t);
      tracks[lane].push({r:lane,t,d,n:clamp(n,0,127),v:clamp(Math.round(v),1,120),hand});
    };
    const ctl=(lane,beat,ccNo,v)=>cc[lane].push({t:clamp(Math.round(beat*ppq),0,total),cc:ccNo,v:clamp(Math.round(v),0,127)});
    const phraseLength=pick([3,4,4,5],mel),pickup=pick([0,0,.125,.25],mel);
    const motif=()=>{let d=pick([0,2,4,5],mel);return Array.from({length:6+Math.floor(mel()*5)},(_,i)=>{
      d+=pick(s.line,mel);if(d< -2)d=-4-d;if(d>9)d=18-d;
      return {d,gate:.45+mel()*.51,dyn:Math.sin(i*.72)*8+mel()*5,shift:pick([0,0,0,.25,-.125],mel)};
    });};
    const phrase=motif(),answer=motif(),level=p.level;
    const voicing=(root,offsets,base,lo,hi)=>offsets.map(d=>{
      let n=pitch(base,root+d);while(n<lo)n+=12;while(n>hi)n-=12;return n;
    }).sort((a,b)=>a-b);
    // Phrase timing breathes across the bar while harmony changes remain anchored.
    let section=0;
    for(let b=0;b<bars;b++){
      while(section<5&&b>=sections[section+1].bar)section++;
      const pos=b*4,barEnd=pos+4,final=b===bars-1;
      const local=b-sections[section].bar,arc=[.25,.55,.78,.38,.92,.24][section];
      const h=final?0:(section===2||section===3?contrast:prog)[Math.floor(local/s.pace)%4];
      const root=pitch(36,h),bass=root>50?root-12:root;
      const chord=voicing(h,s.hand==='noir'?[0,2,6,8]:[0,2,4,6],48,49,64),sparse=p.mode===1;
      const background=p.mode===2, pianoOn=!background&&(!sparse||local%4===0||final);
      const strength=38+arc*17;
      if(pianoOn){
        const left=(at,n,len,k=0)=>add(0,pos+at+.012*r(),Math.min(len,4-at-.025),n,strength-11+k+r()*5,'L');
        const chordAt=(at,notes,len)=>notes.forEach((n,j)=>left(at+j*.024,n,len-j*.024,j));
        if(final||sparse||level===0){
          left(0,bass,final?3.65:2.7);
          if(!sparse&&level===0&&local%2===0&&s.hand!=='bells')left(1.52,chord[0],1.3);
        }else if(s.hand==='noir'){
          if(local%2===0)left(.05,bass,2.8);
          chordAt(local%2?.82:2.27,chord.slice(1,3),1.28);
          if(level===2&&local%4===3)left(3.52,pitch(36,h+1),.38);
        }else if(s.hand==='hymn'||s.hand==='float'){
          chordAt(.03,chord.slice(0,level===2?3:2),2.8);
          if(level===2)left(3.12,chord[3],.72);
        }else if(s.hand==='bells'){
          left(.1,bass,2.2);if(level===2&&local%2===0)left(2.65,chord[1],.8);
        }else{
          const pattern=s.hand==='ostinato'?[0,.75,1.5,2,2.75,3.5]:s.hand==='pedal'?[0,1.5,2.5]:[0,1,2,3];
          const steps=level===2?[...new Set([...pattern,.5,3.5])].sort((a,b)=>a-b):pattern;
          steps.forEach((t,j)=>left(t,j===0||s.hand==='pedal'&&j%2===0?bass:chord[(j+local%2)%3],(steps[j+1]??4)-t-.06));
        }
        ctl(0,pos,64,0);
        if(s.hand!=='ostinato'||local%2===0){
          ctl(0,pos+.105,64,100);ctl(0,barEnd-(s.hand==='noir'?.65:.09),64,0);
        }
      }
      // Reuse the opening cell at the return. A separate seed varies melody
      // without consuming the accompaniment's random stream.
      const rightActive=final||local%phraseLength!==phraseLength-1||section===4;
      if(rightActive){
        const cell=section===2||section===3?answer:phrase;
        const drifting=background&&['bells','float','noir','hymn'].includes(s.hand);
        const grid=final?[.12]:drifting?[s.attacks[local% s.attacks.length]]:sparse&&pianoOn?[.4]:s.attacks.filter((_,j)=>j%(level===0?2:1)===0);
        const times=level===2&&!sparse&&!drifting&&!final?[...new Set([...grid,3.72])].sort((a,b)=>a-b):grid;
        times.forEach((at,j)=>{
          const m=cell[(local%phraseLength*(level+1)+j+(section===4&&local%8>=4?2:0))%cell.length];
          if(!final&&j>0&&mel()<s.space*(section===3?1.6:1))return;
          let degree=m.d+(section===2&&local%8>=4?2:0);if(j===0)degree=h+pick([0,2,4],()=>((m.d+9)%13)/13);
          const register=(section===4&&level===2?72:60);
          let n=final?pitch(60,0):pitch(register,degree);
          while(n>88)n-=12;
          const t=clamp(at+(final?0:m.shift*.5+pickup*(j===0))+s.swing*(j%2)+.025*Math.sin(local+j),0,3.92);
          const duration=final?3.6:Math.max(.13,((times[j+1]??4.0)-at)*m.gate);
          if(pianoOn){
            add(0,pos+t,Math.min(4-t-.015,duration),n,strength+11+m.dyn,'R');
            if(level===2&&!sparse&&!final&&j===0&&local%4===2){
              const inner=chord.filter(tone=>tone<n-2&&tone>=n-15).pop();
              if(inner!==undefined)add(0,pos+t+.034,Math.min(1.1,duration*.82),inner,strength-4+m.dyn,'R');
            }
          }
          if(background||sparse&&!pianoOn||!final&&section>=2&&local%4===2&&j===0)
            add(1,pos+t+.015,Math.min(4-t-.02,duration*(background?1.3:1)),background?n:n-12,strength+m.dyn-5);
        });
      }
      if(section!==0||b%2===0){
        if(b%2===0||final)add(4,pos,Math.min(final?3.6:7.85,(bars-b)*4-.12),bass-12,32+arc*13);
        const long=final?3.7:3.92;
        voicing(h,s.hand==='noir'?[2,6,8]:[0,4,8],48,50,74).forEach(n=>add(3,pos+.03,long,n,28+arc*18));
      }
      if([1,2,4].includes(section)&&local%2===0){
        const d=pitch(60,h+(local%4?2:4));add(2,pos+.23,5.2,d,33+arc*16);
        if(level===2&&section===4)add(2,pos+2.2,3,d+7,35);
      }
      if(section!==5&&section!==3&&(s.hand==='ostinato'||local%2===0&&section!==0)){
        if(p.held)add(5,pos+.02,3.88,pitch(48,h),38+arc*13);
        else (s.hand==='noir'?[.5,3.25]:s.hand==='ostinato'?[0,.75,1.5,2.5,3.25]:[.5,2.75])
          .forEach(t=>add(5,pos+t,.36,pitch(48,h+(t>2?4:0)),35+arc*15));
      }
    }
    // End an existing strike just before the same pitch is re-articulated.
    for(const lane of tracks){
      lane.sort((a,b)=>a.t-b.t||a.n-b.n);
      const last=new Map();
      for(const n of lane){const prev=last.get(n.n);
        if(prev&&prev.t+prev.d>=n.t)prev.d=Math.max(0,n.t-prev.t-1);
        last.set(n.n,n);
      }
      for(let i=lane.length-1;i>=0;i--)if(!lane[i].d)lane.splice(i,1);
    }
    for(let lane=1;lane<6;lane++){
      const phase=r()*6.28,period=[0,14,29,37,69,18][lane]+r()*8,depth=p.depths[lane]/100;
      let last=-1;
      for(let beat=0;beat<bars*4;beat+=.25){
        const time=beat*60/bpm,x=beat/(bars*4);
        const envelope=Math.min(1,x*12,(1-x)*10);
        const breathing=.46+.25*Math.sin(time*6.283/period+phase)+.13*Math.sin(time*.071+lane)+.13*Math.sin(x*6.28-1.5);
        const v=Math.round(clamp(depth*(s.colour+100)*breathing*envelope,0,127));
        if(v!==last){ctl(lane,beat,1,v);last=v;}
      }
      ctl(lane,bars*4,1,0);
    }
    if(p.mode!==2)ctl(0,bars*4,64,0);
    return {tracks,cc,sections,bars,total,bpm,key};
  }
  function midi(song,lane=-1){
    const str=s=>Array.from(new TextEncoder().encode(s)),big=n=>[n>>>24,n>>>16&255,n>>>8&255,n&255];
    const vlq=x=>{const a=[x&127];while(x=Math.floor(x/128))a.unshift(128|x&127);return a;};
    const meta=(type,s)=>[255,type,...vlq(str(s).length),...str(s)];
    const chunk=events=>{let t=0;const body=[];
      events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);for(const [at,,msg] of events){body.push(...vlq(at-t),...msg);t=at;}
      body.push(...vlq(song.total-t),255,47,0);return [...str('MTrk'),...big(body.length),...body];};
    const us=Math.round(60000000/song.bpm),info=[[0,-4,[255,81,3,us>>16,us>>8&255,us&255]],[0,-3,[255,88,4,4,2,24,8]]];
    song.sections.forEach(s=>info.push([s.bar*1920,-2,meta(6,s.name)]));
    const chunks=lane<0?[chunk(info)]:[];
    parts.forEach((name,i)=>{if(lane>=0&&lane!==i)return;
      const e=lane<0?[]:info.slice();e.push([0,-5,meta(3,name)]);
      song.cc[i].forEach(c=>e.push([c.t,1,[176+i,c.cc,c.v]]));
      song.tracks[i].forEach(n=>e.push([n.t,2,[144+i,n.n,n.v]],[n.t+n.d,0,[128+i,n.n,0]]));
      chunks.push(chunk(e));});
    return new Uint8Array([...str('MThd'),0,0,0,6,0,lane<0?1:0,0,chunks.length,1,224,...chunks.flat()]);
  }
  return {parts,themes,modes,levels,defaults,valid,compose,midi,ppq};
})();
if(typeof module!=='undefined')module.exports=F;
