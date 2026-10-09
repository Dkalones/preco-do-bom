import {list,del,head} from '@vercel/blob';
import {auth,rd,wr,PFX} from './_lib.js';
const D=`${PFX}/backups/`,MAX=40;
const all=async()=>{const {blobs}=await list({prefix:D,limit:200});return blobs.sort((a,b)=>+new Date(b.uploadedAt)-+new Date(a.uploadedAt))};
export default async(req,res)=>{
  const u=await auth(req,res);if(!u)return;
  try{
    if(req.method==='GET'){
      const n=req.query.name;
      if(n){
        if(!/^[\w.\-]+\.json$/.test(n))return res.status(400).json({error:'nome inválido'});
        return res.status(200).json(await rd((await head(D+n)).url));
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
      if(old.length)await del(old.map(b=>b.url));
      return res.status(200).json({name});
    }
    res.status(405).end();
  }catch(e){res.status(500).json({error:String(e.message||e)})}
};
