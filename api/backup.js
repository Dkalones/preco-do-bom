import {list,del} from '@vercel/blob';
import {auth,rdp,wr,PFX,TOKEN} from './_lib.js';
const D=`${PFX}/backups/`,MAX=40;
const all=async()=>{const {blobs}=await list({prefix:D,limit:200,token:TOKEN});return blobs.sort((a,b)=>+new Date(b.uploadedAt)-+new Date(a.uploadedAt))};
export default async(req,res)=>{
  try{
    const u=await auth(req,res);if(!u)return;
    if(req.method==='GET'){
      const n=req.query.name;
      if(n){
        if(!/^[\w.\-]+\.json$/.test(n))return res.status(400).json({error:'nome inválido'});
        const s=await rdp('backups/'+n);
        return s?res.status(200).json(s):res.status(404).json({error:'backup não encontrado'});
      }
      return res.status(200).json((await all()).map(b=>({name:b.pathname.slice(D.length),size:b.size,at:b.uploadedAt})));
    }
    if(req.method==='POST'){
      const {state,tag}=req.body||{};
      if(!state||!Array.isArray(state.items))return res.status(400).json({error:'estado inválido'});
      const t=String(tag||'manual').replace(/[^\w-]/g,'').slice(0,20)||'manual';
      const name=`${new Date().toISOString().replace(/[:.]/g,'-')}_${u.replace(/[^\w-]/g,'')}_${t}.json`;
      await wr('backups/'+name,state);
      const old=(await all()).slice(MAX);
      if(old.length)await del(old.map(b=>b.pathname),{token:TOKEN});
      return res.status(200).json({name});
    }
    res.status(405).end();
  }catch(e){res.status(500).json({error:String(e.message||e)})}
};
