import {list} from '@vercel/blob';
import {auth,rd,wr,PFX,TOKEN} from './_lib.js';
const PATH=`${PFX}/state.json`;
// list() devolve vazio quando o arquivo não existe (sem exceção), então não depende do texto do erro.
const cur=async()=>{
  const {blobs}=await list({prefix:PATH,limit:5,token:TOKEN});
  const b=blobs.find(x=>x.pathname===PATH);
  return b?await rd(b.url):null;
};
export default async(req,res)=>{
  res.setHeader('x-state-v','3');
  try{
    const u=await auth(req,res);if(!u)return;
    if(req.method==='GET')return res.status(200).json(await cur());
    if(req.method==='PUT'){
      const {state,base}=req.body||{};
      if(!state||!Array.isArray(state.items))return res.status(400).json({error:'estado inválido'});
      const c=await cur();
      if(c&&c.updatedAt>(base||0))return res.status(409).json({updatedAt:c.updatedAt,updatedBy:c.updatedBy});
      const updatedAt=Date.now();
      await wr('state.json',{...state,updatedAt,updatedBy:u});
      return res.status(200).json({updatedAt});
    }
    res.status(405).end();
  }catch(e){res.status(500).json({error:String(e.message||e)})}
};
