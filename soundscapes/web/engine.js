// The score clock is one quarter per second. All notes and controls use integer ticks.
const SC=(()=>{
  const ppq=480, total=3600*ppq, parts=['Melody','Drone','Pad','Answer','Colour','Pulse'], channels=[1,2,3,4,5,10];
  const chapters=['Arrival','First light','Gathering','Still water','Return','Dissolve'];
  // Each style has its own scale in cents, phrase vocabulary, spacing and register.
  const styles={
    'Meditation':[[0,200,400,700,900],[[0,1,2,1,0],[2,3,2,0]],22,'Soft recurring phrases over slowly breathing open fifths.'],
    'Soundscapes':[[0,200,500,700,1000],[[0,3,2],[3,4,3,0]],38,'Long single tones allow the sampled texture to develop between entries.'],
    'Mystery':[[0,100,300,500,700,800,1000],[[0,1,0,4],[4,5,4,2,0]],28,'A semitone neighbour appears above a quiet pedal, then recedes.'],
    'Middle Eastern · Persian colour':[[0,150,300,500,700,800,1000],[[3,2,1,0],[0,1,2,3,2,1,0]],17,'Ney phrases circle a resting tone. The lowered second is represented here by a 150-cent interval.'],
    'Indian · Bhupali-inspired alap':[[0,200,400,700,900],[[2,1,0],[0,1,2,3,2],[3,4,3,2,1,0]],20,'Begin close to Sa and Ga. Reveal Pa and Dha gradually, joining selected notes with meend over Sa and Pa.'],
    'Nordic bowed drone':[[0,200,300,500,700,900,1000],[[0,2,1,0],[3,2,1,0]],14,'Small rocking figures and repeated bow strokes sit above an open drone.'],
    'Irish slow air':[[0,200,300,500,700,900,1000],[[0,1,2,4,3,2],[4,5,4,2,1,0]],16,'Speech-like timing, a held arrival and a short finger cut before selected notes.'],
    'Chinese bamboo air':[[0,200,400,700,900],[[0,2,1,0],[3,4,3,2,1],[2,3,2,0]],19,'Spaced pentatonic phrases with upper grace notes, soft attacks and breathing rests.'],
    'Earth & Drum':[[0,300,500,700,1000],[[0,2,1,0],[3,2,0]],18,'Widely spaced hand-drum strokes gather in the middle and fall away before the close.'],
    'Medieval chamber':[[0,200,300,500,700,900,1000],[[0,1,2,3,2,0],[4,3,2,1,0]],15,'A modal air answered across open fourths and fifths.'],
    'Wordless vigil':[[0,200,300,500,700,1000],[[2,1,0],[0,1,3,2,1,0]],25,'Unhurried vowel phrases alternate between two singers with time for audible breaths.'],
    'Resonant bowls':[[0,200,400,700,900],[[0,3],[2,1,0]],35,'Single strikes decay into near-silence before the next register enters.'],
    'Woodland dusk':[[0,200,500,700,900],[[2,1,0],[0,3,2,1]],29,'Short distant calls travel over a quiet bed with occasional harp colour.']
  };
  const names=Object.keys(styles);
  // Indices select compatible styles. Empty assignments intentionally leave a lane silent.
  const libs={
    'NADA':[[0,4,7,11,10,1,2,8],['Indian Low Bansuri','Meditation Choir','Crystal Voices','Voice of Silence','Meditation Bells','Ghatam']],
    'Ancient ERA Persia':[[3,0,2,8,1],['Persian Ney','Soundscapes · quiet drone','Soundscapes · soft layer','Oud','Santur','Daf']],
    'Dark Era':[[5,2,8,0,1],['Bone flute','Big Tagelharpa · drone range','Soundscapes · soft layer','Cologne Lyre','','Frame drum']],
    'Desert Winds':[[3,2,0,1],['Persian Ney','Soundscapes · drone','Soundscapes · soft layer','Armenian Duduk','','']],
    'Epic World':[[1,2,7,8,12,0],['Enigma Flute I','Drones · low layer','Pads · soft layer','Arabian Plucked Strings','Crystal Chimes I','Bata Drums']],
    'ERA II Medieval Legends':[[9,6,5,2,0,8],['Traditional Wooden Flute','Viola da Gamba','Bowed Psaltery','Medieval Lute','Gothic Harp','Frame Drums']],
    'Forest Kingdom 3':[[12,7,8,1,0,2],['Xiao','Soundscapes · low layer','Soundscapes · soft layer','Harp','Tibetan Bowl','Frame Drum']],
    'ERA II Vocal Codex':[[10,9,0,2,1],['Celtia','Soundscapes · low layer','Soundscapes · soft layer','Bard','','']]
  };
  function instruments(library,s){
    const a=libs[library][1].slice();
    if(library==='NADA'){
      if(s===4){a[1]='Indian Tanpura Drones';a[3]='';a[4]='';a[5]='Tabla · Baya';}if(s===7)a[0]='Chinese Dizi';if(s===11)a[0]='Crystal Singing Bowls';
      if(s===10){a[0]='Voice of Silence';a[3]='Meditation Choir';}
    }
    if(library==='Desert Winds')a[1]='Duduk Drones';
    if(library==='Epic World'&&s===7)a[0]='Xiao Long Notes';
    if(library==='ERA II Medieval Legends'&&s===6)a[0]='Whistle';
    if(library==='ERA II Medieval Legends'&&s===5)a[0]='Nyckelharpa';
    if(library==='ERA II Vocal Codex'&&s===2){a[0]='Medieval Tenor';a[3]='Heroica';}
    return a;
  }
  function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function valid(p){return p&&Object.hasOwn(libs,p.library)&&libs[p.library][0].includes(p.style)&&p.version===1&&
    Number.isInteger(p.seed)&&p.seed>=0&&p.seed<=4294967295&&Number.isInteger(p.variety)&&p.variety>=0&&p.variety<=100&&
    typeof p.pulse==='boolean'&&Number.isInteger(p.hit)&&p.hit>=0&&p.hit<=127;}
  function compose(p){
    if(!valid(p))throw Error('Unsupported soundscape project');
    const s=p.style,[scale,cells,spacing]=styles[names[s]],inst=instruments(p.library,s);
    const tracks=parts.map(()=>[]), controls=parts.map(()=>[]),rng=random(p.seed),phase=rng()*6.28;
    const root=p.library==='Dark Era'?60:[60,62,65][Math.floor(rng()*3)],variant=p.variety/100;
    const note=(r,t,d,n,v,cents=0,slide=0)=>{
      if(!inst[r]||t<0||t>=3600)return;
      const at=Math.round(t*ppq),len=Math.min(total-at,Math.max(1,Math.round(d*ppq)));
      tracks[r].push({r,t:at,d:len,n,v:Math.round(v),cents,slide});
      if(cents||slide){
        const curve=(time,c)=>controls[r].push({t:time,b:Math.max(0,Math.min(16383,Math.round(8192+c/200*8192)))});
        curve(at,cents+slide);
        if(slide)for(let j=1;j<=12;j++)curve(at+Math.round(Math.min(len*.45,ppq*.65)*j/12),cents+slide*(1-j/12)**2);
        curve(at+len,0);
      }
    };
    const intensity=t=>Math.max(0,Math.min(1,(.47+.20*Math.sin(t/128+phase)+.18*Math.sin(t/307)+.12*Math.sin(t/46))*Math.min(1,t/180,(3600-t)/260)));
    // Separate layer cycles keep the hour from repeating at a common loop boundary.
    for(let t=0;t<3600;){
      const bowed=inst[1].includes('Tagelharpa')||inst[1]==='Viola da Gamba';
      const dur=bowed?3+rng()*3:26+rng()*35;
      note(1,t,dur-.05,inst[1]==='Duduk Drones'?root-24:root-12,35+20*intensity(t));t+=dur;
    }
    for(let t=16;t<3588;){
      const e=intensity(t),d=13+rng()*27;
      note(2,t,d,root+7,27+19*e);
      if(e>.54&&!inst[2].includes('Psaltery')&&!inst[2].includes('Soundscapes'))note(2,t+1,d-1,root+12+(s===2?1:0),23+14*e);
      t+=d+5+rng()*16;
    }
    let phrase=0;
    for(let t=32+rng()*8;t<3580;){
      const e=intensity(t),moving=rng()<.15+variant*.65;
      const cell=cells[moving?Math.floor(rng()*cells.length):0];
      let at=t,previous=null;
      for(let i=0;i<cell.length;i++){
        const degree=s===4&&t<300?Math.min(2,cell[i]):cell[i];
        const c=scale[degree],base=s===10||inst[0]==='Medieval Tenor'?60:root;
        let n=base+Math.round(c/100);
        if(inst[0]==='Persian Ney')n-=12;
        if(inst[0]==='Whistle')n+=12;
        const d=(s===11?2:s===5?.85:1.25)+(i===cell.length-1?1.5:.4)*rng()+(!e?.3:0);
        if((s===6||s===7)&&i===1&&phrase%3===0){note(0,at,.085,n+(s===6?2:1),42);at+=.10;}
        const cents=c-Math.round(c/100)*100;
        const slide=s===4&&previous!==null&&i%2===1?Math.max(-190,Math.min(190,(previous-n)*100)):s===3&&i===0?-28:0;
        previous=n;
        note(0,at,d,n,43+e*22+rng()*5,cents,slide);at+=d+(s===11?2.4:.12+rng()*.42);
      }
      if(e>.25&&phrase%3===1){
        const vocal=p.library==='ERA II Vocal Codex';
        note(3,at+1.4,vocal?3.8:2.3,vocal?55:root+7,34+e*15);
        note(3,at+(vocal?5.6:4.4),2.7,vocal?60:root,34+e*10);
      }
      phrase++;t=at+spacing*(1.2-e*.65)+rng()*(4+variant*10);
    }
    for(let t=54;t<3550;t+=28+rng()*53)if(intensity(t)>.29)note(4,t,2.4,root+(rng()<.5?7:12),29+rng()*13);
    if(p.pulse&&inst[5])for(let t=185;t<3360;t+=s===8?4.5:8)if(intensity(t)>(s===8?.25:.48)){
      note(5,t,.55,p.hit,32+intensity(t)*22);if(s===8&&rng()<.22)note(5,t+2.9,.4,p.hit,30);
    }
    // Gentle layer swells. Receivers can assign expression (CC11) to amplitude.
    for(const r of [1,2])for(let t=0;t<3600;t+=3){
      const fade=Math.min(1,(t+2)/30,(3600-t)/75);
      controls[r].push({t:t*ppq,x:Math.round((75+32*intensity(t))*fade)});
    }
    return {tracks,controls,inst};
  }
  const range=i=>i<0?[0,total]:[i*600*ppq,(i+1)*600*ppq];
  function midi(song,lane=-1,scope=-1){
    const [lo,hi]=range(scope),bytes=s=>Array.from(new TextEncoder().encode(s));
    const long=x=>[x>>>24,x>>>16&255,x>>>8&255,x&255];
    const vlq=x=>{const b=[x&127];while(x=Math.floor(x/128))b.unshift(128|(x&127));return b;};
    const meta=(k,s)=>[255,k,...vlq(bytes(s).length),...bytes(s)];
    const chunk=events=>{
      const out=[];let prev=0;
      events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
      for(const [t,,data] of events){out.push(...vlq(t-prev),...data);prev=t;}
      out.push(...vlq(hi-lo-prev),255,47,0);
      return [...bytes('MTrk'),...long(out.length),...out];
    };
    const info=[[0,-4,[255,81,3,15,66,64]],[0,-3,[255,88,4,4,2,24,8]]];
    chapters.forEach((c,i)=>{const t=i*600*ppq;if(t>=lo&&t<hi)info.push([t-lo,-2,meta(6,c)]);});
    const chunks=lane<0?[chunk(info)]:[];
    parts.forEach((name,r)=>{
      if(lane>=0&&r!==lane)return;
      const ch=channels[r]-1,ev=lane<0?[]:info.slice();
      ev.push([0,-5,meta(3,name+(song.inst[r]?' - '+song.inst[r]:''))]);
      const prev={};const ctl=(e,t)=>{
        const data=e.b!==undefined?[224+ch,e.b&127,e.b>>7]:[176+ch,11,e.x];
        ev.push([t,1,data]);
      };
      for(const e of song.controls[r]){
        if(e.t<lo)prev[e.b!==undefined?'b':'x']=e;
      }
      Object.values(prev).forEach(e=>ctl(e,0));
      for(const e of song.controls[r])if(e.t>=lo&&e.t<hi)ctl(e,e.t-lo);
      for(const n of song.tracks[r])if(n.t<hi&&n.t+n.d>lo){
        ev.push([Math.max(n.t,lo)-lo,2,[144+ch,n.n,n.v]],[Math.min(hi,n.t+n.d)-lo,0,[128+ch,n.n,0]]);
      }
      if(song.controls[r].some(e=>e.b!==undefined))ev.push([hi-lo,1,[224+ch,0,64]]);
      chunks.push(chunk(ev));
    });
    return Uint8Array.from([...bytes('MThd'),0,0,0,6,0,lane<0?1:0,0,chunks.length,1,224,...chunks.flat()]);
  }
  return {parts,libs,names,styles,channels,chapters,total,ppq,range,compose,midi,valid};
})();
if(typeof module!=='undefined')module.exports=SC;
