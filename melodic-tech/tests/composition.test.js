const assert=require('node:assert/strict');
const W=require('../web/engine');
const styles=Object.keys(W.styles);
assert.equal(styles.length,6);
const fingerprints=new Set();
for(const name of styles){
  const p=W.project(W.defaults(name),174),song=W.compose(p);
  assert(W.valid(p));
  assert.deepEqual(W.parts,['Melody','Chords','Bass','Arp','Response']);
  const varied=W.newIdea(p,789,95);
  assert(W.valid(varied));
  assert.notEqual(p.config.key,varied.config.key);
  assert.equal(W.newIdea(p,789,95,true).config.key,p.config.key);
  const a=song.sections.find(s=>s.role==='a');
  const responseStart=(a.bar+1.5)*song.barTicks;
  const callStart=(a.bar+1)*song.barTicks;
  for(const project of [p,W.vary(p,-1,810,100)]){
    const score=W.compose(project);
    const calls=score.tracks[0].filter(n=>n.t>=callStart&&n.t<callStart+song.barTicks);
    const replies=score.tracks[4].filter(n=>n.t>=callStart&&n.t<callStart+song.barTicks);
    assert(calls.length&&replies.length);
    assert(calls.every(n=>n.t+n.d<=responseStart));
    assert(replies.every(n=>n.t>=responseStart));
    for(const track of score.tracks){
      assert(track.length>20);
      for(const n of track)assert(n.t>=0&&n.d>0&&n.t+n.d<=score.total&&n.n>=0&&n.n<=127);
    }
  }
  for(let lane=0;lane<W.parts.length;lane++){
    const locked=structuredClone(p);locked.locks[lane]=true;
    assert.deepEqual(W.compose(W.vary(locked,-1,821,100)).tracks[lane],song.tracks[lane]);
    const clip=W.midi(song,lane,song.sections.indexOf(a));
    assert.equal(clip[9],0);assert.equal(clip[11],1);
  }
  const full=W.midi(song);assert.equal(full[9],1);assert.equal(full[11],6);
  const rhythm=song.tracks[2].filter(n=>n.t>=a.bar*song.barTicks&&n.t<(a.bar+1)*song.barTicks)
    .map(n=>n.t%song.barTicks).join(',');
  fingerprints.add(rhythm);
}
assert.equal(fingerprints.size,6);
console.log('Six distinct bass rhythms; call / response boundaries, five independent locks and MIDI exports passed.');
