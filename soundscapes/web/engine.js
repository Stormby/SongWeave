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
  // Instrument ranges in Live's convention (C3 = MIDI 60).
  // "window" means a conservative composing register, not a published sample map.
  const libraryNames=Object.keys(libs);
  const catalog={};
  function patch(id,lib,name,family,lo,hi,range='window'){
    catalog[id]={lib:libraryNames[lib],name,family,lo,hi,range};
  }
  patch('ney',1,'Persian Ney','wind',54,74,'manual F♯2–D4');
  patch('dwney',3,'Persian Ney','wind',54,74,'manual F♯2–D4');
  patch('turkish',3,'Turkish Ney','wind',67,87,'manual G3–D♯5');
  patch('duduk',3,'Armenian Duduk','wind',52,72,'manual E2–C4');
  patch('oud',1,'Oud','pluck',57,72);
  patch('santur',1,'Santur','strike',57,79);
  patch('kaman',1,'Turkish Violin','bow',55,91,'manual G2–G5');
  patch('nbow',0,'Ethnic Violin','bow',55,79);
  patch('violin',0,'Violin','bow',55,82);
  patch('reed',0,'Eastern Double Reed','wind',60,79);
  patch('bansuri',0,'Indian Low Bansuri','wind',55,76);
  patch('dizi',0,'Chinese Dizi','wind',60,84);
  patch('hulusi',0,'Chinese Hulusi','wind',60,77);
  patch('xh',6,'Xiao','blow',60,79);
  patch('exiao',4,'Xiao Long Notes','wind',55,79);
  patch('edizi',4,'Low Dizi Long Notes','wind',53,76);
  patch('ehul',4,'Hulusi','wind',60,77);
  patch('shenai',4,'Shenai Long Notes','wind',60,79);
  patch('ocarina',4,'Big Ocarine','wind',60,79);
  patch('sanza',4,'Sanza Chromatic','pluck',60,81);
  patch('whistle',5,'Whistle','wind',62,86,'manual D3–D5');
  patch('wood',5,'Traditional Wooden Flute','wind',57,81,'manual A2–A4');
  patch('harp',5,'Gothic Harp','pluck',53,79);
  patch('lute',5,'Medieval Lute','pluck',55,76);
  patch('nyckel',5,'Nyckelharpa','bow',60,79);
  patch('tagel',2,'Big Tagelharpa','bow',62,76,'manual D3–E4 legato zone');
  patch('stagel',2,'Small Tagelharpa','bow',67,79,'manual G3–G4 legato zone');
  patch('bone',2,'Deer Bone Flute','wind',60,76);
  patch('lyre',2,'Cologne Lyre · finger','pluck',55,76);
  patch('folk',0,'Small Wooden Flute','wind',60,79);
  patch('celtia',7,'Celtia','voice',60,79);
  patch('tenor',7,'Medieval Tenor','voice',52,69);
  patch('heroica',7,'Heroica','voice',60,79);
  patch('bard',7,'Bard','voice',55,72);
  patch('silence',0,'Voice of Silence','voice',60,79);
  patch('choir',0,'Meditation Choir','voice',55,76);
  patch('bowl',0,'Crystal Singing Bowls','strike',60,79);
  patch('bells',0,'Meditation Bells','strike',60,81);
  patch('tongue',0,'Steel Tongue Drum','strike',55,76);
  patch('kalimba',0,'Kalimba','pluck',60,81);
  patch('tibetan',4,'Tibetan Bowls','strike',55,76);
  patch('chime',4,'Crystal Chimes I','strike',60,82);
  const arabic=names.length;
  const leadStyles=[...names,'Arabic maqam · Bayati'];
  const choices=[
    'bansuri silence harp exiao kalimba celtia','bowl folk harp choir tibetan exiao','duduk bone tenor santur kaman reed',
    'ney dwney santur oud kaman reed','bansuri nbow shenai violin silence folk','tagel stagel nyckel bone lyre nbow',
    'whistle wood harp violin celtia folk','dizi hulusi xh exiao edizi ehul','bone sanza ocarina tongue kalimba lyre',
    'wood harp lute bard tenor nyckel','celtia tenor heroica bard silence choir','bowl bells tongue tibetan chime kalimba',
    'xh folk wood harp bone ocarina','oud turkish duduk kaman santur reed'
  ].map(s=>s.split(' '));
  // Per-style anchor degrees, cadence, rhythmic vocabulary, silence and ornament.
  // Negative degrees descend below tonic; values can cross the octave.
  const recipes=[
    [[0,2,4,2],[2,1,0],[.55,1.4,2.8],13,'linger'],
    [[3,1,4,0],[3,0],[1.6,3.1,4.6],22,'space'],
    [[0,1,4,5],[4,1,0],[.37,1.2,2.9],14,'shadow'],
    [[2,3,4,2],[3,2,1,0],[.26,.52,.94,1.9],7,'persian'],
    [[0,2,3,4],[3,2,1,0],[.33,.8,1.65,2.7],10,'alap'],
    [[0,4,2,0],[4,2,1,0],[.4,.75,1.6,2.5],8,'call'],
    [[0,2,4,5],[4,2,1,0],[.23,.62,1.15,2.6],8,'air'],
    [[0,2,4,3],[3,2,1,0],[.24,.55,1.05,2.2],9,'bamboo'],
    [[0,2,0,3],[2,0],[.38,.75,1.5],8,'pulse'],
    [[0,3,4,2],[2,1,0],[.5,1,1.5,2],8,'modal'],
    [[0,2,3,1],[2,1,0],[.65,1.2,2.15],12,'vowel'],
    [[0,3,1,4],[2,0],[1.1,2.3,3.1],17,'ring'],
    [[3,1,4,2],[3,1,0],[.34,1,1.9],13,'bird'],
    [[0,2,3,5],[3,2,1,0],[.24,.53,.95,1.85],8,'bayati']
  ];
  function defaultLead(p){
    const list=choices[p.style],id=list.find(id=>catalog[id].lib===p.library)||list[0];
    return {style:p.style,id,seed:p.seed,oct:0};
  }
  function validLead(l){
    return l&&Number.isInteger(l.style)&&choices[l.style]?.includes(l.id)&&Number.isInteger(l.seed)&&l.seed>=0&&l.seed<=4294967295&&Number.isInteger(l.oct)&&Math.abs(l.oct)<=2&&[undefined,'Spacious','Balanced','Ornamented'].includes(l.feel);
  }
  function writeLead(p,root,note,tracks,controls,inst){
    const l=p.lead,a=catalog[l.id],s=l.style,[anchors,cadence,beats,gap,kind]=recipes[s];
    const scale=s===arabic?[0,150,300,500,700,800,1000]:styles[names[s]][0];
    const rng=random(l.seed),pick=arr=>arr[Math.floor(rng()*arr.length)];
    const clip=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
    const scalePitch=d=>1200*Math.floor(d/scale.length)+scale[(d%scale.length+scale.length)%scale.length];
    const base=root+12*Math.round(((a.lo+a.hi)/2-root-4)/12);
    function pitch(d){
      const c=scalePitch(d),key=Math.round(c/100);
      let n=base+key;while(n<a.lo)n+=12;while(n>a.hi)n-=12;
      return [n+12*l.oct,c-key*100];
    }
    const size=kind==='call'?4:kind==='ring'?3:6;
    function motif(){
      const len=size+Math.floor(rng()*(kind==='call'?4:6)),m=[];
      let degree=pick(anchors),crest=pick(anchors.slice(1))+pick([0,1,2]);
      for(let i=0;i<len;i++){
        const dir=i<len*.52?Math.sign(crest-degree):Math.sign(cadence[0]-degree);
        if(i)degree=clip(degree+(rng()<.73?dir:pick([-1,1]))*pick([1,1,1,2,3]),-2,scale.length+2);
        if(kind==='call'&&i===1)degree=pick([3,4,6]);
        if(kind==='bayati'&&i===Math.floor(len/2))degree=3;
        if(kind==='alap'&&i===2)degree=2;
        if(kind==='persian'&&i<3)degree=[pick([2,3,4]),2,1][i];
        if(kind==='bayati'&&i<3)degree=[0,pick([0,1]),pick([1,2])][i];
        if(kind==='call'&&i===2)degree=pick([2,4]);
        if(kind==='bamboo'&&i===2)degree=pick([2,3,4]);
        m.push({d:degree,len:pick(beats)*(.85+.3*rng()),accent:rng()});
      }
      const end=cadence.slice(-pick([2,3,4]));
      for(const d of end)m.push({d,len:pick(beats),accent:rng()});
      m[m.length-1].len=pick(beats.slice(-2))*1.6;
      return m;
    }
    const themes=[motif(),motif(),motif()];
    const space=l.feel==='Spacious'?1.45:l.feel==='Ornamented'?.8:1;
    const wind=['wind','blow','voice'].includes(a.family);
    inst[0]=a.lib+' · '+a.name;tracks[0].length=0;controls[0].length=0;
    let t=2+rng()*3,index=0;
    while(t<3585){
      const region=Math.floor(t/600),theme=themes[index%3===0?0:(region+index)%3];
      let prev=null,previousEvent=null;
      for(let j=0;j<theme.length&&t<3597;j++){
        const item=theme[j],last=j===theme.length-1;
        let degree=item.d;
        if(index>1&&!last&&rng()<.10+.15*p.variety/100)degree+=pick([-1,1]);
        if(kind==='alap'&&t<85)degree=Math.min(3,degree);
        const [n,c]=pitch(degree);
        const ornament=j>0&&!last&&((kind==='air'||kind==='bamboo')?rng()<.44/space:kind==='persian'&&rng()<.23/space);
        if(ornament){const [g,gc]=pitch(degree+1);note(0,t,.07,g,42,gc);t+=.09;}
        const bends=['wind','voice','bow'].includes(a.family);
        let slide=0;
        if(bends&&prev!==null&&n!==prev){
          const amount=kind==='alap'?165:kind==='bayati'?74:kind==='persian'?83:kind==='call'&&a.family==='bow'?27:0;
          if(amount&&j%3!==0)slide=clip((prev-n)*100,-amount,amount);
        }
        const duration=item.len*(.90+.20*rng())*(a.family==='strike'?.64:a.family==='pluck'?.81:1);
        // A short overlap requests recorded legato only where both notes share neutral tuning.
        if(previousEvent&&!ornament&&!c&&!slide&&!previousEvent.cents&&!previousEvent.slide&&n!==prev&&
           (a.family==='voice'||a.family==='bow'||['ney','dwney','duduk','turkish'].includes(l.id))&&
           t-(previousEvent.t+previousEvent.d)/ppq<.28&&j%3===1){
          previousEvent.d=Math.round(t*ppq)-previousEvent.t+18;
        }
        note(0,t,duration,n,43+item.accent*16+(j===0?5:0),c,slide);
        previousEvent=tracks[0].at(-1);
        t+=duration+(kind==='ring'?1.7:kind==='space'?1.1:a.family==='pluck'?.14:.045)+rng()*(wind?.2:.12);
        if(wind&&j===Math.floor(theme.length/2))t+=.45+rng()*.65;
        prev=n;
      }
      t+=gap*space*(.60+rng()*.85)*(region===3||region===5?1.4:1);index++;
    }
  }
  function valid(p){return p&&Object.hasOwn(libs,p.library)&&libs[p.library][0].includes(p.style)&&p.version===1&&(!p.lead||validLead(p.lead))&&
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
    if(p.lead)writeLead(p,root,note,tracks,controls,inst);
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
  return {catalog,choices,leadStyles,defaultLead,parts,libs,names,styles,channels,chapters,total,ppq,range,compose,midi,valid};
})();
if(typeof module!=='undefined')module.exports=SC;
