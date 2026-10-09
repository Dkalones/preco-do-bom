import {put,head} from '@vercel/blob';
import {timingSafeEqual,createHash} from 'node:crypto';
export const PFX=process.env.BLOB_PREFIX||'pdb';
// ACCESS_KEYS="jao:chave-longa-1,maria:chave-longa-2"
const match=req=>{
  const k=Buffer.from(String(req.headers['x-key']||''));
  for(const p of (process.env.ACCESS_KEYS||'').split(',')){
    const i=p.indexOf(':');if(i<1)continue;
    const n=p.slice(0,i).trim(),s=Buffer.from(p.slice(i+1).trim());
    if(s.length&&s.length===k.length&&timingSafeEqual(s,k))return n;
  }
  return null;
};
export const rd=async url=>{
  const r=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now());
  if(!r.ok)throw new Error('blob '+r.status);
  return r.json();
};
export const wr=(path,obj)=>put(`${PFX}/${path}`,JSON.stringify(obj),{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60});

// Limite de tentativas por IP: MAXF erros dentro de WIN => bloqueio até a janela acabar.
// O contador fica no Blob (funções serverless não guardam estado). Não é atômico:
// requisições simultâneas podem subcontar um pouco, mas freia ataque em massa.
const MAXF=5,WIN=15*60*1000;
const ipOf=req=>String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||'').split(',')[0].trim()||'?';
const rlPath=req=>`${PFX}/rl/${createHash('sha256').update(ipOf(req)).digest('hex').slice(0,32)}.json`;
const getRl=async p=>{try{return await rd((await head(p)).url)}catch(e){return null}};
export async function auth(req,res){
  const p=rlPath(req),now=Date.now(),rl=await getRl(p),live=!!rl&&now-rl.t0<WIN;
  if(live&&rl.n>=MAXF){
    res.setHeader('Retry-After',Math.ceil((rl.t0+WIN-now)/1000));
    res.status(429).json({error:'muitas tentativas'});return null;
  }
  const u=match(req);
  if(u)return u;
  if(String(req.headers['x-key']||'')){
    try{await put(p,JSON.stringify({n:live?rl.n+1:1,t0:live?rl.t0:now}),{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',cacheControlMaxAge:60})}catch(e){}
  }
  res.status(401).json({error:'sem acesso'});return null;
}
