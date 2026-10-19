import json,glob,re
def cells(l): return [c.strip() for c in l.strip().strip('|').split('|')]
CUR=[0]
class TL(list):
    def append(self,x): list.append(self,tuple(x)+(CUR[0],))
DASH=re.compile(r'[-–−/ ]+')
SYM=re.compile(r'[-–−/ •·✓■.●]+')
def mark_iconlost(rows):
    st={}
    for sec,con,ver,val,tag,t in rows:
        d=st.setdefault(t,[0,0])
        if DASH.fullmatch(val): d[0]+=1
        elif re.fullmatch(r'[•·✓■.●]+',val): d[1]+=1
    bad={t for t,(d,b) in st.items() if b==0 and d>=15}
    out=[]
    for sec,con,ver,val,tag,t in rows:
        if t in bad and DASH.fullmatch(val): tag='iconlost'
        out.append((sec,con,ver,val,tag))
    return out
SKIP={'EQUIPAMIENTO','ESPECIFICACIONES','CATEGORY'}
def parse(slug):
    """Devuelve filas (seccion, concepto, version, valor, tag). tag: ''|'blank'|'infer_all'"""
    if slug=='v-drive-2026': return parse_vdrive(slug)
    md=json.load(open(f'pdf_{slug}.json'))['data']['markdown']
    L=md.split('\n'); rows=TL(); issues=[]
    hdr=None; section=''; last=[]; tid=0
    i=0
    while i<len(L):
        l=L[i]
        if l.startswith('|') and i+1<len(L) and re.match(r'^\|\s*-{3}',L[i+1]):
            hdr=cells(l); section=''; i+=2; tid+=1; CUR[0]=tid
            names=hdr[1:]
            if all(n=='' for n in names):
                section=hdr[0]; names=last
            else:
                last=names
            while i<len(L) and L[i].startswith('|'):
                c=cells(L[i]); i+=1
                if all(x=='' for x in c): continue
                concept=c[0]; vals=c[1:]
                if concept.upper() in SKIP or concept.startswith('• Aplica') or (slug=='frontier-hibrida-2027' and concept=='Gris Titanio'): continue
                if all(v=='' for v in vals):
                    section=concept; continue
                if concept=='': concept=c[1] if len(c)>1 else ''; vals=c[2:]
                if slug=='frontier-hibrida-2027':
                    names=[re.sub(r'^FRONTIER PRO PLUG-IN HYBRID ','',n) for n in names]
                    if len(vals)==1 and len([n for n in names if n])==2:   # tabla de 1 columna = especificación común
                        for n in [n for n in names if n]: rows.append((section,concept,n,vals[0],'infer_all'))
                        continue
                vc=[j for j,n in enumerate(names) if n]
                if len(vals)!=len(names):
                    issues.append((concept,len(vals),len(names)))
                    for j,v in enumerate(vals): rows.append((section,concept,names[j] if j<len(names) else f'col{j+1}',v,'blank' if any(x=='' for x in vals) else ''))
                    continue
                # columna de unidad (antes de la primera versión)
                unit=' '.join(vals[j] for j in range(vc[0]) if vals[j]) if vc else ''
                if unit: concept=f'{concept} [{unit}]'
                vv=[vals[j] for j in vc]; nn=[names[j] for j in vc]
                filled=[k for k,v in enumerate(vv) if v!='']
                shared=False
                if len(filled)==1 and len(vv)>=2:
                    if len(vv)==2: shared=True
                    elif len(vv)%2==1 and filled[0]==len(vv)//2: shared=True
                    elif not SYM.fullmatch(vv[filled[0]]): shared=True
                if shared:
                    for n in nn: rows.append((section,concept,n,vv[filled[0]],'infer_all'))
                else:
                    blank=any(v=='' for v in vv)
                    for n,v in zip(nn,vv): rows.append((section,concept,n,v,'blank' if blank else ''))
            continue
        i+=1
    rows=mark_iconlost(rows)
    return rows,issues
def parse_vdrive(slug):
    md=json.load(open(f'pdf_{slug}.json'))['data']['markdown']
    VER='V-DRIVE MT'; rows=[]; seen=set(); sec=''
    UNITS={'c.c.','mm','HP / rpm','Nm / rpm','KG','N° personas'}
    for l in md.split('\n'):
        if not l.startswith('|') or re.match(r'^\|\s*-{3}',l): continue
        c=cells(l)
        if all(x=='' for x in c): continue
        if c[0].startswith(('CARACTER','DIMENSIONES')) : sec=c[0]; continue
        if c[0]=='EQUIPAMIENTO' : sec='EQUIPAMIENTO'; continue
        if c[0]=='MODELO': continue
        if len(c)>=2 and c[1]==VER: sec='EQUIPAMIENTO – '+c[0]; continue   # fila de sección con la versión
        if len(c)==2 and c[1]=='': sec='EQUIPAMIENTO – '+c[0]; continue
        if len(c)>=3 and c[2]!='' :  # concepto | unidad o subetiqueta | valor
            con=c[0]+(f' [{c[1]}]' if c[1] in UNITS else (f' – {c[1]}' if c[1] else '')); val=c[2]
        elif len(c)>=2 and c[1]!='': con,val=c[0],c[1]
        else: continue
        k=(sec,con,val)
        if k in seen: continue
        seen.add(k); rows.append((sec,con,VER,val,''))
    return rows,[]
