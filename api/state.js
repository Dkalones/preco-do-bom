import {head} from '@vercel/blob';
import {auth,rd,wr,PFX} from './_lib.js';
const cur=async()=>{
  try{return await rd((await head(`${PFX}/state.json`)).url)}
  catch(e){if(e?.name==='BlobNotFoundError')return null;throw e}
};
export default async(req,res)=>{
  const u=await auth(req,res);if(!u)return;
  try{
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
