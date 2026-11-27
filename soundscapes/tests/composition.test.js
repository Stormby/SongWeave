const assert=require('node:assert/strict'),S=require('../web/engine');
function inspect(bytes,expectedTracks,duration){
  const b=Buffer.from(bytes);assert.equal(b.readUInt16BE(10),expectedTracks);assert.equal(b.readUInt16BE(12),480);
  let i=14,bends=0;
  function vlq(){let n=0,x;do{x=b[i++];n=n*128+(x&127);}while(x&128);return n;}
  for(let r=0;r<expectedTracks;r++){
    assert.equal(b.toString('ascii',i,i+4),'MTrk');const end=i+8+b.readUInt32BE(i+4);i+=8;
    let t=0;const held=new Set();
    while(i<end){t+=vlq();const status=b[i++];
      if(status===255){const type=b[i++],size=vlq();if(type===81)assert.equal(b.readUIntBE(i,3),1000000);
        if(type===47){assert.equal(t,duration);assert(!held.size);}i+=size;continue;}
      const n=b[i++],v=b[i++],k=status>>4;
      if(k===9){assert(!held.has(n));held.add(n);}else if(k===8)assert(held.delete(n));
      else if(k===14)bends++;else assert(k===11&&n===11&&v<=127);
    }
  }
  assert.equal(i,b.length);return bends;
}
let count=0;
for(const [library,[ids]] of Object.entries(S.libs))for(const style of ids){
  const p={version:1,library,style,seed:4200,variety:55,pulse:style===8,hit:60},s=S.compose(p);
  assert(s.tracks[0].length&&s.tracks[1].length);assert.equal(!!s.tracks[5].length,p.pulse);
  assert.deepEqual(s,S.compose(p));assert.notDeepEqual(s.tracks[0],S.compose({...p,seed:230}).tracks[0]);
  const b=inspect(S.midi(s),7,3600*480);assert.equal(b>0,[3,4].includes(style));
  for(let r=0;r<6;r++)inspect(S.midi(s,r,2),1,600*480);
  count++;
}
console.log(count+' compatible library/style combinations, full hour, stems, tempo, tuning and note pairing passed');
const backing={version:1,library:'NADA',style:0,variety:55,hit:60,seed:555,pulse:false}, original=S.compose(backing);
for(const [style,ids] of S.choices.entries()){
  assert.equal(new Set(ids).size,6);
  for(const id of ids){
    const lead={style,id,seed:88000+style,oct:0};
    const assigned=S.compose({...backing,lead}),shift=S.compose({...backing,lead:{...lead,oct:1}});
    for(let r=1;r<6;r++){assert.deepEqual(original.tracks[r],assigned.tracks[r]);assert.deepEqual(original.controls[r],assigned.controls[r]);}
    assigned.tracks[0].forEach((n,i)=>{assert(n.n>=S.catalog[id].lo&&n.n<=S.catalog[id].hi);assert.equal(shift.tracks[0][i].n,n.n+12);});
    inspect(S.midi(assigned),7,3600*480);
    if([3,13].includes(style))assert(assigned.controls[0].some(e=>e.b===6144));
  }
  const variants=new Set();for(let seed=1;seed<=20;seed++){
    const lead={style,id:ids[0],seed,oct:0};
    const first=S.compose({...backing,lead}).tracks[0].filter(n=>n.t<45*480);
    variants.add(first.map(n=>n.n).join(','));assert(new Set(first.map(n=>n.d)).size>=4);
  }
  assert.equal(variants.size,20,S.leadStyles[style]);
}
console.log('84 lead assignments, 280 first-45-second pitch signatures, octave shifts and backing stability verified.');
