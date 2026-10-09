import {put,get} from '@vercel/blob';
import {timingSafeEqual,createHash} from 'node:crypto';
// aceita BLOB_READ_WRITE_TOKEN ou qualquer prefixo criado pela Vercel (ex.: price_good_READ_WRITE_TOKEN)
export const TOKEN=process.env.BLOB_READ_WRITE_TOKEN||process.env[Object.keys(process.env).find(k=>/_READ_WRITE_TOKEN$/.test(k))||''];
export const PFX=process.env.BLOB_PREFIX||'pdb';
// ACCESS_KEYS="jao:chave-longa-1,maria:chave-longa-2"
const match=req=>{
  const k=Buffer.from(String(req.headers['x-key']||''));
  for(const p of (process.env.ACCESS_KEYS||'').split(',')){
    const i=p.indexOf(':');
    const n=i<1?'geral':p.slice(0,i).trim();
    const s=Buffer.from((i<1?p:p.slice(i+1)).trim());
    if(s.length&&s.length===k.length&&timingSafeEqual(s,k))return n;
  }
  return null;
};
// Acesso do store: 'private' (padrão) ou 'public' (defina BLOB_ACCESS=public se o store for público).
export const ACC=process.env.BLOB_ACCESS||'private';
// Lê um JSON do Blob (caminho relativo ao prefixo). Devolve null se não existir.
export const rdp=async path=>{
  const r=await get(`${PFX}/${path}`,{access:ACC,token:TOKEN,useCache:false});
  return r?await new Response(r.stream).json():null;
};
export const wr=(path,obj)=>put(`${PFX}/${path}`,JSON.stringify(obj),{access:ACC,addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',token:TOKEN});

// Limite de tentativas por IP: MAXF erros dentro de WIN => bloqueio até a janela acabar.
// O contador fica no Blob (funções serverless não guardam estado). Não é atômico:
// requisições simultâneas podem subcontar um pouco, mas freia ataque em massa.
const MAXF=5,WIN=15*60*1000;
const ipOf=req=>String(req.headers['x-real-ip']||req.headers['x-forwarded-for']||'').split(',')[0].trim()||'?';
const rlPath=req=>`rl/${createHash('sha256').update(ipOf(req)).digest('hex').slice(0,32)}.json`;
const getRl=async p=>{try{return await rdp(p)}catch(e){return null}};
export async function auth(req,res){
  const p=rlPath(req),now=Date.now(),rl=await getRl(p),live=!!rl&&now-rl.t0<WIN;
  if(live&&rl.n>=MAXF){
    res.setHeader('Retry-After',Math.ceil((rl.t0+WIN-now)/1000));
    res.status(429).json({error:'muitas tentativas'});return null;
  }
  const u=match(req);
  if(u)return u;
  if(String(req.headers['x-key']||'')){
    try{await wr(p,{n:live?rl.n+1:1,t0:live?rl.t0:now})}catch(e){}
  }
  res.status(401).json({error:'sem acesso'});return null;
}
