const assert=require('node:assert/strict'),w=require('../web/engine');
assert.equal(Object.keys(w.styles).length,17);
for(const name of Object.keys(w.styles)){
  const p=w.project(w.defaults(name),824),song=w.compose(p);
  assert(w.valid(p));assert.equal(song.tracks.length,6);
  for(const track of song.tracks)assert(track.length>0&&track.every(n=>n.t>=0&&n.d>0&&n.t+n.d<=song.total));
  assert.equal(w.midi(song)[11],7);
  for(let k=0;k<9;k++){
    const notes=song.tracks[5].filter(n=>n.k===k);assert(notes.length>0&&notes.every(n=>n.n===w.drumNotes[k]));
    assert.equal(w.midi(song,5,-1,120,w.channels,k)[11],1);
  }
  for(let i=0;i<6;i++){
    const locked=structuredClone(p);locked.locks[i]=true;
    assert.deepEqual(w.compose(w.newIdea(locked,321,95)).tracks[i],song.tracks[i]);
  }
  const mapped=structuredClone(p);mapped.config.drumMap[0]=24;
  assert(w.compose(mapped).tracks[5].filter(n=>n.k===0).every(n=>n.n===24));
}
console.log('17 reference arrangements, all six locks, nine drum voices and editable kit maps passed.');
