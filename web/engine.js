/* Shared offline composition engine. All example phrases are newly authored scale degrees.
   The conditional counts below are fitted locally, separately for melody and harmony. */
const SW = (() => {
  const PPQ = 480;
  const parts = ['Melody', 'Chords', 'Bass', 'Arp'];
  const keys = ['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const forms = {
    'Song': [['Intro',1,'intro'],['Theme A',2,'a'],['Theme B',1,'b'],['A return',1,'return'],['Bridge',1,'bridge'],['Final theme',1,'peak'],['Outro',1,'outro']],
    'Evolving': [['Emergence',1,'intro'],['First light',2,'a'],['Expansion',2,'b'],['Still point',1,'bridge'],['Reprise',1,'return'],['Dissolve',1,'outro']],
    'Score': [['Prologue',1,'intro'],['Statement',2,'a'],['Tension',1,'bridge'],['Ascent',1,'b'],['Climax',1,'peak'],['Reprise',1,'return'],['Resolution',1,'outro']],
    'Refrain': [['Haze',2,'intro'],['Signal',1,'a'],['Afterimage',1,'bridge'],['Signal returns',2,'return'],['Fade',2,'outro']],
    'Night drive': [['Ignition',1,'intro'],['Cruise',2,'a'],['Acceleration',2,'b'],['Blackout',1,'bridge'],['Last stretch',2,'peak']],
    'Chamber suite': [['Prelude',1,'intro'],['Question',1,'a'],['Dance',2,'b'],['Interlude',1,'bridge'],['Answer',2,'return'],['Coda',1,'outro']],
    'Slow ascent': [['Horizon',2,'intro'],['Orbit',2,'a'],['Lift',2,'b'],['Apex',1,'peak'],['Drift',1,'outro']],
    'Vignettes': [['First image',1,'a'],['Reflection',2,'bridge'],['Second image',1,'b'],['Stillness',1,'intro'],['Remembered',2,'return'],['Last light',1,'outro']]
  };
  // Corpus tokens 1–9 are scale degrees, extending beyond the octave.
  const styles = {
    'Neo-classical': { bpm:84, meter:'3/4', form:'Song', mode:'Minor', change:1, spread:0, arp:3, bass:1,
      phrases:'13543421 12356543 53432123 34565321 32135654 56543212 12343251 35786543 13245432 43235321',
      harmony:'14651 163451 14541 154651 164251 136451', programs:[0,48,42,0]},
    'Ambient': { bpm:64, meter:'4/4', form:'Evolving', mode:'Dorian', change:2, spread:1, arp:1, bass:0,
      phrases:'125432 532125 154235 215653 352165 562351 153215 253652 612532 523162',
      harmony:'114411 144661 116441 141551 166441 114551', programs:[89,88,38,10]},
    'New age': { bpm:76, meter:'6/8', form:'Song', mode:'Major', change:1, spread:1, arp:3, bass:1,
      phrases:'12356532 13586531 35653212 65323565 12353213 53235653 13565321 23586531 32123565 65321235',
      harmony:'145631 164551 156441 146551 145641 164451', programs:[0,89,32,46]},
    'Drone': { bpm:54, meter:'4/4', form:'Evolving', mode:'Dorian', change:4, spread:2, arp:0, bass:0,
      phrases:'11551 11211 15565 55115 12155 51521 11545 51151 15121 51551',
      harmony:'111411 111511 114111 115111 111141 151111', programs:[92,89,43,98]},
    'Chillout': { bpm:88, meter:'4/4', form:'Song', mode:'Dorian', change:1, spread:0, arp:2, bass:3,
      phrases:'35653215 53235672 13572653 65323517 32567532 57325653 35231765 23575321 16532753 35765323',
      harmony:'146251 162551 142651 164251 126451 136251', programs:[4,5,33,11]},
    'Cinematic': { bpm:96, meter:'4/4', form:'Score', mode:'Minor', change:2, spread:2, arp:4, bass:2,
      phrases:'11565321 13568765 15685321 12358765 55135685 13585643 11586531 13576853 15687531 11235685',
      harmony:'166451 164551 146551 163451 164351 136451', programs:[60,49,43,45]},
    'Angelo Badalamenti': { composer:true, texture:'noir', title:'Dark synth / love theme', key:2,
      instruments:'Try a soft analog lead, slow saw pad, sub bass and distant electric piano.',
      bpm:55, meter:'4/4', form:'Score', mode:'Minor', change:4, spread:1, arp:1, bass:0,
      phrases:'21355642 55642123 23466521 64332215 15322643 32144651 45632112 43564231',
      harmony:'1166411 1144661 1663441 1166335 1446651 1136641', programs:[89,92,38,4]},
    'Ólafur Arnalds': { composer:true, texture:'piano', title:'Felt piano / electronic pulse', key:2,
      instruments:'Try felt piano, muted chamber strings, soft cello and a filtered pluck.',
      bpm:82, meter:'4/4', form:'Evolving', mode:'Dorian', change:2, spread:1, arp:2, bass:0,
      phrases:'25134216 31564352 15324135 46215324 62315241 35214632 15365423 24136251',
      harmony:'1642411 1426611 1462251 1624451 1442631 1266411', programs:[0,49,42,10]},
    'Max Richter': { composer:true, texture:'strings', title:'Slow string elegy', key:5,
      instruments:'Try a legato violin, sustained string ensemble, cello or double bass, and viola on the Arp lane.',
      bpm:64, meter:'4/4', form:'Evolving', mode:'Minor', change:2, spread:0, arp:1, bass:0,
      phrases:'34554321 23445532 54433234 23455432 32122345 54345654 34543321 23432123',
      harmony:'1463341 1634411 1346651 1664351 1433661 1366441', programs:[40,49,42,41]},
    'Johnny Jewel': {composer:true,texture:'afterglow',voice:'noir',title:'After-hours synth reprise',key:8,
      instruments:'Try a breathy analog lead, dark organ, low sustained synth and a tape-echo pluck.',
      bpm:59,meter:'4/4',form:'Refrain',mode:'Minor',change:4,
      phrases:'5322215 4115322 5523144 6432215 3215532 4322155',harmony:'1166114 1441161 6114411 1144116',programs:[85,17,38,4]},
    'Cliff Martinez': {composer:true,texture:'neon',voice:'noir',title:'Night-drive pulse',key:6,
      instruments:'Try a glassy lead, cool synth pad, short sequenced bass and metallic mallets.',
      bpm:99,meter:'4/4',form:'Night drive',mode:'Dorian',change:2,
      phrases:'5125523 2352551 4523152 1254531 5312254 2531512',harmony:'1624415 1416251 6142411 1426145',programs:[93,89,38,11]},
    'Alexandre Desplat': {composer:true,texture:'chamber',voice:'strings',title:'Chamber mystery / lilting theme',key:7,
      instruments:'Try solo flute or clarinet, divided strings, pizzicato cello and harp or celesta.',
      bpm:94,meter:'3/4',form:'Chamber suite',mode:'Minor',change:1,
      phrases:'24654323 13543246 32654321 46323456 23465743 56243216',harmony:'1245361 1632451 4162351 2463511',programs:[73,48,43,46]},
    'Hans Zimmer': {composer:true,texture:'orbit',voice:'strings',title:'Weightless organ / strings',key:9,
      instruments:'Try a soft organ lead, broad legato strings, a low pedal and a gentle repeating piano.',
      bpm:61,meter:'4/4',form:'Slow ascent',mode:'Major',change:4,
      phrases:'12556235 35688653 52356865 23565632 55321256 12653521',harmony:'1644116 6611445 1466115 4166114',programs:[19,49,43,0]},
    'Thomas Newman': {composer:true,texture:'glass',voice:'piano',title:'Glass and wood / reflective piano',key:4,
      instruments:'Try intimate piano, airy strings, round bass and a mix of marimba and struck glass.',
      bpm:78,meter:'4/4',form:'Vignettes',mode:'Major',change:2,
      phrases:'26315236 53126312 62531356 15362631 36152635 52316531',harmony:'1426114 6142411 1264115 4162411',programs:[0,89,32,12]}
  };
  const scales = { Major:[0,2,4,5,7,9,11], Minor:[0,2,3,5,7,8,10], Dorian:[0,2,3,5,7,9,10] };
  const meters = {'4/4':[4,4],'3/4':[3,4],'6/8':[6,8]};
  const clamp = (a,lo,hi) => Math.min(hi,Math.max(lo,a));
  function random(seed) {
    let state=seed>>>0;
    return () => { state=(state+0x6d2b79f5)>>>0; let x=Math.imul(state^(state>>>15),1|state);
      x^=x+Math.imul(x^(x>>>7),61|x); return ((x^(x>>>14))>>>0)/4294967296; };
  }
  function hash(...values) {
    let h=2166136261;
    for(const v of values) {h=Math.imul(h^(v>>>0),16777619); h^=h>>>13;}
    return h>>>0;
  }
  function train(corpus) {
    const counts=new Map();
    for(const phrase of corpus.split(' ')) {
      for(let i=0;i<phrase.length;i++) for(let k=0;k<=Math.min(2,i);k++){
        const key=phrase.slice(i-k,i);
        if(!counts.has(key)) counts.set(key,Array(10).fill(0));
        counts.get(key)[Number(phrase[i])]++;
      }
    }
    return counts;
  }
  function sample(model,length,rng,first) {
    let seq=String(first);
    while(seq.length<length) {
      const candidates=[model.get(''),model.get(seq.slice(-1)),seq.length>1?model.get(seq.slice(-2)):null];
      const p=Array(10).fill(0);
      candidates.forEach((c,i)=>{ if(c){const sum=c.reduce((a,b)=>a+b,0);
        c.forEach((v,j)=>p[j]+=v/sum*[0.06,0.24,0.70][i]);}});
      let choice=rng()*p.reduce((a,b)=>a+b,0);
      for(let j=1;j<p.length;j++) if((choice-=p[j])<0){seq+=j;break;}
    }
    return [...seq].map(n=>Number(n)-1);
  }
  const models=Object.fromEntries(Object.entries(styles).map(([name,s])=>[name,[train(s.phrases),train(s.harmony)]]));
  function defaults(genre='Neo-classical') {
    const s=styles[genre]; return {genre,bpm:s.bpm,key:s.key??0,mode:s.mode,meter:s.meter,form:s.form,bars:64};
  }
  function sections(config) {
    let bar=0;
    const layout=config.layout??forms[config.form].map(([name,units,role])=>({name,role,bars:units*config.bars/8}));
    return layout.map(({name,role,bars})=>{const item={name,role,bar,bars};bar+=bars;return item;});
  }
  function validLength(c) {
    if(c.layout===undefined)return [32,64,96,128].includes(c.bars);
    const roles=['intro','a','b','return','bridge','peak','outro'];
    return Array.isArray(c.layout)&&c.layout.length>=1&&c.layout.length<=24&&c.bars<=256&&
      c.layout.every(s=>s&&typeof s.name==='string'&&s.name.trim().length>0&&s.name.length<=40&&roles.includes(s.role)&&
        Number.isInteger(s.bars)&&s.bars>=1&&s.bars<=64)&&c.layout.reduce((n,s)=>n+s.bars,0)===c.bars;
  }
  function editSection(p,index,action,value) {
    const q=JSON.parse(JSON.stringify(p));
    const layout=sections(q.config).map(({name,role,bars})=>({name,role,bars}));
    if(index<0||index>=layout.length)throw Error('Select a section first.');
    let selected=index;
    if(action==='rename'){layout[index].name=String(value).trim().slice(0,40);}
    else if(action==='length'){layout[index].bars=Number(value);}
    else if(action==='repeat'){
      selected=index+1;layout.splice(selected,0,{...layout[index]});q.revisions.splice(selected,0,JSON.parse(JSON.stringify(q.revisions[index])));
    } else if(action==='remove'){
      if(layout.length===1)throw Error('Keep at least one section.');
      layout.splice(index,1);q.revisions.splice(index,1);selected=Math.min(index,layout.length-1);
    } else if(action==='left'||action==='right'){
      selected=index+(action==='left'?-1:1);
      if(selected<0||selected>=layout.length)throw Error('This section is already at the edge.');
      [layout[index],layout[selected]]=[layout[selected],layout[index]];
      [q.revisions[index],q.revisions[selected]]=[q.revisions[selected],q.revisions[index]];
    } else throw Error('Unknown section edit.');
    delete q.config.generatedLayout;q.config.layout=layout;q.config.bars=layout.reduce((n,s)=>n+s.bars,0);
    if(!validLength(q.config))throw Error('Use a section name, 1–64 bars per section, up to 24 sections and 256 bars total.');
    return {project:q,selected};
  }
  function project(config,seed) {
    const secs=sections(config);
    return {version:1,config:{...config},seed:seed>>>0,partSeeds:parts.map((_,i)=>hash(seed,i,101)),
      revisions:secs.map(()=>[0,0,0,0]),locks:[false,false,false,false]};
  }
  const familyId={intro:0,a:0,return:0,peak:0,outro:0,b:1,bridge:2};
  function originalMaterial(p,f){
    const [melody,harm]=models[p.config.genre];
    return {theme:sample(melody,16,random(hash(p.partSeeds[0],f)),[1,3,5][f]),
      harmony:sample(harm,8,random(hash(p.seed,f,73)),[1,4,6][f]),pace:styles[p.config.genre].change,
      grooves:[0,0,0,0],depth:[0,0,0,0]};
  }
  function regenerate(p,scope,seed,amount=55){
    const q=JSON.parse(JSON.stringify(p)),secs=sections(q.config),v=clamp(amount/100,0,1);
    const [melody,harm]=models[q.config.genre],style=styles[q.config.genre];
    const anyLock=q.locks.some(Boolean);
    q.revisions.forEach((row,i)=>{
      if((scope>=0&&scope!==i)||q.locks.every(Boolean))return;
      const f=familyId[secs[i].role],plan=row[4]??originalMaterial(p,f);
      // Related sections draw on the same new material, keeping a recognisable reprise.
      const phrase=random(hash(seed,f,391)),chords=random(hash(seed,f,457));
      const blend=(old,next,chance,rng)=>old.map((n,j)=>rng()<chance?next[j]:n);
      if(!q.locks[0]){
        const next=sample(melody,16,phrase,1+Math.floor(phrase()*6));
        plan.theme=blend(plan.theme,next,v**1.15,phrase);
      }
      if(!anyLock && v>.15){
        const first=style.harmony.replaceAll(' ','');
        const next=sample(harm,8,chords,Number(first[Math.floor(chords()*first.length)]));
        plan.harmony=blend(plan.harmony,next,v**1.5,chords);
        if(chords()<v*v)plan.pace=Math.max(1,Math.round(style.change*[.5,1,1.5,2][Math.floor(chords()*4)]));
      }
      for(let r=0;r<4;r++)if(!q.locks[r]){
        row[r]=hash(seed,i,r);
        if(v>.1){plan.grooves[r]=hash(seed,f,r,481);plan.depth[r]=v;}
      }
      row[4]=plan;
    });
    return q;
  }
  function vary(p,scope,seed,amount=55){return regenerate(p,scope,seed,amount);}
  function newIdea(p,seed,amount=55,keepKey=false){
    const v=clamp(amount/100,0,1);
    if(p.locks.some(Boolean)||v<.35)return regenerate(p,-1,seed,amount);
    const c=JSON.parse(JSON.stringify(p.config)),rng=random(hash(seed,971));
    if(v>=.7&&!keepKey){
      const offsets=[5,7,2,10,3,9];
      c.key=(c.key+offsets[Math.floor(rng()*offsets.length)])%12;
    }
    if(v>=.7&&(!c.layout||c.generatedLayout)){
      // Keep the requested length. Rework the relative lengths and order of the middle sections.
      const base=forms[c.form].map(([name,units,role])=>({name,bars:units*c.bars/8,role}));
      const unit=Math.max(1,Math.floor(c.bars/32)),middle=base.slice(1,-1);
      const from=middle.filter(s=>s.bars>unit),donor=from[Math.floor(rng()*from.length)];
      const to=base.filter(s=>s!==donor),receiver=to[Math.floor(rng()*to.length)];
      donor.bars-=unit;receiver.bars+=unit;
      if(v>.85){
        const at=1+Math.floor(rng()*(middle.length-1));
        [middle[at],middle[at-1]]=[middle[at-1],middle[at]];
      }
      c.layout=[base[0],...middle,base.at(-1)];c.generatedLayout=true;
    }
    return regenerate(project(c,seed),-1,seed,amount);
  }
  function validPlan(plan){
    const degrees=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=8);
    return plan&&degrees(plan.theme,16)&&degrees(plan.harmony,8)&&Number.isInteger(plan.pace)&&plan.pace>=1&&plan.pace<=16&&
      Array.isArray(plan.grooves)&&plan.grooves.length===4&&plan.grooves.every(validSeed)&&
      Array.isArray(plan.depth)&&plan.depth.length===4&&plan.depth.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
  }
  const validSeed=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
  function valid(p) {
    const c=p?.config;
    return p?.version===1 && c && Object.hasOwn(styles,c.genre) && Object.hasOwn(forms,c.form) &&
      Object.hasOwn(scales,c.mode) && Object.hasOwn(meters,c.meter) && Number.isInteger(c.key) && c.key>=0 && c.key<12 &&
      Number.isFinite(c.bpm) && c.bpm>=20 && c.bpm<=400 && validLength(c) && validSeed(p.seed) &&
      Array.isArray(p.partSeeds)&&p.partSeeds.length===4&&p.partSeeds.every(validSeed) &&
      Array.isArray(p.locks)&&p.locks.length===4&&p.locks.every(v=>typeof v==='boolean') &&
      Array.isArray(p.revisions)&&p.revisions.length===sections(c).length &&
      p.revisions.every(row=>Array.isArray(row)&&(row.length===4||row.length===5&&validPlan(row[4]))&&row.slice(0,4).every(validSeed));
  }
  // Original role-specific writing for the three score palettes. Timing is measured in bars.
  function composerBar(style,ctx){
    const {b,sec,final,h,theme,rs,energy,pitch,barTicks,start,add}=ctx;
    const put=(r,at,d,n,v)=>add(r,start+Math.round(at*barTicks),Math.min(Math.round(d*barTicks),barTicks-Math.round(at*barTicks)),n,v);
    const level=(r,base)=>base+energy*25+rs[r]()*7;
    const motif=theme[(b%4)*3];
    const returnLift=sec.role==='peak'||sec.role==='return';
    if(style.texture==='noir'){
      const light=['b','peak','return'].includes(sec.role);
      const pedal=light && b%8>=4 ? 4 : 0;
      put(2,0,1,pitch(pedal,24),level(2,38));
      const voicing=light?[h,h+4,h+9]:[h,h+4,h+7];
      const tension=!light&&b%4>=2&&!final;
      voicing.forEach((d,i)=>put(1,0,1,pitch(d,48)+(tension&&i===2?-1:0),level(1,30)+i*2));
      if(final || (sec.role!=='intro' && (light||b%3!==0))){
        const at=final?0:(b%2?.25:0);
        const d=final?0:motif+(ctx.rev[0]&&rs[0]()<.4?1:0);
        put(0,at,light&&!final&&b%4===2?.75-at:1-at,pitch(d,light?60:48),level(0,45));
        if(light&&!final&&b%4===2)put(0,.75,.23,pitch(d+2,60),level(0,36));
      }
      if(!final && (b%4===3 || light&&b%4===1)){
        const accent=rs[3]()<.5?h+4:h+7;
        put(3,.5,.18,pitch(accent,60),level(3,18));put(3,.8125,.16,pitch(accent+2,60),level(3,14));
      }
    } else if(style.texture==='piano'){
      const open=sec.role==='intro'||sec.role==='bridge'||sec.role==='outro';
      const cell=[theme[(b%2)*3],theme[(b%2)*3+1],theme[(b%2)*3+2]];
      const accents=final?[0]:open?(b%2?[.375]:[0,.625]):(b%2?[.125,.5,.8125]:[0,.375,.75]);
      accents.forEach((at,j)=>{
        const late=final?0:rs[0]()*0.012;
        put(0,at+late,(accents[j+1]??1)-at-.035,pitch(final?0:cell[j]+(ctx.rev[0]&&rs[0]()<.4?1:0),60),level(0,j===0?40:28));
      });
      for(const [i,d] of [h,h+4,h+8].entries())put(1,0,1,pitch(d,48),level(1,20)+i);
      put(2,0,1,pitch(h,36),level(2,31));
      if(!final && (!open||b%4===2)){
        const phase=Math.floor(rs[3]()*3);
        const pulses=open?[.5,.875]:[0,.25,.375,.625,.875];
        pulses.forEach((at,j)=>put(3,at,.09,pitch([h+7,h+9,h+11][(phase+j)%3],60),level(3,j===0?18:10)));
      }
    } else if(style.texture==='afterglow'){
      const exposed=sec.role==='bridge'||sec.role==='intro';
      put(2,0,1,pitch(final?0:b%8<6?0:h,24),level(2,30));
      [h,h+4,h+8].forEach((d,i)=>put(1,0,1,pitch(d,48)-(i===2&&b%4===3?1:0),level(1,22)));
      if(final||b%3!==(exposed?0:1)){
        const at=final?0:(b%2?.625:.25);
        put(0,at,1-at,pitch(final?0:motif,60),level(0,37));
      }
      if(!final&&b%3===2){
        const echo=pitch(h+4+(b%2?2:0),60);
        [.25,.625,.875].forEach((t,j)=>put(3,t,.10,echo,level(3,28)-8*j));
      }
    } else if(style.texture==='neon'){
      const driving=energy>.55&&!final;
      (driving?[0,.25,.5,.75]:[0]).forEach((at,i)=>put(2,at,driving?.16:1,pitch(h+(i===3?4:0),36),level(2,48)));
      [h+2,h+6,h+8].forEach(d=>put(1,0,1,pitch(d,48),level(1,28)));
      if(final||b%2===0||returnLift)put(0,final?0:.125,final?1:.70,pitch(final?0:motif,60),level(0,41));
      if(!final)(driving?[.125,.375,.5625,.875]:[.375,.875]).forEach((t,i)=>
        put(3,t,.075,pitch(h+[4,7,2,9][(i+b)%4],60),level(3,i===0?35:23)));
    } else if(style.texture==='chamber'){
      const dance=sec.role==='b'||returnLift;
      (dance&&!final?[0,2/3]:[0]).forEach((at,i)=>put(2,at,final?1:.22,pitch(h+(i?4:0),36),level(2,37)));
      [h+2,h+6].forEach(d=>put(1,0,1,pitch(d,48),level(1,33)));
      const line=final?[0]:dance?[0,1/3,.5,5/6]:(b%3===1?[1/3]:[0,2/3]);
      line.forEach((at,i)=>put(0,at,((line[i+1]??1)-at)*.91,pitch(final?0:theme[(b*2+i)%theme.length],60),level(0,46-i*2)));
      if(!final)[1/6,.5,5/6].forEach((at,i)=>put(3,at,.12,pitch(h+[0,4,9][(i+b)%3],60),level(3,22+i*2)));
    } else if(style.texture==='orbit'){
      const lift=sec.role==='b'||returnLift;
      put(2,0,1,pitch(lift?h:0,24),level(2,29));
      [h,h+4,h+8].forEach((d,i)=>put(1,0,1,pitch(d,i===2?60:48),level(1,23)+i));
      if(final||b%2===0||lift)put(0,0,1,pitch(final?0:motif,60),level(0,37));
      if(!final)(lift?[0,.25,.5,.75]:[0,.5]).forEach((at,i)=>
        put(3,at,lift?.21:.42,pitch(h+[4,7,8,7][i],60),level(3,19)+Math.min(b,6)));
    } else if(style.texture==='glass'){
      put(2,0,final?1:.83,pitch(h,36),level(2,31));
      [h+4,h+8,h+9].forEach(d=>put(1,0,1,pitch(d,48),level(1,19)));
      if(final||b%3!==1){
        const line=final?[0]:b%2?[.5]:[0,.625];
        line.forEach((at,i)=>put(0,at,(line[i+1]??1)-at,pitch(final?0:theme[(b+i)%theme.length],60),level(0,39)));
      }
      if(!final)(b%2?[.125,.5,.875]:[0,.375,.75]).forEach((at,i)=>
        put(3,at,.085,pitch(h+[2,7,4][(i+b)%3],60),level(3,30-i*3)));
    } else {
      // Sustain the outer voices while an inner line changes the harmony underneath them.
      put(2,0,1,pitch(h,36),level(2,35));
      [h+2,h+7].forEach((d,i)=>put(1,0,1,pitch(d,48),level(1,31)+i*4));
      const answer=sec.role!=='intro'||b>=sec.bars/2;
      if(answer||final){
        const d=final?0:motif+(ctx.rev[0]&&rs[0]()<.35?1:0);
        const divided=!final && b%4===2;
        put(0,0,divided?.5:1,pitch(d+(returnLift?7:0),60),level(0,44));
        if(divided)put(0,.5,.5,pitch(d+(returnLift?7:0)+(d>3?-1:1),60),level(0,46));
      }
      if(!final && (energy>.44||b%2===1)){
        const inner=h+(b%2?4:3),direction=(rs[3]()<.5?-1:1);
        put(3,0,.5,pitch(inner,48),level(3,29));
        put(3,.5,.5,pitch(inner+direction,48),level(3,31));
      }
    }
  }
  function compose(p) {
    if(!valid(p))throw Error('Unsupported song settings.');
    const c=p.config, style=styles[c.genre], scale=scales[c.mode], secs=sections(c);
    const [num,den]=meters[c.meter], barTicks=PPQ*4*num/den, tracks=parts.map(()=>[]);
    const pitch=(degree,base)=>base+c.key+scale[((degree%7)+7)%7]+12*Math.floor(degree/7);
    const drone=c.genre==='Drone', ambient=c.genre==='Ambient', chill=c.genre==='Chillout', newAge=c.genre==='New age';
    const add=(r,t,d,n,v)=>tracks[r].push({t:Math.round(t),d:Math.max(1,Math.round(d)),n:clamp(Math.round(n),0,127),v:clamp(Math.round(v),1,120)});
    for(const [si,sec] of secs.entries()){
      const f=familyId[sec.role], rev=p.revisions[si], ps=p.partSeeds;
      const {theme,harmony,pace,grooves,depth}=rev[4]??originalMaterial(p,f);
      const firstNote=tracks.map(t=>t.length);
      const sectionEnergy={intro:.34,a:.65,b:.8,return:.74,bridge:.44,peak:.91,outro:.32}[sec.role];
      let lastVoicing=null;
      for(let b=0;b<sec.bars;b++){
        const bar=sec.bar+b,start=bar*barTicks,final=bar===c.bars-1;
        const progress=b/Math.max(1,sec.bars-1);
        const slope={intro:.23,a:.08,b:.14,return:.09,bridge:-.08,peak:.18,outro:-.3}[sec.role];
        const energy=clamp(sectionEnergy+slope*(progress-.5),.1,1);
        const h=final?0:(bar===c.bars-2&&!drone?4:harmony[Math.floor(b/pace)%8]);
        if(style.composer){
          const rs=ps.map((seed,r)=>random(hash(seed,rev[r],f,b,r)));
          composerBar(style,{b,sec,final,h,theme,rs,rev,energy,pitch,barTicks,start,add});
          continue;
        }
        const chord=[h,h+2,h+4]; if(chill || (ambient && b%4<2))chord.push(h+6);
        if(drone){chord.splice(0,chord.length,0,4,(h===0?7:h+7));}
        const rs=ps.map((s,r)=>random(hash(s,rev[r],f,b,r)));
        const vel=(r,base)=>base+energy*21+rs[r]()*10;
        // Select close inversions by minimum voice movement, with wider spacing in open styles.
        const base=48, shiftVoice=Math.floor(rs[1]()*3);
        const voicings=chord.map((_,k)=>chord.map((d,j)=>pitch(d+(j<k?7:0),base)).sort((a,b)=>a-b));
        const distance=v=>v.reduce((sum,n,j)=>sum+Math.abs(n-(lastVoicing?.[j]??(52+c.key+j*4))),0);
        voicings.sort((a,b)=>distance(a)-distance(b));
        const voices=voicings[(rev[1]&&shiftVoice===0&&voicings.length>1)?1:0].slice();
        lastVoicing=voices.slice();
        if(style.spread)voices[voices.length-1]+=12;
        const chordGate=final?1:(chill?.81:1);
        const attacks=chill && energy>.5 && !final?[0,.625]:[0];
        attacks.forEach((at,k)=>[...new Set(voices)].forEach((n,j)=>{
          const offset=(chill?0:Math.floor(rs[1]()*9))*j;
          const end=(attacks[k+1]??1)*barTicks;
          add(1,start+at*barTicks+offset,(end-at*barTicks-offset)*chordGate,n,vel(1,39)+j);
        }));
        const beat=barTicks/num;
        const bass=final?[0]:style.bass===3&&energy>.5?[0,.375,.6875]:style.bass===2&&energy>.7?[0,.25,.5,.75]:style.bass===1&&energy>.6&&(!newAge||b%4===2)?[0,.5]:[0];
        bass.forEach((x,j)=>{
          const d=drone?0:h+(j>0&&rs[2]()>.45?4:0);
          const gate=final||drone||ambient?1:(chill?.72:.91);
          let n=pitch(d,36);while(n>54)n-=12;
          add(2,start+x*barTicks,((bass[j+1]??1)-x)*barTicks*gate,n,vel(2,46));
        });
        // The A motif reappears in reprise and climax. Strong beats and final cadences fit the harmony.
        const melodyActive=final || (drone?b%4===2:ambient?b%3!==1:sec.role!=='intro'||b>=Math.floor(sec.bars/2));
        if(melodyActive){
          let rhythm=drone?[.25]:ambient?(b%2?[.5]:[0,.625]):chill?[.125,.4375,.75]:
            c.genre==='Cinematic'?(energy>.7?[0,.375,.5,.75]:[0,.5]):
            newAge?(b%4===3?[0,.5]:(c.meter==='6/8'?[0,1/3,.5,5/6]:[0,.375,.5,.75])):
            c.meter==='6/8'?[0,1/3,.5,5/6]:[0,1/num,2/num,...(num===4?[.75]:[])];
          if(energy<.5&&rhythm.length>1)rhythm=rhythm.filter((_,i)=>i%2===0);
          if(final)rhythm=[0];
          rhythm.forEach((pos,j)=>{
            let d=theme[(b%4*3+j)%theme.length];
            if(newAge&&b%4===3&&j===0)d=theme[0];
            if(rev[0] && rs[0]()<.34)d+=rs[0]()<.5?-1:1;
            if(j===0||b%4===3&&j===rhythm.length-1){
              const targets=[...chord.map(n=>n-7),...chord,...chord.map(n=>n+7)];
              d=targets.reduce((a,n)=>Math.abs(d-a)<=Math.abs(d-n)?a:n);
            }
            if(final)d=0;
            const next=rhythm[j+1]??1;
            add(0,start+pos*barTicks,(next-pos)*barTicks*(final?1:(.76+rs[0]()*.21)),
                pitch(d+(sec.role==='peak'&&b>=sec.bars/2?7:0),60),vel(0,49));
          });
        }
        const arpActive=!final&&(drone?energy>.65&&b%4===3:ambient?b%3===0:energy>.4||b%2===1);
        if(arpActive){
          const count=drone?2:ambient?3:newAge?(c.meter==='6/8'?6:6+(energy>.75?2:0)):style.arp===4?(energy>.7?num*3:num):style.arp===3?(c.meter==='6/8'?6:num*2):num;
          const ar=rs[3],phase=Math.floor(random(hash(ps[3],rev[3],f))()*chord.length);
          for(let j=0;j<count;j++){
            let index=(j+phase+b%2)%(chord.length*2-2);
            if(index>=chord.length)index=chord.length*2-2-index;
            let at=j/count*barTicks;if(chill&&j%2)at+=beat*.1;
            add(3,start+at,Math.min(barTicks-at,barTicks/count*(ambient?.88:.5+ar()*.28)),
                pitch(chord[index]+(newAge&&j===Math.floor(count/2)?7:0),60),vel(3,24)+(j%2?0:5));
          }
        }
      }
      // Rephrase each unlocked lane on the beat grid before tying sustained notes.
      // Piecewise-linear time maps are monotone and preserve bar and section boundaries.
      for(let r=0;r<4;r++){
        if(!depth[r])continue;
        const phrase=random(grooves[r]),strength=depth[r],pivot=[.25,.5,.75][Math.floor(phrase()*3)];
        const bend=(phrase()<.5?-1:1)*strength*Math.min(pivot,1-pivot)*.62;
        const duty=1-strength*phrase()*(r===1||r===2?.12:.38);
        const gap=Math.floor(phrase()*4),thin=(r===0||r===3)&&strength>.55;
        const moved=x=>x<=pivot?x*(pivot+bend)/pivot:pivot+bend+(x-pivot)*(1-pivot-bend)/(1-pivot);
        const startTick=sec.bar*barTicks, fresh=tracks[r].splice(firstNote[r]);
        for(const n of fresh){
          const bar=Math.floor((n.t-startTick)/barTicks),origin=startTick+bar*barTicks;
          const at=(n.t-origin)/barTicks,end=(n.t+n.d-origin)/barTicks;
          if(thin && bar%4===gap && at>.2 && at<.87 && bar+sec.bar!==c.bars-1)continue;
          const t=origin+Math.round(moved(at)*barTicks);
          const sustain=end>=.9999&&at<.02;
          const off=origin+Math.round(moved(end)*barTicks);
          tracks[r].push({...n,t,d:Math.max(1,Math.round((off-t)*(sustain?1:duty)))});
        }
      }
      // Tie equal pitches within a section for the sustained styles; leave edit boundaries intact.
      if(drone||ambient||style.composer){
        for(const r of [1,2]){
          const from=sec.bar*barTicks, sectionNotes=tracks[r].filter(n=>n.t>=from);
          tracks[r]=tracks[r].filter(n=>n.t<from);
          const previous=new Map();
          for(const n of sectionNotes){
            const old=previous.get(n.n);
            if(old&&n.t>=old.t+old.d&&n.t-old.t-old.d<36){old.d=n.t+n.d-old.t;}
            else{tracks[r].push(n);previous.set(n.n,n);}
          }
        }
      }
    }
    tracks.forEach(track=>track.sort((a,b)=>a.t-b.t||a.n-b.n));
    return {config:{...c},sections:secs,barTicks,total:c.bars*barTicks,tracks};
  }
  function region(song,scope=-1) {
    const sec=song.sections[scope];
    return sec?[sec.bar*song.barTicks,(sec.bar+sec.bars)*song.barTicks]:[0,song.total];
  }
  function midi(song,part=-1,scope=-1,bpm=song.config.bpm,channels=[1,2,3,4]) {
    const [from,to]=region(song,scope), c=song.config;
    const str=s=>Array.from(new TextEncoder().encode(s));
    const word=x=>[x>>8&255,x&255], long=x=>[x>>>24,x>>16&255,x>>8&255,x&255];
    const vlq=x=>{const out=[x&127];while((x=Math.floor(x/128))>0)out.unshift((x&127)|128);return out;};
    const meta=(kind,bytes)=>[255,kind,...vlq(bytes.length),...bytes];
    const evt=(t,order,data)=>({t,order,data});
    function chunk(events) {
      const bytes=[];let t=0;events.sort((a,b)=>a.t-b.t||a.order-b.order);
      for(const e of events){bytes.push(...vlq(e.t-t),...e.data);t=e.t;}
      bytes.push(...vlq(to-from-t),255,47,0);
      return [...str('MTrk'),...long(bytes.length),...bytes];
    }
    const us=Math.round(60000000/bpm), [num,den]=meters[c.meter];
    const info=[evt(0,-5,meta(81,long(us).slice(1))),evt(0,-4,meta(88,[num,Math.log2(den),den===8?36:24,8]))];
    for(const sec of song.sections){const t=sec.bar*song.barTicks;if(t>=from&&t<to)info.push(evt(t-from,-1,meta(6,str(sec.name))));}
    const chunks=[];
    if(part<0)chunks.push(chunk([evt(0,-6,meta(3,str('Song map'))),...info]));
    for(let r=0;r<4;r++){
      if(part>=0&&part!==r)continue;
      const channel=channels[r]-1;
      const events=[evt(0,-6,meta(3,str(parts[r]))),evt(0,-2,[192+channel,styles[c.genre].programs[r]])];
      if(part>=0)events.push(...info);
      for(const n of song.tracks[r]){
        if(n.t>=to||n.t+n.d<=from)continue;
        events.push(evt(Math.max(n.t,from)-from,1,[144+channel,n.n,n.v]),evt(Math.min(n.t+n.d,to)-from,0,[128+channel,n.n,0]));
      }
      chunks.push(chunk(events));
    }
    return new Uint8Array([...str('MThd'),...long(6),...word(part<0?1:0),...word(chunks.length),...word(PPQ),...chunks.flat()]);
  }
  return {PPQ,parts,keys,styles,scales,meters,forms,defaults,sections,editSection,project,vary,newIdea,valid,compose,region,midi};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=SW;
