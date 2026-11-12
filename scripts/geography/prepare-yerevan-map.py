"""Extract the CC BY-SA 4.0 district layer from 517design's Wikimedia SVG.
Usage: python3 scripts/geography/prepare-yerevan-map.py /path/to/source.svg
Source URL and adaptation credits are stored in the generated map.
"""
import xml.etree.ElementTree as E,json,re,sys
from pathlib import Path
r=E.parse(sys.argv[1]).getroot()
ps=[e for e in r.iter() if e.tag.endswith('polygon') and e.get('class') in ['st1','st2']]
indices={'Աջափնյակ':[12],'Ավան':[0],'Արաբկիր':[3],'Դավթաշեն':[4],'Էրեբունի':[10],'Կենտրոն':[8],'Մալաթիա-Սեբաստիա':[5,6],'Նոր Նորք':[1],'Նորք-Մարաշ':[9],'Նուբարաշեն':[11],'Շենգավիթ':[7],'Քանաքեռ-Զեյթուն':[2]}
labels={}
for t in r.iter():
 if t.tag.endswith('text'):
  name=''.join(t.itertext());name='Քանաքեռ-Զեյթուն' if name=='Զեյթուն' else name
  x,y=list(map(float,re.findall(r'[\d.]+',t.get('transform'))))[-2:];labels[name]=[round(x+len(''.join(t.itertext()))*5,1),round(y-5,1)]
items=[]
for name,ids in indices.items():
 paths=[]
 for idx in ids:
  pts=ps[idx].get('points').split();paths.append('M'+'L'.join(pts)+'Z')
 items.append({'name':name,'path':' '.join(paths),'label':labels[name]})
data={'viewBox':'25 15 870 750','source':'https://commons.wikimedia.org/wiki/File:Yerevan-Districts-hy-Ajapnyak-District.svg','credit':'517design','license':'CC BY-SA 4.0','licenseUrl':'https://creativecommons.org/licenses/by-sa/4.0/','boundaryYear':2022,'changes':'Extracted district polygons, removed background and landmarks, adapted labels and colors.','namesSource':'https://www.yerevan.am/hy/administrative-districts/','items':items}
p=Path(__file__).resolve().parents[2]/'public/data/armenia/districts/yerevan-map.json';p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');print(p.stat().st_size)
