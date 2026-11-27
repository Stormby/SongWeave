// Run with Node 18+. Parse exported bytes independently of the MIDI writer.
const assert=require('node:assert/strict'),W=require('../web/engine.js');
function parse(bytes){
  const data=Buffer.from(bytes);let pos=0;
  const str=n=>{const s=data.toString('utf8',pos,pos+n);pos+=n;return s;};
  function uint(n){const v=data.readUIntBE(pos,n);pos+=n;return v;}
  function vlq(){let v=0;for(let i=0;i<4;i++){const b=uint(1);v=v*128+(b&127);if(b<128)return v;}throw Error('Invalid delta');}
  assert.equal(str(4),'MThd');assert.equal(uint(4),6);
  const format=uint(2),nTracks=uint(2),ppq=uint(2),tracks=[];
  for(let i=0;i<nTracks;i++){
    assert.equal(str(4),'MTrk');const size=uint(4),end=pos+size;
    let t=0,ended=false;const notes=[],meta=[],pending=new Map();
    while(pos<end){
      t+=vlq();const status=uint(1);
      if(status===255){
        const type=uint(1),len=vlq(),value=Array.from(data.subarray(pos,pos+len));pos+=len;
        meta.push({type,value,t});if(type===47){assert.equal(len,0);assert.equal(pos,end);ended=true;}
      }else if(status>>4===12){uint(1);}
      else if(status>>4===9){const n=uint(1),v=uint(1),key=(status&15)*128+n;
        assert(v>0&&v<128);assert(!pending.has(key),'overlapping equal pitches');pending.set(key,{t,n,v});}
      else {assert.equal(status>>4,8);const n=uint(1);uint(1);const key=(status&15)*128+n;
        const start=pending.get(key);assert(start);assert(t>start.t);notes.push({...start,d:t-start.t});pending.delete(key);}
    }
    assert(ended);assert.equal(pending.size,0);tracks.push({end:t,notes,meta});
  }assert.equal(pos,data.length);return {format,ppq,tracks};
}
const sort=notes=>notes.slice().sort((a,b)=>a.t-b.t||a.n-b.n||a.d-b.d);
function verify(song,part=-1,section=-1){
  const parsed=parse(W.midi(song,part,section)),[from,to]=W.region(song,section);
  assert.equal(parsed.format,part===-1?1:0);assert.equal(parsed.ppq,480);
  assert.equal(parsed.tracks.length,part===-1?5:1);
  for(const [i,tr] of parsed.tracks.entries()){
    assert.equal(tr.end,to-from);
    const r=part===-1?i-1:part;
    if(r<0){assert.equal(tr.notes.length,0);continue;}
    const expected=song.tracks[r].filter(n=>n.t<to&&n.t+n.d>from).map(n=>({...n,t:Math.max(from,n.t)-from,d:Math.min(to,n.t+n.d)-Math.max(from,n.t)}));
    assert.deepEqual(sort(tr.notes),sort(expected));
    assert.equal(Buffer.from(tr.meta.find(m=>m.type===3).value).toString(),W.parts[r]);
  }
  const meta=parsed.tracks[0].meta,tempo=meta.find(m=>m.type===81),meter=meta.find(m=>m.type===88);
  assert.equal(Buffer.from(tempo.value).readUIntBE(0,3),Math.round(60000000/song.config.bpm));
  const [n,d]=W.meters[song.config.meter];assert.deepEqual(meter.value.slice(0,2),[n,Math.log2(d)]);
  const markers=meta.filter(m=>m.type===6);
  assert.deepEqual(markers.map(m=>[m.t,Buffer.from(m.value).toString()]),song.sections.filter(s=>s.bar*song.barTicks>=from&&s.bar*song.barTicks<to).map(s=>[s.bar*song.barTicks-from,s.name]));
}
let configurations=0,exportsChecked=0;
for(const genre of Object.keys(W.styles)){
  for(const bars of [32,64,96,128])for(const meter of Object.keys(W.meters))for(const form of Object.keys(W.forms)){
    const cfg={...W.defaults(genre),bars,meter,form,key:configurations%12,mode:Object.keys(W.scales)[configurations%3]};
    const p=W.project(cfg,2371+configurations),song=W.compose(p);
    assert.deepEqual(W.compose(p),song);
    assert.equal(song.sections.reduce((n,s)=>n+s.bars,0),bars);
    assert(song.tracks.every(t=>t.length>0));
    verify(song);exportsChecked++;
    const selected=configurations%song.sections.length;
    for(const part of [-1,0,1,2,3]){verify(song,part,selected);exportsChecked++;}
    p.locks[1]=true;const q=W.vary(p,selected,9382),changed=W.compose(q);
    assert.deepEqual(changed.tracks[1],song.tracks[1]);
    const [from,to]=W.region(song,selected);
    song.tracks.forEach((t,r)=>assert.deepEqual(changed.tracks[r].filter(n=>n.t<from||n.t>=to),t.filter(n=>n.t<from||n.t>=to)));
    const different=W.compose(W.newIdea(p,123987));assert.deepEqual(different.tracks[1],song.tracks[1]);
    assert.notDeepEqual(different.tracks[0],song.tracks[0]);
    verify(changed);exportsChecked++;configurations++;
  }
}
assert(!W.valid({version:1}));assert(!W.valid(W.project({...W.defaults(),key:12},1)));
console.log(configurations+' configurations and '+exportsChecked+' MIDI exports passed.');
