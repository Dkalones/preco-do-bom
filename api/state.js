import {auth,rdp,wr} from './_lib.js';
export default async(req,res)=>{
  res.setHeader('x-state-v','4');
  try{
    const u=await auth(req,res);if(!u)return;
    if(req.method==='GET')return res.status(200).json(await rdp('state.json'));
    if(req.method==='PUT'){
      const {state,base}=req.body||{};
      if(!state||!Array.isArray(state.items))return res.status(400).json({error:'estado inválido'});
      const c=await rdp('state.json');
      if(c&&c.updatedAt>(base||0))return res.status(409).json({updatedAt:c.updatedAt,updatedBy:c.updatedBy});
      const updatedAt=Date.now();
      await wr('state.json',{...state,updatedAt,updatedBy:u});
      return res.status(200).json({updatedAt});
    }
    res.status(405).end();
  }catch(e){res.status(500).json({error:String(e.message||e)})}
};
