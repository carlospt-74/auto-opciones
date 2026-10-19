import json,re,glob
res={}
mi=json.load(open('int_march-2026.json'))['resp']
def pj(txt):
    m=re.search(r'```json\s*(.*?)```',txt,re.S); return json.loads(m.group(1) if m else txt)
res['march-2026']=(pj(mi['output']),'')
for f in sorted(glob.glob('int_*.json')):
    d=json.load(open(f)); s=f[4:-5]
    try: res[s]=(pj(d['resp']['output']),d['ts'][:10])
    except Exception as e: print('PARSE FAIL',s,e,str(d)[:300])
json.dump({k:v[0] for k,v in res.items()},open('parsed.json','w'),ensure_ascii=False,indent=1)
n=0
for s,(v,ts) in res.items():
    print(s)
    for k,x in v.items(): n+=1;print('  ',k,'|',x.get('precio'),'|',len(x.get('caracteristicas',[])))
print(n)
