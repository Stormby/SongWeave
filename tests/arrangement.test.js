const assert=require('node:assert/strict'),W=require('../web/engine');
for(const genre of Object.keys(W.styles)){
  let p=W.project(W.defaults(genre),123456);
  const change=(index,act,value)=>{
    const result=W.editSection(p,index,act,value);p=result.project;
    assert(W.valid(p));assert(W.valid(JSON.parse(JSON.stringify(p))));return result.selected;
  };
  change(1,'rename','First verse');
  change(1,'length',11);
  const initial=JSON.stringify(p),total=p.config.bars;
  const selected=change(1,'repeat');
  assert.equal(p.config.bars,total+11);
  assert.deepEqual(p.config.layout[selected],p.config.layout[1]);
  change(selected,'remove');assert.equal(JSON.stringify(p),initial);
  change(1,'right');assert.equal(p.config.layout[2].name,'First verse');
  change(2,'left');assert.equal(JSON.stringify(p),initial);
  assert.throws(()=>W.editSection(p,0,'left'));
  assert.throws(()=>W.editSection(p,1,'length',0));
  assert.throws(()=>W.editSection(p,1,'length',65));
  assert.throws(()=>W.editSection(p,1,'rename',' '));
  const s=W.compose(p);
  assert.equal(s.total,s.barTicks*total);
  assert(W.midi(s).length>100);
  assert(W.midi(s,0,1).length>40);
  while(p.config.layout.length>1)change(0,'remove');
  assert.throws(()=>W.editSection(p,0,'remove'));
  change(0,'length',1);
  assert.equal(W.compose(p).sections[0].bars,1);
}
console.log('Custom arrangement editing, sizing, ordering, restore and export passed for every style.');
