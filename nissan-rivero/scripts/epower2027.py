import re,subprocess,sys
PDF=sys.argv[1] if len(sys.argv)>1 else '/home/user/auto-opciones/nissan-rivero/fuentes/nissan-2027-x_trail_e_power-catalogo.pdf'
V1,V2='EXCLUSIVE e-POWER','PLATINUM e-POWER e-4ORCE'
SECS={'Interior','Exterior','Confort y Tecnología','Seguridad activa y pasiva','Telemática','Paquete de accesorios','Especificaciones de motor eléctrico','Transmisión','Tracción','Frenos','Sistema de dirección','Suspensión','Rines','Dimensiones exteriores (mm)','Peso (kg)','Capacidades','Consumo de combustible*','Capacidad de área de carga/cajuela (L)'}
def col(x,w):
    return subprocess.run(['pdftotext','-f','16','-l','16','-layout','-x',str(x),'-y','0','-W',str(w),'-H','567',PDF,'-'],capture_output=True,text=True).stdout
def parts(l): return [p.strip() for p in re.split(r'\s{3,}',l.strip()) if p.strip()]
def parse():
    rows=[]
    for x,w in((0,340),(340,322),(662,472)):
        sec='';pend=None;lines=[l for l in col(x,w).split('\n') if l.strip()]
        for l in lines:
            p=parts(l)
            if not p or p[0].startswith(('Imágenes','las condiciones','equipamiento y','Vehículo nuevo','“Este','imo cuidado','ducibles','requiere','tinuar','uede contener','. Una vez','• Aplica','*Disponible','e-POWER con','A zul','Azul','Nissan.com','Bitono')) or p[0] in('2027','e-POWER','PLATINUM','EXCLUSIVE','e-POWER e-4ORCE','EQUIPAMIENTO','e-POWER e-4ORCE','Bitono*','Gris Ox ford','Champaña Bitono*','EXCLUSIVE e-POWER'): 
                if p[0]=='EQUIPAMIENTO' and len(p)>1: pass
                continue
            if p[0] in SECS and len(p)==1: sec=p[0];continue
            if p[0]=='EQUIPAMIENTO': continue
            rows.append((sec,p))
    return rows
SYMT=re.compile(r'^[•\-/]+$')
def rows2():
    raw=parse(); out=[]; i=0; n=0
    while i<len(raw):
        sec,p=raw[i]
        if len(p)==1 and i+1<len(raw) and all(SYMT.match(t) for t in raw[i+1][1]):
            con=p[0]; vals=raw[i+1][1]; i+=2
            if i<len(raw) and len(raw[i][1])==1 and raw[i][1][0][:1].islower(): con+=' '+raw[i][1][0]; i+=1
            out.append((sec,con,vals)); continue
        if len(p)>=2: out.append((sec,p[0],p[1:]))
        i+=1
    # secciones heredadas de la columna anterior
    fix=[];cnt=0
    for sec,con,vals in out:
        if sec=='':
            if con in('Cargador Inalámbrico','Head Up Display (tipo parabrisas)','Freno de estacionamiento electrónico con funcion Auto-hold (e-PKB)','Bloqueo/Desbloqueo de puertas al alejarse/acercarse del vehículo'): sec='Confort y Tecnología'
            else: sec='Motor a combustión'
        if sec=='Capacidad de área de carga/cajuela (L)': con='Capacidad de área de carga/cajuela (L) – '+con; sec='Capacidades'
        fix.append((sec,con,vals))
    res=[]
    for sec,con,vals in fix:
        if len(vals)==2: res+=[(sec,con,V1,vals[0],''),(sec,con,V2,vals[1],'')]
        else: res+=[(sec,con,V1,vals[0],'merged'),(sec,con,V2,vals[0],'merged')]
    return res
