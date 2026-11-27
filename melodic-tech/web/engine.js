/* Shared offline composition engine. All example phrases are newly authored scale degrees.
   The conditional counts below are fitted locally, separately for melody and harmony. */
const SW = (() => {
  const PPQ = 480;
  const parts = ['Melody', 'Chords', 'Bass', 'Arp', 'Response'];
  const keys = ['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  const forms = {
    'Club mix': [['DJ intro',1,'intro'],['Groove',1,'a'],['Lift',1,'b'],['First drop',1,'return'],['Breakdown',1,'bridge'],['Peak drop',2,'peak'],['DJ outro',1,'outro']],
    'Anthem': [['Intro',1,'intro'],['Verse',1,'a'],['Pre-chorus',1,'b'],['Chorus',1,'return'],['Middle eight',1,'bridge'],['Final chorus',2,'peak'],['Outro',1,'outro']],
    'Progressive': [['Pulse',1,'intro'],['Layers',2,'a'],['Climb',1,'b'],['Suspension',1,'bridge'],['Release',2,'peak'],['DJ outro',1,'outro']],
    'Double drop': [['Intro',1,'intro'],['Call',1,'a'],['Build',1,'b'],['Drop',1,'return'],['Break',1,'bridge'],['Second build',1,'b'],['Impact',1,'peak'],['Outro',1,'outro']]
  };
  // Rhythms use sixteenth-note positions; pitch examples are original scale degrees.
  const styles = {
    'Anyma': {bpm:126,key:6,mode:'Minor',form:'Double drop',change:2,
      title:'Gated synth hook',instruments:'Pair a short mono lead with a wide, low synth hit on Response.',
      phrases:'11532451 53115325 35321851 15321551 55853121',harmony:'11664151 61451141 11631351 14661151',
      lead:[0,3,7,10,14],bass:[2,5,6,10,13,14],arp:[1,5,9,11,13,15],reply:[9,14],chord:[0,10],voicing:[0,4,8],programs:[81,89,38,98,62]},
    'Argy': {bpm:128,key:2,mode:'Phrygian',form:'Double drop',change:2,
      title:'Antiphonal chant',instruments:'Use a vocal-like lead and send the clipped answer to a contrasting synth.',
      phrases:'11215121 22112151 51522132 32112155 55122121',harmony:'11221151 12144121 11251121 14112251',
      lead:[0,2,6,8,11],bass:[2,6,10,14],arp:[0,3,6,10,14],reply:[8,11,14],chord:[2,8,14],voicing:[0,4,7],programs:[54,91,38,84,53]},
    'Loreen': {bpm:120,key:5,mode:'Minor',form:'Anthem',change:1,
      title:'Vocal dance anthem',instruments:'Give Melody a sustained vocal synth and Response a softer backing voice.',
      phrases:'12356865 35688753 23566532 56532123 34568532',harmony:'16451645 64156415 41654165 15641564',
      lead:[0,5,8,14],bass:[0,6,8,14],arp:[2,6,10,14],reply:[10,13],chord:[0],voicing:[0,2,4,8],programs:[85,89,39,88,52]},
    'Agents of Time': {bpm:125,key:9,mode:'Dorian',form:'Club mix',change:2,
      title:'Interlocking sequences',instruments:'Pan the glassy arp and answering pluck apart around the central lead.',
      phrases:'15264537 26371542 41526375 53614253 71526342',harmony:'14261425 61424152 12651425 46124162',
      lead:[1,4,7,10,13],bass:[0,3,6,8,11,14],arp:[0,2,5,8,10,12,15],reply:[9,12,15],chord:[0,8],voicing:[0,2,6],programs:[82,90,38,10,99]},
    'Miss Monique': {bpm:123,key:7,mode:'Dorian',form:'Progressive',change:4,
      title:'Progressive rolling bass',instruments:'Use a round bass, slow-opening pad and a delay pluck for the answering phrase.',
      phrases:'12543565 23565321 35654532 15324565 43235654',harmony:'11446651 16644151 14411665 61144651',
      lead:[0,6,11],bass:[1,2,3,5,6,7,9,10,11,13,14,15],arp:[2,5,9,13,15],reply:[10,14],chord:[0],voicing:[0,4,6,9],programs:[80,92,38,98,88]},
    'Melodic Tech General': {bpm:124,key:0,mode:'Minor',form:'Club mix',change:2,
      title:'Melodic club groove',instruments:'Try a warm pluck, offbeat bass and a bright stab on Response. Palette for CamelPhat and Vintage Culture references.',
      phrases:'13553215 35123565 53213531 15326531 32535121',harmony:'16451465 14651145 61451641 14561645',
      lead:[2,5,8,12,15],bass:[2,6,9,10,14],arp:[1,5,8,11,15],reply:[8,12],chord:[2,6,14],voicing:[0,2,4,6],programs:[81,89,38,84,61]}
  };
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
  function defaults(genre='Melodic Tech General') {
    const s=styles[genre]; return {genre,bpm:s.bpm,key:s.key??0,mode:s.mode,meter:'4/4',form:s.form,bars:96};
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
  const familyId={intro:0,a:0,return:0,peak:0,outro:0,b:1,bridge:2};
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
      Number.isFinite(c.bpm) && c.bpm>=20 && c.bpm<=400 && validLength(c) && validSeed(p.seed) &&
      Array.isArray(p.partSeeds)&&p.partSeeds.length===parts.length&&p.partSeeds.every(validSeed) &&
      Array.isArray(p.locks)&&p.locks.length===parts.length&&p.locks.every(v=>typeof v==='boolean') &&
      Array.isArray(p.revisions)&&p.revisions.length===sections(c).length &&
      p.revisions.every(row=>Array.isArray(row)&&(row.length===parts.length||row.length===parts.length+1&&validPlan(row[parts.length]))&&row.slice(0,parts.length).every(validSeed));
  }
  function compose(p) {
    if(!valid(p))throw Error('Unsupported Melodic Tech project.');
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
        if(final){put(2,0,12,0,36);[0,4,7].forEach(d=>put(1,0,14,d,48));continue;}
        const leadOn=!sparse||(opening?!firstHalf&&b%2===0:firstHalf&&b%2===0);
        if(leadOn){
          const limit=answerBar?8:buildEnd?12:16;
          const line=ambient||sparse?[0,6]:style.lead;
          pulse(0,line,c.genre==='Loreen'||ambient?7.6:2.7,(t,d,j)=>{
            const degree=j===0&&b%2===0?h:phrase[(phraseAt+j)%16];
            put(0,t,d,degree+(build&&b>=sec.bars/2?7:0),60,j===0?5:0);
          },limit);
        }
        if(answerBar){
          pulse(4,style.reply,ambient?2.8:1.75,(t,d,j)=>{
            const tail=phrase[(phraseAt+2)%16];
            put(4,t,d,j===style.reply.length-1?h+4:tail+(j%2?-2:2),60,j===0?6:0);
          });
        }
        if(drop&&b%4===0)put(4,0,3.5,h+4,48,17);
        if(buildEnd)put(4,14,1.7,h+7,60,12);
        const chords=ambient||sparse?[0]:style.chord;
        pulse(1,chords,chords.length===1?15.6:3.1,(t,d)=>style.voicing.forEach(n=>put(1,t,d,n+h,48)),buildEnd?12:16);
        if(!ambient||!firstHalf){
          const bass=sparse||ambient?[2,6,10,14]:style.bass;
          pulse(2,bass,c.genre==='Miss Monique'?0.79:1.62,(t,d,j)=>{
            const turn=(j===bass.length-1&&b%4===3)||(j%3===2&&plan.depth[2]>.65&&rng[2]()<.35);
            put(2,t,d,h+(turn?4:0),h>4?24:36);
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
  function midi(song,part=-1,scope=-1,bpm=song.config.bpm,channels=parts.map((_,i)=>i+1)) {
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
