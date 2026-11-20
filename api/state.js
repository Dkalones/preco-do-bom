import {auth,rdp,wr} from './_lib.js';

const stable=value=>{
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.keys(value).filter(k=>!['_base','_dirty','updatedAt','updatedBy'].includes(k)).sort().map(k=>[k,stable(value[k])]));
  }
  return value;
};
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));

export default async(req,res)=>{
  res.setHeader('x-state-v','5');
  try{
    const u=await auth(req,res);if(!u)return;
    if(req.method==='GET')return res.status(200).json(await rdp('state.json'));
    if(req.method==='PUT'){
      const {state,base}=req.body||{};
      if(!state||!Array.isArray(state.items))return res.status(400).json({error:'estado inválido'});
      const c=await rdp('state.json');

      // Se o conteúdo já é igual ao da nuvem, não cria nova versão nem gera conflito.
      if(c&&same(state,c))return res.status(200).json({updatedAt:c.updatedAt,unchanged:true});

      // Só há conflito quando o conteúdo mudou e a base do navegador está desatualizada.
      if(c&&c.updatedAt>(base||0))return res.status(409).json({updatedAt:c.updatedAt,updatedBy:c.updatedBy});

      const updatedAt=Date.now();
      await wr('state.json',{...state,updatedAt,updatedBy:u});
      return res.status(200).json({updatedAt,unchanged:false});
    }
    res.status(405).end();
  }catch(e){res.status(500).json({error:String(e.message||e)})}
};
