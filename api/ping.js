// TEMPORÁRIO: diagnóstico sem revelar segredos. Apague depois de usar.
export default (req,res)=>{
  const raw=process.env.ACCESS_KEYS;
  const entradas=(raw||'').split(',').filter(Boolean).map(p=>{
    const i=p.indexOf(':'),pw=i<1?p:p.slice(i+1);
    return {nome:i<1?'geral':p.slice(0,i).trim(),tamanhoSenha:pw.trim().length,temAspas:/^["']|["']$/.test(p.trim()),espacosNasPontas:pw!==pw.trim()};
  });
  res.status(200).json({
    ACCESS_KEYS_definida:raw!==undefined,
    entradas,
    BLOB_READ_WRITE_TOKEN_definido:!!process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_PREFIX_definido:!!process.env.BLOB_PREFIX,
    ambiente:process.env.VERCEL_ENV,
    deploy:process.env.VERCEL_DEPLOYMENT_ID
  });
};
