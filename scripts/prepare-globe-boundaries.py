"""Build compact complete atlas outlines from Natural Earth 1:10m map units.
Usage: python3 scripts/prepare-globe-boundaries.py path/to/ne_10m_admin_0_map_units.geojson
Source: https://github.com/nvkelso/natural-earth-vector (public domain).
"""
import json, sys, math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
atlas=json.loads((root/'public/data/geography/countries-v1.json').read_text())
source=json.loads(Path(sys.argv[1]).read_text())
bycode={c['cca3']:c for c in atlas}
groups={k:[] for k in bycode}; meta={}
def simplify(points,tolerance=.04):
    if len(points)<=2:return points
    a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy
    def distance(p):
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
        return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
    i=max(range(1,len(points)-1),key=lambda i:distance(points[i]));d=distance(points[i])
    return simplify(points[:i+1],tolerance)[:-1]+simplify(points[i:],tolerance) if d>tolerance else [a,b]
def ring(r):
    # Split closed rings so tiny islands never collapse to a line or disappear.
    mid=len(r)//2
    out=simplify(r[:mid+1])[:-1]+simplify(r[mid:])
    if len(out)<4:out=r
    return [[round(x,4),round(y,4)] for x,y,*_ in out]
for f in source['features']:
    p=f['properties'];code=next((p.get(k) for k in ['ISO_A3','GU_A3','ADM0_A3','ISO_A3_EH'] if p.get(k) in bycode),None)
    if p['ADM0_A3']=='KOS':code='UNK'
    if not code:continue
    polys=[f['geometry']['coordinates']] if f['geometry']['type']=='Polygon' else f['geometry']['coordinates']
    groups[code].extend([[ring(r) for r in poly] for poly in polys]);meta.setdefault(code,p)
missing=[k for k,v in groups.items() if not v]
assert not missing,missing
def land_point(polys):
    def area(r):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(r,r[1:])))
    r=max((poly[0] for poly in polys),key=area)
    ys=[p[1] for p in r];y=(min(ys)+max(ys))/2
    xs=sorted(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]) for a,b in zip(r,r[1:]) if (a[1]>y)!=(b[1]>y))
    a,b=max(zip(xs[::2],xs[1::2]),key=lambda pair:pair[1]-pair[0])
    return [(a+b)/2,y]
features=[]
for code,polys in groups.items():
    c=bycode[code];p=meta[code]
    features.append({'type':'Feature','properties':{'ADM0_A3':code,'ISO_A2':c['cca2'],'NAME':c['nameEn'],'CONTINENT':p['CONTINENT'],'POP_EST':p['POP_EST'],'POP_YEAR':p['POP_YEAR'],**({'POINT':land_point(polys)} if c['area']<10000 else {})},'geometry':{'type':'MultiPolygon','coordinates':polys}})
path=root/'public/data/geography/world-v1.json'
path.write_text(json.dumps({'type':'FeatureCollection','features':features},separators=(',',':'),ensure_ascii=False))
print(len(features),'countries/territories;',path.stat().st_size,'bytes')
