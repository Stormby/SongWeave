const assert=require('node:assert/strict'),W=require('../web/engine');
const token=n=>[n.t,n.n].join('/');
function distance(a,b){
  const original=new Set(a.map(token)),take=new Set(b.map(token));
  let shared=0;for(const n of take)if(original.has(n))shared++;
  return 1-shared/(original.size+take.size-shared||1);
}
// Record the audible progression in pitch classes every quarter, ignoring touch and voicing.
function progression(song){
  const result=[],notes=song.tracks[1];
  for(let t=60;t<song.total;t+=480)result.push([...new Set(notes.filter(n=>n.t<=t&&n.t+n.d>t).map(n=>n.n%12))].sort().join('.'));
  return result;
}
let closeMel=0,wideMel=0,closeHarm=0,wideHarm=0,count=0;
for(const genre of Object.keys(W.styles)){
  let styleClose=0,styleWide=0;
  for(let i=0;i<6;i++){
    const p=W.project({...W.defaults(genre),bars:32},900+i),base=W.compose(p);
    const narrow=W.vary(p,-1,123+i,0),broad=W.vary(p,-1,123+i,100);
    const a=W.compose(narrow),b=W.compose(broad);
    assert.equal(p.config.key,b.config.key);
    const ch=progression(base),diff=s=>progression(s).filter((x,k)=>x!==ch[k]).length/ch.length;
    closeHarm+=diff(a);wideHarm+=diff(b);
    const small=distance(base.tracks[0],a.tracks[0]),large=distance(base.tracks[0],b.tracks[0]);
    styleClose+=small;styleWide+=large;closeMel+=small;wideMel+=large;count++;
    assert.deepEqual(W.compose(JSON.parse(JSON.stringify(broad))),b);
    const next=W.newIdea(broad,587+i,95,false),fixed=W.newIdea(broad,587+i,95,true);
    assert(W.valid(next));assert.notEqual(next.config.key,p.config.key);assert.equal(fixed.config.key,p.config.key);
    assert.notDeepEqual(W.sections(next.config).map(s=>s.bars),base.sections.map(s=>s.bars));
    assert.equal(next.config.bars,base.config.bars);
    const custom=W.editSection(broad,0,'rename','Hold this shape').project;
    assert.deepEqual(W.newIdea(custom,777,100,true).config.layout,custom.config.layout);
    const lane=i%4;broad.locks[lane]=true;
    const scoped=W.vary(broad,1,988,100),revised=W.compose(scoped);
    assert.deepEqual(revised.tracks[lane],b.tracks[lane]);
    const [from,to]=W.region(b,1);
    revised.tracks.forEach((t,r)=>assert.deepEqual(t.filter(n=>n.t<from||n.t>=to),b.tracks[r].filter(n=>n.t<from||n.t>=to)));
    assert.deepEqual(W.compose(W.newIdea(broad,554,100)).tracks[lane],b.tracks[lane]);
  }
  assert(styleWide>styleClose,genre+' should widen melodic differences');
}
assert(wideHarm>closeHarm&&wideMel>closeMel);
console.log(count+' matched-key comparisons. Melody event distance (close/wide): '+(closeMel/count).toFixed(2)+' / '+(wideMel/count).toFixed(2)+'. Changed harmony checkpoints: '+(closeHarm/count*100).toFixed(1)+'% / '+(wideHarm/count*100).toFixed(1)+'%.');
