import json,os,re,sys,time,glob,urllib.request,concurrent.futures as cf
K=os.environ['FIRECRAWL_API_KEY']
def api(path,body=None,method='POST'):
    for a in range(4):
        r=urllib.request.Request('https://api.firecrawl.dev'+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+K,'Content-Type':'application/json'})
        try: return json.load(urllib.request.urlopen(r,timeout=420))
        except urllib.error.HTTPError as e:
            t=e.read().decode()
            if e.code==429: time.sleep(40);continue
            return {'success':False,'error':t[:300]}
        except Exception as e: time.sleep(5)
    return {'success':False,'error':'retries'}
def one(slug,vers):
    out=f'int_{slug}.json'
    if os.path.exists(out) and json.load(open(out)).get('ok'): return slug,'cached'
    s=api('/v2/scrape',{'url':f'https://nissanrivero.com/nissan/catalogo/nuevos/nissan-{slug}/','formats':['markdown'],'waitFor':5000})
    if not s.get('success'): json.dump({'ok':False,'err':s},open(out,'w'));return slug,'scrape fail'
    sid=s['data']['metadata']['scrapeId']
    p=("In the section 'a tu medida' (Descubre sus versiones), click each version tab in turn: "+'; '.join(vers)+
       ". For EACH version report, copying the page text verbatim: the displayed price (the 'Desde $...' heading) and the complete list of items under 'La versión ... cuenta con'. Do not skip or summarize. Answer ONLY as JSON: {\"<version>\": {\"precio\": \"...\", \"caracteristicas\": [\"...\"]}}")
    r=api(f'/v2/scrape/{sid}/interact',{'prompt':p})
    api(f'/v2/scrape/{sid}/interact',None,'DELETE')
    r.pop('cdpUrl',None);r.pop('liveViewUrl',None);r.pop('interactiveLiveViewUrl',None);r.pop('stdout',None)
    json.dump({'ok':bool(r.get('success')),'scrapeId':sid,'resp':r,'ts':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())},open(out,'w'),ensure_ascii=False)
    return slug,'ok' if r.get('success') else 'fail'
jobs={}
for f in sorted(glob.glob('w2_*.json')):
    s=f[3:-5]
    pass
    md=json.load(open(f))['data']['markdown']
    m=re.search(r'Descubre sus versiones[^\n]*\n\n((?:- .+\n)+)',md)
    jobs[s]=[v[2:] for v in m.group(1).strip().split('\n')]
with cf.ThreadPoolExecutor(2) as ex:
    for r in ex.map(lambda kv:one(*kv),jobs.items()): print(r,flush=True)
