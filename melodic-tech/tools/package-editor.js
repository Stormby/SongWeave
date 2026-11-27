// Rebuild the offline editor and deterministic example songs with Node 18+.
const fs=require('node:fs'),path=require('node:path'),W=require('../web/engine.js');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,'web',name),'utf8');
const page=read('template.html').replace('/*ENGINE*/',()=>read('engine.js')).replace('/*APP*/',()=>read('app.js'));
fs.writeFileSync(path.join(root,'MelodicTech.html'),page);
const examples=path.join(root,'examples');fs.mkdirSync(examples,{recursive:true});
const keys=[2,9,0,2,5,4];
Object.keys(W.styles).forEach((genre,i)=>{
  const project=W.project({...W.defaults(genre),key:keys[i]??W.defaults(genre).key},0x7020b+i*37);
  const song=W.compose(project),name=path.join(examples,genre.replaceAll(' ','-'));
  fs.writeFileSync(name+'.mid',W.midi(song));
  fs.writeFileSync(name+'.swtech',JSON.stringify({project,scope:-1,sync:true},null,2)+'\n');
});
