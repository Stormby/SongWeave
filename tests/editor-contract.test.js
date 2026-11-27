// Unit-test editor actions with a minimal in-memory DOM and host event adapter.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const html=fs.readFileSync(root+'/Songweave.html','utf8'),sample=fs.readFileSync(root+'/examples/Cinematic.songweave','utf8');
function mount(native){
  const ids={},saved=new Map(),outputs=[],handlers={},queue=[];
  class E{
    constructor(name){this.name=name;this.style={};this.dataset={};this.children=[];this.checked=false;this.textContent='';this.value='';}
    getContext(){return {fillRect(){}};}
    add(c){this.append(c);}append(c){c.parent=this;this.children.push(c);}
    replaceChildren(){this.children=[];}remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
    querySelector(){return this.children.find(c=>c.dataset.custom);}
    setAttribute(k,v){this[k]=v;}click(){if(!this.disabled)return this.onclick?.();}
  }
  for(const [,id] of html.matchAll(/ id="(\w+)"/g))ids[id]=new E(id);
  ids.sync.checked=true;
  class Option extends E{constructor(text,val){super('option');this.textContent=text;this.value=val;}}
  const document={getElementById:id=>ids[id],createElement:name=>new E(name),body:new E('body')};
  const localStorage={setItem:(k,v)=>saved.set(k,v),getItem:k=>saved.get(k)};
  saved.set('songweave.v1',sample);
  const window={};
  if(native)window.__JUCE__={backend:{emitEvent:(_,msg)=>{outputs.push(msg);
    if(msg.type==='ready')handlers.swInit({state:sample,bpm:112,epoch:3});
    if(msg.type==='play')handlers.swStarted({});},addEventListener:(id,fn)=>handlers[id]=fn}};
  const runtime={window,document,Option,localStorage,crypto:require('node:crypto').webcrypto,TextEncoder,btoa,Blob,
    setTimeout:fn=>{queue.push(fn);return queue.length;},clearTimeout(){},clearInterval(){},URL};
  vm.createContext(runtime);
  for(const [,src] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(src,runtime);
  const flush=()=>{while(queue.length)queue.shift()();};flush();
  assert.equal(ids.rows.children.length,4);assert.equal(ids.genre.value,'Cinematic');
  assert.equal(ids.sections.children.length,7);
  ids.sections.children[2].click();ids.rows.children[1].children[2].click();
  ids.variation.click();
  const read=()=>JSON.parse(native?outputs.filter(m=>m.type==='state').at(-1).json:saved.get('songweave.v1'));
  assert(read().project.revisions[2][0]);assert.equal(read().project.revisions[2][1],0);
  ids.back.click();assert.equal(read().project.revisions[2][0],0);
  ids.sectionBars.value=11;ids.sectionBars.onchange();assert.equal(ids.form.value,'custom');
  ids.repeat.click();assert.equal(ids.sections.children.length,8);
  ids.left.click();ids.remove.click();assert.equal(ids.sections.children.length,7);
  ids.whole.click();ids.genre.value='Drone';ids.genre.onchange();assert.equal(read().project.config.genre,'Drone');
  if(native){
    handlers.swFile({data:sample});ids.whole.click();flush();
    const cache=outputs.filter(m=>m.type==='cache').at(-1);assert.equal(cache.files.length,5);
    assert.equal(ids.bpm.disabled,true);
    ids.sync.checked=false;ids.sync.onchange();ids.export.click();
    assert.deepEqual(Buffer.from(outputs.at(-1).data,'base64'),fs.readFileSync(root+'/examples/Cinematic.mid'));
    ids.play.click();assert.equal(outputs.at(-1).type,'play');assert(outputs.at(-1).events.length>500);
    handlers.swClock({tick:480,bpm:112,playing:true});assert(ids.progress.value>0);
    ids.play.click();assert.equal(outputs.at(-1).type,'stop');
    ids.route.value='virtual';ids.route.onchange();
    assert.equal(read().output,'virtual');
    assert.deepEqual(Buffer.from(read().midiData,'base64'),fs.readFileSync(root+'/examples/Cinematic.mid'));
    const melody=ids.rows.children[0].children.at(-1);melody.value=3;melody.onchange();
    assert.deepEqual(read().channels,[3,2,1,4]);
    ids.export.click();const exported=Buffer.from(outputs.at(-1).data,'base64');
    const engine=require('../web/engine.js'),arr=engine.compose(JSON.parse(sample).project);
    assert.deepEqual(exported,Buffer.from(engine.midi(arr,-1,-1,arr.config.bpm,[3,2,1,4])));
    handlers.swInit({state:JSON.stringify(read()),bpm:100,epoch:4});
    assert.equal(ids.route.value,'virtual');assert.equal(ids.rows.children[2].children.at(-1).value,1);
  }
}
mount(false);mount(true);
console.log('Editor actions, native message adapter and export parity passed in a simulated DOM.');
