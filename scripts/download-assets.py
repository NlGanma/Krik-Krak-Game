"""Download pinned Poly Haven CC0 assets, including all glTF dependencies."""
import json, subprocess, pathlib, concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]/'public'/'assets'
MODELS=['throw_pillows_01','painted_wooden_chair_02','jug_01','vintage_suitcase']
TEXTURES=['white_plaster_02','wooden_planks','concrete_floor_worn_001']
def fetch(url,path):
 path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists():subprocess.run(['curl','-LfSs','--retry','2',url,'-o',str(path)],check=True)
def metadata(asset):
 return json.loads(subprocess.check_output(['curl','-LfSs','https://api.polyhaven.com/files/'+asset]))
jobs=[];credits=[]
for asset in MODELS:
 data=metadata(asset)['gltf']['2k']['gltf'];jobs.append((data['url'],ROOT/asset/(asset+'.gltf')))
 jobs.extend((v['url'],ROOT/asset/k) for k,v in data['include'].items())
 credits.append({'id':asset,'type':'model','resolution':'2k','source':'https://polyhaven.com/a/'+asset,'license':'CC0'})
for asset in TEXTURES:
 data=metadata(asset)
 for kind in ['Diffuse','nor_gl','Rough']:
  entry=data[kind]['2k']['jpg'];jobs.append((entry['url'],ROOT/asset/(kind+'.jpg')))
 credits.append({'id':asset,'type':'material','resolution':'2k','source':'https://polyhaven.com/a/'+asset,'license':'CC0'})
with concurrent.futures.ThreadPoolExecutor(6) as pool:
 for _ in pool.map(lambda j:fetch(*j),jobs):pass
(ROOT/'credits.json').write_text(json.dumps(credits,indent=2)+'\n')
print(f'Downloaded {len(jobs)} files for {len(credits)} assets.')
