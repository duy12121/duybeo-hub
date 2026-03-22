import os

BASE = r"e:\a\ah\web\en"
count = 0

for root, dirs, files in os.walk(BASE):
    for f in files:
        if f.endswith(('.html', '.css', '.js')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            if 'index-2.html' in content:
                new_content = content.replace('index-2.html', 'index.html')
                with open(path, 'w', encoding='utf-8', errors='ignore') as fh:
                    fh.write(new_content)
                count += 1
                print(f"  Fixed: {os.path.relpath(path, BASE)}")

print(f"\nDone! Replaced index-2.html -> index.html in {count} files.")
