"""Source-footprint audit only; not an obstacle surface or design compliance check."""
import json
from pathlib import Path
from math import cos,sin,pi
p=Path(__file__).resolve().parents[1];data=json.loads((p/'src/data/airport-project.json').read_text())
def overlap(a,b):
 for poly in [a,b]:
  for v,w in zip(poly,poly[1:]+poly[:1]):
   axis=(-(w[1]-v[1]),w[0]-v[0]);aa=[x*axis[0]+y*axis[1] for x,y in a];bb=[x*axis[0]+y*axis[1] for x,y in b]
   if max(aa)<=min(bb) or max(bb)<=min(aa):return False
 return True
rows=[]
for o in data['objects']:
 if o['kind'] not in ['terminal','tower','parking','transport_hub']:continue
 g=o['geometry']
 if g['type']=='circle':poly=[[g['cx']+g['r']*cos(i*pi/16),g['cy']+g['r']*sin(i*pi/16)] for i in range(32)]
 else:
  x,y,w,h=[g[k] for k in ['x','y','width','height']];poly=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
 for rule in data['no_build_rules']:
  hit=overlap(poly,rule['polygon']);rows.append({'facility':o['id'],'rule':rule['id'],'intersects':hit});assert not hit,(o['id'],rule['id'])
report={'status':'PASS','checks':rows,'scope':'Source footprints versus 3 conceptual no-build polygons; no new buildings or actual ICAO obstacle-surface compliance claimed.'};(p/'reports/spatial-audit.json').write_text(json.dumps(report,indent=2));print('PASS',len(rows),'source-footprint collision checks')
