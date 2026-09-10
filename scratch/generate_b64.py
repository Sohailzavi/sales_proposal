import base64
with open('public/sample-letterhead-opt.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
data_uri = 'data:image/png;base64,' + b64
with open('src/data/letterheadBase64.js', 'w', encoding='utf-8') as out:
    out.write('export const SAMPLE_LETTERHEAD_BASE64 = "' + data_uri + '";\n')
print("Successfully generated src/data/letterheadBase64.js")
