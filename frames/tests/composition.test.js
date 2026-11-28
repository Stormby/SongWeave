const assert=require('node:assert/strict'),F=require('../web/engine'),{createHash}=require('node:crypto');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function parse(bytes){
  const b=Buffer.from(bytes),out=[];let pos=14;
  assert.equal(b.toString('ascii',0,4),'MThd');assert.equal(b.readUInt16BE(12),480);
  function vlq(){let n=0,v;do{v=b[pos++];n=n*128+(v&127);}while(v&128);return n;}
  while(pos<b.length){
    assert.equal(b.toString('ascii',pos,pos+4),'MTrk');const end=pos+8+b.readUInt32BE(pos+4);pos+=8;
    const events=[];let t=0;while(pos<end){
      t+=vlq();const status=b[pos++];
      if(status===255){const type=b[pos++],n=vlq(),v=b.subarray(pos,pos+n);pos+=n;events.push([t,255,type,...v]);}
      else events.push([t,status,b[pos++],b[pos++]]);
    }assert.equal(pos,end);out.push(events);
  }assert.equal(out.length,b.readUInt16BE(10));return out;
}
for(const theme of Object.keys(F.themes)){
  for(const mode of [0,1,2])for(const level of [0,1,2])for(const minutes of [1,10]){
    const p={...F.defaults(),theme,mode,level,minutes},s=F.compose(p);
    assert.equal(s.total/F.ppq/s.bpm,minutes);
    assert(s.sections.every((v,i)=>i===0||v.bar>s.sections[i-1].bar));
    assert.equal(s.tracks[0].length===0,mode===2);assert.equal(s.cc[0].length===0,mode===2);
    s.tracks.forEach(track=>{const ends=new Map();for(const n of track){
      assert(n.d>0&&n.t>=0&&n.t+n.d<=s.total&&n.v>0&&n.v<128&&n.t>=(ends.get(n.n)||0));ends.set(n.n,n.t+n.d);
    }});
    assert(mode===2||s.cc[0].some(c=>c.cc===64&&c.v>=64));
    for(const [idx,lane] of s.cc.slice(1).entries()){if(!s.tracks[idx+1].length){assert.equal(lane.length,0);continue;}assert(lane.some(e=>e.cc===1&&e.v>0));assert.equal(lane.at(-1).v,0);}
  }
  const p={...F.defaults(),theme,minutes:3},a=F.compose(p),b=F.compose({...p,melody:426891});
  assert.notEqual(hash(a.tracks[0]),hash(b.tracks[0]));assert.deepEqual(a.tracks.slice(2),b.tracks.slice(2));assert.deepEqual(a.cc,b.cc);
  assert(F.compose({...p,level:2}).tracks[0].length>F.compose({...p,level:0}).tracks[0].length);
  assert.equal(new Set(Array.from({length:16},(_,melody)=>hash(F.compose({...p,melody}).tracks[0].filter(n=>n.hand==='R').map(n=>[n.t,n.n])))).size,16);
  const full=parse(F.midi(a));assert.equal(full.length,7);const tempo=full[0].find(x=>x[1]===255&&x[2]===81);
  assert(Math.abs(((tempo[3]<<16)+(tempo[4]<<8)+tempo[5])*a.total/480/1e6-180)<.005);
  assert.equal(full[0].filter(x=>x[1]===255&&x[2]===6).length,6);
  for(let i=0;i<6;i++){
    const stem=parse(F.midi(a,i));assert.equal(stem.length,1);
    assert.deepEqual(stem[0].filter(x=>x[1]!==255),full[i+1].filter(x=>x[1]!==255));
    assert.deepEqual(stem[0].at(-1),[a.total,255,47]);
    assert.equal(full[i+1].filter(x=>x[1]===176+i).length,a.cc[i].length);
  }
}console.log('Verified styles, complexity, duration, controller export, stem parity, unique melodies and backing retention.');

for(const theme of Object.keys(F.themes)){
  const p={...F.defaults(),theme,minutes:60,seed:324199,level:2},s=F.compose(p);
  assert.equal(s.total/s.bpm/480,60);
  s.tracks.forEach((notes,i)=>assert(notes.every(n=>n.n>=(i===4?36:24))));
  const full=parse(F.midi(s));assert.deepEqual(full[0].at(-1),[s.total,255,47]);
  const meter=full[0].find(e=>e[1]===255&&e[2]===88);assert.equal(meter[3],theme==='Yann Tiersen'?3:4);
  assert.deepEqual(full[0].filter(e=>e[1]===255&&e[2]===6).map(e=>e[0]),s.sections.map(sec=>sec.bar*s.barTicks));
}
