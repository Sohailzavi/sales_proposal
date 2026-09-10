import base64
from PIL import Image
import os

img = Image.open('public/reference-letterhead.png')
print('Reference letterhead size:', img.size)

img_rgb = img.convert('RGB')
img_rgb.save('public/sample-letterhead-opt.png', format='PNG', optimize=True)

with open('public/sample-letterhead-opt.png', 'rb') as f:
    b64_bytes = f.read()

b64_str = base64.b64encode(b64_bytes).decode('utf-8')
data_uri = f"data:image/png;base64,{b64_str}"

print(f"Base64 string length: {len(data_uri)}")

js_file = os.path.join('src', 'data', 'letterheadBase64.js')
with open(js_file, 'w', encoding='utf-8') as f:
    f.write(f'export const SAMPLE_LETTERHEAD_BASE64 = "{data_uri}";\n')

print("Updated src/data/letterheadBase64.js successfully!")
