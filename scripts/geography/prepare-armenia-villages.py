from pathlib import Path
import json,math,re,datetime,sys,unicodedata
raw=json.loads(Path(sys.argv[1]).read_text());regions=json.loads(Path(sys.argv[2]).read_text())['features'];projection=json.loads(Path('data/geography/armenia-map.json').read_text())['projection']
def inside(p,ring):
 x,y=p;hit=False
 for i,a in enumerate(ring):
  b=ring[i-1]
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:hit=not hit
 return hit
def contains(p,g):
 polygons=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
 return any(inside(p,polygon[0]) and not any(inside(p,hole) for hole in polygon[1:]) for polygon in polygons)
def project(p):
 a=projection;return [round((p[0]-a['xmin'])*a['xscale']*a['scale']+a['offsetX'],1),round((a['ymax']-p[1])*a['scale']+a['offsetY'],1)]
region_names={'Արագածոտնի մարզ':'AM-AG','Արարատի մարզ':'AM-AR','Արմավիրի մարզ':'AM-AV','Գեղարքունիքի մարզ':'AM-GR','Լոռու մարզ':'AM-LO','Կոտայքի մարզ':'AM-KT','Շիրակի մարզ':'AM-SH','Սյունիքի մարզ':'AM-SU','Վայոց ձորի մարզ':'AM-VD','Տավուշի մարզ':'AM-TV','Երևան':'AM-ER'}
groups={region['properties']['shapeISO']:[] for region in regions};unmatched=[];skipped=0
overrides=json.loads(Path('data/geography/villageOverrides.json').read_text())['excluded'];retained=[];seen_wikidata=set();removed=[]
def canonical(name):return re.sub(r'[^Ա-Ֆա-ֆև]','',unicodedata.normalize('NFC',name)).lower()
def near(a,b,meters):return math.hypot((a[0]-b[0])*85000,(a[1]-b[1])*111000)<meters
def one_edit(a,b):
 if a==b:return True
 if abs(len(a)-len(b))>1:return False
 if len(a)>len(b):a,b=b,a
 if len(a)==len(b):return sum(x!=y for x,y in zip(a,b))<=1
 for i in range(len(b)):
  if b[:i]+b[i+1:]==a:return True
 return False
for element in sorted(raw['elements'],key=lambda e:(0 if e['tags'].get('is_in:region') in region_names else 1,0 if e['type']=='node' else 1,0 if e['tags'].get('wikidata') else 1)):
 tags=element['tags'];name=(tags.get('name:hy') or tags.get('name','')).strip();coord=element.get('center',element);osm_id=element['type']+'/'+str(element['id']);wiki=tags.get('wikidata','')
 if osm_id in overrides:removed.append({'id':osm_id,'reason':'manual_review','name':name});continue
 if not re.search('[Ա-Ֆա-ֆև]',name) or tags.get('abandoned')=='yes' or tags.get('disused')=='yes':skipped+=1;continue
 point=[round(coord['lon'],6),round(coord['lat'],6)];region=region_names.get(tags.get('is_in:region','')) or next((r['properties']['shapeISO'] for r in regions if contains(point,r['geometry'])),None)
 if not region:unmatched.append({'name':name,'coordinates':point});continue
 if wiki and wiki in seen_wikidata:removed.append({'id':osm_id,'reason':'same_wikidata','name':name});continue
 duplicate=next((item for item in retained if (canonical(item['name'])==canonical(name) and near(item['coordinates'],point,3500) or one_edit(canonical(item['name']),canonical(name)) and near(item['coordinates'],point,200)) and not(wiki and item.get('wikidata') and wiki!=item['wikidata'])),None)
 if duplicate:removed.append({'id':osm_id,'reason':'nearby_duplicate','name':name,'preferred':duplicate['id']});continue
 if wiki:seen_wikidata.add(wiki)
 groups[region].append({'id':osm_id,'name':name,'coordinates':point,'point':project(point),'kind':tags['place'],'wikidata':wiki,'municipality':tags.get('is_in:municipality',''),'source':'https://www.openstreetmap.org/'+osm_id})
 retained.append(groups[region][-1])
folder=Path('public/data/armenia/villages');folder.mkdir(parents=True,exist_ok=True)
summary={};total=0
for region,items in groups.items():
 items.sort(key=lambda item:item['name']);payload={'region':region,'updated':raw.get('osm3s',{}).get('timestamp_osm_base',datetime.datetime.now(datetime.timezone.utc).isoformat()),'source':'https://www.openstreetmap.org/copyright','license':'ODbL-1.0','items':items};path=folder/(region+'.json');path.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n');summary[region]={'count':len(items),'bytes':path.stat().st_size};total+=len(items)
Path('data/geography/armenia-village-counts.json').write_text(json.dumps({code:info['count'] for code,info in summary.items()},separators=(',',':'))+'\n')
Path('data/geography/villageAudit.json').write_text(json.dumps({'snapshot':raw.get('osm3s',{}).get('timestamp_osm_base'),'counts':summary,'removed':removed,'unmatched':unmatched,'skipped':skipped,'notes':'OpenStreetMap extract reviewed for duplicates; not certified against a complete official settlement register.'},ensure_ascii=False,indent=2)+'\n')
print('Saved villages:',total,'by region:',summary,'unmatched:',len(unmatched),'without Armenian names or abandoned:',skipped)
