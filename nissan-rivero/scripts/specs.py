import json,glob,re
def cells(l): return [c.strip() for c in l.strip().strip('|').split('|')]
def parse(slug):
    md=json.load(open(f'pdf_{slug}.json'))['data']['markdown']
    L=md.split('\n'); rows=[]; issues=[]
    hdr=None; section=''; last=[]
    i=0
    while i<len(L):
        l=L[i]
        if l.startswith('|') and i+1<len(L) and re.match(r'^\|\s*-{3}',L[i+1]):
            hdr=cells(l); section=''; i+=2
            names=hdr[1:]
            if all(n=='' for n in names):
                section=hdr[0]; names=last
            else:
                last=names
            # table body
            while i<len(L) and L[i].startswith('|'):
                c=cells(L[i]); i+=1
                if all(x=='' for x in c): continue
                concept=c[0]
                vals=c[1:]
                if concept.upper() in ('EQUIPAMIENTO','ESPECIFICACIONES','CATEGORY'): continue
                if all(v=='' for v in vals):
                    section=concept; continue
                if concept=='' : concept=c[1] if len(c)>1 else ''; vals=c[2:]
                if len(vals)!=len(names): issues.append((concept,len(vals),len(names)))
                blank=any(v=='' for v in vals)
                for j,v in enumerate(vals):
                    n=names[j] if j<len(names) else f'col{j+1}'
                    rows.append((section,concept,n,v,blank))
            continue
        i+=1
    return rows,issues
if __name__=='__main__':
    for f in sorted(glob.glob('pdf_*.json')):
        s=f[4:-5]
        if s in('magnite-2026','x-trail-e-power-2026'):continue
        r,iss=parse(s); print(s,len(r),'mismatch rows:',len(iss))
