from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parents[1];images=sorted((p/'renders').glob('S??-SH??.png'));out=Image.new('RGB',(2400,5*300),'#081d2d');d=ImageDraw.Draw(out)
for i,f in enumerate(images):
 im=Image.open(f).convert('RGB').resize((480,270),Image.Resampling.LANCZOS);x=i%5*480;y=i//5*300;out.paste(im,(x,y));d.text((x+12,y+276),f.stem,fill='#4fe2d0')
out.save(p/'renders/airport-180s-contact.png');print('Contact sheet',len(images),'shots')
