import json,os,time,glob,urllib.request,concurrent.futures as cf
K=os.environ['FIRECRAWL_API_KEY']
def one(s):
    out=f'pdf_{s}.json'
    if os.path.exists(out) and json.load(open(out)).get('success'): return s,'cached'
    for a in range(4):
        r=urllib.request.Request('https://api.firecrawl.dev/v2/scrape',data=json.dumps({'url':f'https://d3s2hob8w3xwk8.cloudfront.net/autos-landing/nissan/{s}/pdf/catalogo.pdf','formats':['markdown']}).encode(),headers={'Authorization':'Bearer '+K,'Content-Type':'application/json'})
        try:
            d=json.load(urllib.request.urlopen(r,timeout=400)); json.dump(d,open(out,'w'),ensure_ascii=False)
            m=d['data']['metadata'];return s,(m.get('numPages'),m.get('creditsUsed'),len(d['data']['markdown']))
        except urllib.error.HTTPError as e:
            if e.code==429: time.sleep(40);continue
            return s,'ERR '+e.read().decode()[:200]
        except Exception as e: time.sleep(5)
    return s,'fail'
slugs=[f[3:-5] for f in sorted(glob.glob('w2_*.json'))]
with cf.ThreadPoolExecutor(3) as ex:
    for r in ex.map(one,slugs): print(r,flush=True)
