import {put,get} from '@vercel/blob';

// A autenticação foi removida para uso pessoal sem senha.
// ATENÇÃO: qualquer pessoa que conheça o endereço público do app pode ler e alterar os dados.
export const TOKEN=process.env.BLOB_READ_WRITE_TOKEN||process.env[Object.keys(process.env).find(k=>/_READ_WRITE_TOKEN$/.test(k))||''];
export const PFX=process.env.BLOB_PREFIX||'pdb';
export const ACC=process.env.BLOB_ACCESS||'private';

export const rdp=async path=>{
  const r=await get(`${PFX}/${path}`,{access:ACC,token:TOKEN,useCache:false});
  return r?await new Response(r.stream).json():null;
};
export const wr=(path,obj)=>put(`${PFX}/${path}`,JSON.stringify(obj),{access:ACC,addRandomSuffix:false,allowOverwrite:true,contentType:'application/json',token:TOKEN});

export async function auth(){return 'local';}
