/* Shared offline composition engine. All example phrases are newly authored scale degrees.
   The conditional counts below are fitted locally, separately for melody and harmony. */
const SW = (() => {
  const PPQ = 480;
  const parts = ['Melody', 'Chords', 'Bass', 'Arp', 'Response','Drums'];
  const keys = ['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const forms = {
    'Pop single': [['Intro',1,'intro'],['Verse',1,'a'],['Pre-chorus',1,'b'],['Chorus',1,'return'],['Verse II',1,'a'],['Middle eight',1,'bridge'],['Final chorus',1,'peak'],['Outro',1,'outro']],
    'Extended mix': [['Instrumental intro',1,'intro'],['Verse',2,'a'],['Refrain',1,'return'],['Break',1,'bridge'],['Lift',1,'b'],['Double chorus',2,'peak']],
    'Slow reveal': [['Prelude',1,'intro'],['Low verse',2,'a'],['Lift',1,'b'],['Refrain',1,'return'],['Instrumental',1,'bridge'],['High reprise',1,'peak'],['Coda',1,'outro']],
    'Hook first': [['Hook intro',1,'return'],['Verse',1,'a'],['Chorus',1,'return'],['Verse II',1,'a'],['Turnaround',1,'b'],['Break',1,'bridge'],['Final refrain',1,'peak'],['Outro',1,'outro']]
  };
  const channels=[1,2,3,4,5,10];
  const drumNames=['Kick','Snare','Clap','Closed hat','Open hat','Tom high','Tom low','Percussion','Crash'];
  const drumNotes=[36,38,39,42,46,43,41,37,47];
  // Original short scale-degree examples and rhythm cells for each reference.
  // Onsets use hexadecimal sixteenth positions, 0 through f.
  const steps=s=>[...s].map(x=>parseInt(x,16));
  const styles={};
  function profile(artist,name,bpm,key,mode,form,pace,melody,harmony,lead,bass,chord,arp,kick,drums,gate,colour,pack,patches){
    styles[name]={artist,bpm,key,mode,form,change:pace,phrases:melody,harmony,lead:steps(lead),bass:steps(bass),
      chord:steps(chord),arp:steps(arp),kick:steps(kick),drums,gate,title:colour,pack,patches,
      reply:drums==='latin'?[9,12,15]:gate>=5?[10,14]:[8,11,14],
      voicing: ['Slow reveal','Extended mix'].includes(form)?[0,4,6,9]:[0,2,4,7]};
  }
  const cretu='Michael Cretu',sandra='Sandra',modern='Modern Talking',alpha='Alphaville',psb='Pet Shop Boys';
  profile(cretu,'Samurai',112,2,'Minor','Slow reveal',2,'15324531 22546532 51326421','16451461 14165154','036a','02468ace','08','026a','08a','march',4,'A clipped minor-key call, broad brass replies and measured tom pickups.','Retrowave 80s',['LD reedy mono','BR wide brass','BA hollow pulse','PL muted metal','BR synth horn','DK gated toms']);
  profile(cretu,'Gambit',116,7,'Minor','Extended mix',1,'31254325 13544213 25132156','14251465 61451425','0259d','0368be','26ae','0258ad','069','machine',2.8,'Short keyboard exchanges over a restless syncopated bass.','Synthwave II',['SY nasal lead','KB digital keys','BA short analog','PL glass','BL metallic','DK tight electronic']);
  profile(sandra,'Secret Land',104,4,'Minor','Slow reveal',2,'32545632 26532135 15654532','16431645 41651463','057c','038ac','0','268e','08','air',6,'Leave space around a breathy lead, a glass pulse and long suspended chords.','Synthwave III',['LD airy','ST soft strings','BA round','BL glass','VC breath','DK soft snare']);
  profile(sandra,'In the Heat of the Night',108,9,'Minor','Slow reveal',2,'11235423 54322135 21553213','11461541 16451145','037a','02368ace','08','1369bd','08b','shadow',5,'A low repeated verse cell opens into a higher, sustained refrain.','Retrowave 80s',['LD smoky','SY dark pad','BA resonant','PL muted','VC choir','DK deep snare']);
  profile(sandra,'Maria Magdalena',106,5,'Minor','Hook first',1,'35321565 12355643 55132432','16451465 41651645','0258c','02468ace','26ae','02468ace','048c','disco',3.4,'Octave bass, bright offbeat chords and a second voice answering the refrain.','Italo Disco 1',['LD bright saw','BR soft poly brass','BA octave','PL picked','VC backing choir','DK disco clap']);
  profile(sandra,'Heaven Can Wait',121,7,'Major','Pop single',1,'13568653 34565532 23568765','14561451 15641451','046ad','0268ace','048c','258ad','048c','lift',5,'An upward topline over ringing keys, open hats and bright chorus harmony.','Italo Disco 3',['LD singing','KB bright keys','BA elastic','BL bell','ST high strings','DK bright pop']);
  profile(sandra,'Innocent Love',117,0,'Minor','Hook first',1,'32135543 52353215 13235421','14651451 16451461','0369e','03689ce','26ae','1369','048b','bounce',3,'Bouncing bass pickups and short chord jabs leave holes for the hook.','Italo Disco 2',['LD punchy','CH stab','BA bouncy','PL muted','BR bright stab','DK punchy clap']);
  profile(modern,'You’re My Heart, You’re My Soul',119,4,'Minor','Extended mix',1,'13556532 23565321 35123565','16451465 64151645','048b','02468ace','26ae','02468ace','048c','disco',5,'A patient instrumental entrance, alternating octaves and a high choir answer.','Italo Disco 1',['LD sweet','ST disco strings','BA analog octave','PL pick','VC high choir','DK disco']);
  profile(modern,'Brother Louie',110,7,'Minor','Hook first',1,'55132531 35321553 11543215','14651465 16431451','0237ac','02568ade','26ae','0258ad','048ac','bounce',3,'Repeated hook syllables sit above a clipped bass and syncopated responses.','Italo Disco 2',['LD vocal synth','CH bright stabs','BA punch','PL muted guitar','VC falsetto','DK snappy']);
  profile(modern,'Cheri, Cheri Lady',115,2,'Minor','Pop single',1,'35655321 23566543 32135321','16451451 64151465','0358c','02468ace','28ae','26ae','048c','disco',4.7,'A lilting question and answer with short picked offbeats under string chords.','Italo Disco 3',['LD lyrical','ST ensemble','BA round octave','PL guitar','VC high choir','DK disco clap']);
  profile(alpha,'Big in Japan',100,2,'Minor','Pop single',2,'15132531 21565321 53215325','16451435 14651645','037ad','0368b','08','0258ad','08a','shadow',4,'A spare verse leaves room for a repeating digital figure and a wide refrain.','Synthwave',['LD narrow pulse','ST wide strings','BA mono','PL digital','BL bright bell','DK drum machine']);
  profile(alpha,'Summer in Berlin',111,9,'Dorian','Extended mix',2,'25325432 12543561 35653251','14261451 61421451','056ac','0258ace','08','0358be','068c','machine',5,'Rolling sequence under long vocal phrases, with a motoric instrumental break.','Synthwave IV',['LD soft saw','SY warm pad','BA rolling','PL pulse','SY high shimmer','DK tight machine']);
  profile(alpha,'A Victory of Love',108,0,'Minor','Slow reveal',2,'11223565 12356875 23568653','11461465 16451145','058c','048ac','0','0268ac','08','air',7,'A low-register opening, widening intervals and a high final reprise.','Retrowave 80s',['LD dark mono','ST slow ensemble','BA sustained','PL soft','VC expansive choir','DK deep toms']);
  profile(alpha,'Sounds Like a Melody',137,4,'Minor','Extended mix',1,'13568765 35686532 23565432','16451465 41651451','0258be','02468ace','08','02468ace','048c','lift',4,'Fast pulse against long melody notes, with string responses in the final refrain.','Synthwave II',['LD singing saw','ST ensemble','BA fast pulse','PL sequencer','ST high strings','DK driving']);
  profile(psb,'It’s a Sin',126,0,'Minor','Pop single',1,'55346532 13568653 56543215','16425145 14651645','0468c','02468acf','048c','0369ce','048c','theatre',5,'Broad minor chords, orchestral punctuation and dramatic fills into the chorus.','Retrowave 80s',['LD firm mono','ST orchestral','BA sequenced','PL hard pick','OR orchestra hit','DK large snare']);
  profile(psb,'Domino Dancing',110,5,'Minor','Extended mix',1,'35325123 53215323 13532153','14251465 16421451','0369d','0368bde','36be','1369ce','069c','latin',3,'Interlocking bass pickups and hand percussion beneath short brass replies.','Italo Disco 2',['LD dry vocal','BR short brass','BA syncopated','PL nylon','BR trumpet','DK Latin percussion']);
  profile(psb,'Heart',128,9,'Minor','Hook first',1,'13555321 35325653 55123565','16451465 14651641','0258a','02468ace','26ae','02469ace','048c','lift',3.3,'A repeated-note hook and tight octave pulse, with clipped replies on the backbeat.','Italo Disco 3',['LD short saw','CH stab','BA octave','PL bright','VC vocal hit','DK tight disco']);
  const scales = { Phrygian:[0,1,3,5,7,8,10], Major:[0,2,4,5,7,9,11], Minor:[0,2,3,5,7,8,10], Dorian:[0,2,3,5,7,9,10] };
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
  function defaults(genre='Samurai') {
    const s=styles[genre]; return {genre,bpm:s.bpm,key:s.key??0,mode:s.mode,meter:'4/4',form:s.form,bars:96,drumMap:drumNotes.slice()};
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
      revisions:secs.map(()=>parts.map(()=>0)),locks:parts.map(()=>false)};
  }
  const familyId={intro:0,a:0,return:1,peak:1,outro:0,b:2,bridge:2};
  function originalMaterial(p,f){
    const [melody,harm]=models[p.config.genre];
    return {theme:sample(melody,16,random(hash(p.partSeeds[0],f)),[1,3,5][f]),
      harmony:sample(harm,8,random(hash(p.seed,f,73)),[1,4,6][f]),pace:styles[p.config.genre].change,
      grooves:parts.map(()=>0),depth:parts.map(()=>0)};
  }
  function regenerate(p,scope,seed,amount=55){
    const q=JSON.parse(JSON.stringify(p)),secs=sections(q.config),v=clamp(amount/100,0,1);
    const [melody,harm]=models[q.config.genre],style=styles[q.config.genre];
    const anyLock=q.locks.some(Boolean);
    q.revisions.forEach((row,i)=>{
      if((scope>=0&&scope!==i)||q.locks.every(Boolean))return;
      const f=familyId[secs[i].role],plan=row[parts.length]??originalMaterial(p,f);
      // Related sections draw on the same new material, keeping a recognisable reprise.
      const phrase=random(hash(seed,f,391)),chords=random(hash(seed,f,457));
      const blend=(old,next,chance,rng)=>old.map((n,j)=>rng()<chance?next[j]:n);
      if(!q.locks[0]&&!q.locks[4]){
        const next=sample(melody,16,phrase,1+Math.floor(phrase()*6));
        plan.theme=blend(plan.theme,next,v**1.15,phrase);
      }
      if(!anyLock && v>.15){
        const first=style.harmony.replaceAll(' ','');
        const next=sample(harm,8,chords,Number(first[Math.floor(chords()*first.length)]));
        plan.harmony=blend(plan.harmony,next,v**1.5,chords);
        if(chords()<v*v)plan.pace=Math.max(1,Math.round(style.change*[.5,1,1.5,2][Math.floor(chords()*4)]));
      }
      for(let r=0;r<parts.length;r++)if(!q.locks[r]){
        row[r]=hash(seed,i,r);
        if(v>.1){plan.grooves[r]=hash(seed,f,r,481);plan.depth[r]=v;}
      }
      row[parts.length]=plan;
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
      Array.isArray(plan.grooves)&&plan.grooves.length===parts.length&&plan.grooves.every(validSeed)&&
      Array.isArray(plan.depth)&&plan.depth.length===parts.length&&plan.depth.every(v=>Number.isFinite(v)&&v>=0&&v<=1);
  }
  const validSeed=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
  function valid(p) {
    const c=p?.config;
    return p?.version===1 && c && Object.hasOwn(styles,c.genre) && Object.hasOwn(forms,c.form) &&
      Object.hasOwn(scales,c.mode) && Object.hasOwn(meters,c.meter) && Number.isInteger(c.key) && c.key>=0 && c.key<12 &&
      Number.isFinite(c.bpm) && c.bpm>=20 && c.bpm<=400 && Array.isArray(c.drumMap)&&c.drumMap.length===drumNotes.length&&new Set(c.drumMap).size===drumNotes.length&&c.drumMap.every(n=>Number.isInteger(n)&&n>=0&&n<=127)&& validLength(c) && validSeed(p.seed) &&
      Array.isArray(p.partSeeds)&&p.partSeeds.length===parts.length&&p.partSeeds.every(validSeed) &&
      Array.isArray(p.locks)&&p.locks.length===parts.length&&p.locks.every(v=>typeof v==='boolean') &&
      Array.isArray(p.revisions)&&p.revisions.length===sections(c).length &&
      p.revisions.every(row=>Array.isArray(row)&&(row.length===parts.length||row.length===parts.length+1&&validPlan(row[parts.length]))&&row.slice(0,parts.length).every(validSeed));
  }
  function writeDrums(track,style,map,{bar,b,sec,unit,sparse,ambient,drop,final,rng}){
    const type=style.drums,fill=b===sec.bars-1&&!sparse, phraseEnd=b%4===3;
    const hit=(k,step,velocity,gate=1.65)=>{
      const t=Math.round((16*bar+step)*unit);
      track.push({k,t,n:map[k],d:Math.max(1,Math.round((16*bar+Math.min(16,step+gate))*unit)-t),
        v:clamp(Math.round(velocity+rng()*7),1,125)});
    };
    if(final){hit(0,0,100);hit(8,0,89,12);return;}
    const reduced=sparse||ambient;
    const kick=reduced?(type==='air'&&b%2?[8]:[0,8]):style.kick;
    kick.forEach((t,i)=>hit(0,t,i===0?105:91));
    if(drop&&b===0)hit(8,0,99,6);
    const backbeat=reduced?[12]:[4,12];
    backbeat.forEach(t=>{
      hit(1,t,reduced?78:96);
      if(drop||['disco','bounce','latin'].includes(type)&&!reduced)hit(2,t+.08,drop?89:77);
    });
    for(let t=0;t<16;t+=reduced?4:2){
      const open=!reduced&&t%4===2&&(drop||t===14)&&!(fill&&t>=12);
      hit(open?4:3,t,t%4===0?68:open?76:58,open?1.8:.85);
    }
    if(type==='latin'&&!reduced){
      [3,6,10,15].forEach((t,i)=>hit(7,t,i%2?85:72));
    }else if(!reduced&&(type==='machine'||type==='march'||phraseEnd))hit(7,9,66);
    if(fill||phraseEnd&&!reduced&&rng()<.6){
      const seq=type==='theatre'||type==='march'?[10,12,13,14,15]:type==='air'?[10,14]:[11,14,15];
      seq.forEach((t,i)=>hit(i<seq.length/2?5:6,t,72+i*6,.8));
    }
    if(!reduced&&rng()<.28)hit(1,15,49,.75);
  }
  function compose(p) {
    if(!valid(p))throw Error('Unsupported Synthpop 80 project.');
    const c=p.config,style=styles[c.genre],scale=scales[c.mode],secs=sections(c);
    const [num,den]=meters[c.meter],barTicks=PPQ*4*num/den,unit=barTicks/16,tracks=parts.map(()=>[]);
    const pitch=(d,base)=>base+c.key+scale[((d%7)+7)%7]+12*Math.floor(d/7);
    for(const [si,sec] of secs.entries()){
      const family=familyId[sec.role],row=p.revisions[si];
      const plan=row[parts.length]??originalMaterial(p,family);
      const drop=['return','peak'].includes(sec.role),build=sec.role==='b',ambient=sec.role==='bridge';
      const groove=(steps,lane,maxStep=16)=>{
        if(plan.depth[lane]<.35)return steps;
        const shift=plan.grooves[lane]%3-1;
        return [...new Set(steps.map((s,i)=>i%2===1?clamp(s+shift,0,maxStep-1):s))].sort((a,b)=>a-b);
      };
      for(let b=0;b<sec.bars;b++){
        const bar=sec.bar+b,opening=sec.role==='intro',closing=sec.role==='outro',final=bar===c.bars-1;
        const sparse=opening||closing,firstHalf=b<sec.bars/2,buildEnd=build&&b===sec.bars-1;
        const h=final?0:plan.harmony[Math.floor(b/plan.pace)%8];
        const rng=p.partSeeds.map((s,r)=>random(hash(s,row[r],family,b,r)));
        // Lead and reply share their motif. Response has a reserved half-bar, even at maximum variety.
        const phrase=plan.theme,phraseAt=(b%4)*3,answerBar=b%2===1&&!sparse&&!buildEnd;
        const velocity=(r)=>[77,57,85,54,82][r]+(drop?14:build?7:0)-(sparse?13:0)+rng[r]()*10;
        const put=(r,step,length,d,base,accent=0)=>{
          const t=Math.round((bar*16+step)*unit);
          const end=Math.round((bar*16+Math.min(16,step+length))*unit);
          tracks[r].push({t,d:Math.max(1,end-t),n:clamp(pitch(d,base),0,127),v:Math.round(clamp(velocity(r)+accent,1,124))});
        };
        // The last beat of a build opens space before the drop.
        const pulse=(r,pattern,gate,fn,limit=16)=>{
          const beats=groove(pattern.filter(x=>x<limit),r,limit).filter(x=>x<limit);
          beats.forEach((t,j)=>fn(t,Math.min((beats[j+1]??limit)-t,gate),j));
        };
        writeDrums(tracks[5],style,c.drumMap,{bar,b,sec,unit,sparse,ambient,drop,final,rng:rng[5]});
        if(final){put(2,0,12,0,36);[0,4,7].forEach(d=>put(1,0,14,d,48));continue;}
        const leadOn=!sparse||(opening?!firstHalf&&b%2===0:firstHalf&&b%2===0);
        if(leadOn){
          const limit=answerBar?8:buildEnd?12:16;
          const line=ambient||sparse?[0,6]:style.lead;
          pulse(0,line,ambient?7.6:style.gate,(t,d,j)=>{
            const degree=j===0&&b%2===0?h:phrase[(phraseAt+j)%16];
            put(0,t,d,degree+(drop&&style.gate>=4?2:0),c.genre==='A Victory of Love'&&!drop?48:60,j===0?5:0);
          },limit);
        }
        if(answerBar){
          pulse(4,style.reply,ambient?2.8:1.75,(t,d,j)=>{
            const tail=phrase[(phraseAt+2)%16];
            const answer=j===style.reply.length-1?h+4:tail+(j%2?-2:2);
            put(4,t,d,answer,60,j===0?6:0);
            if(drop&&style.artist===modern)put(4,t,d,answer+2,72,-11);
            if(drop&&c.genre==='Sounds Like a Melody')put(4,t,d,answer+4,60,-8);
          });
        }
        if(drop&&b%4===0){
          put(4,0,3.5,h+4,48,17);
          if(style.drums==='theatre')put(4,0,3.5,h,60,9);
        }
        if(buildEnd)put(4,14,1.7,h+7,60,12);
        const chords=ambient||sparse?[0]:style.chord;
        pulse(1,chords,chords.length===1?15.6:3.1,(t,d)=>style.voicing.forEach(n=>put(1,t,d,n+h,48)),buildEnd?12:16);
        if(!ambient||!firstHalf){
          const bass=sparse||ambient?[2,6,10,14]:style.bass;
          pulse(2,bass,style.drums==='air'?3.5:1.65,(t,d,j)=>{
            const turn=(j===bass.length-1&&b%4===3)||(j%3===2&&plan.depth[2]>.65&&rng[2]()<.35);
            put(2,t,d,h+(turn?4:(j%2&&['disco','lift','bounce'].includes(style.drums)?7:0)),h>4?24:36);
          },buildEnd?12:16);
        }
        if(!sparse||(!firstHalf&&opening)||(firstHalf&&closing)){
          const seq=ambient?style.arp.filter((_,j)=>j%2===0):style.arp;
          const arp=build&&!firstHalf?[...new Set([...seq,10,11,12,13,14,15])].sort((a,b)=>a-b):seq;
          pulse(3,arp,1.18,(t,d,j)=>{
            const phase=(b%2+plan.grooves[3]%4+j)%4;
            put(3,t,d,h+[0,4,7,2][phase],60,j%3===0?4:0);
          },buildEnd?12:16);
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
  function midi(song,part=-1,scope=-1,bpm=song.config.bpm,assigned=channels,stem=-1) {
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
    for(let r=0;r<parts.length;r++){
      if(part>=0&&part!==r)continue;
      const channel=assigned[r]-1;
      const events=[evt(0,-6,meta(3,str(stem>=0?drumNames[stem]:parts[r])))];
      if(part>=0)events.push(...info);
      for(const n of song.tracks[r]){
        if(stem>=0&&n.k!==stem)continue;
        if(n.t>=to||n.t+n.d<=from)continue;
        events.push(evt(Math.max(n.t,from)-from,1,[144+channel,n.n,n.v]),evt(Math.min(n.t+n.d,to)-from,0,[128+channel,n.n,0]));
      }
      chunks.push(chunk(events));
    }
    return new Uint8Array([...str('MThd'),...long(6),...word(part<0?1:0),...word(chunks.length),...word(PPQ),...chunks.flat()]);
  }
  return {PPQ,parts,channels,drumNotes,drumNames,keys,styles,scales,meters,forms,defaults,sections,editSection,project,vary,newIdea,valid,compose,region,midi};
})();
if(typeof module!=='undefined'&&module.exports) module.exports=SW;
