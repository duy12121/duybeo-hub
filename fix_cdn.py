import os, re

BASE = r"e:\a\ah\web\en"

# Regex: any number of ../ followed by these domains → https://domain
PATTERN = re.compile(
    r'(?:\.\./)+('
    r'ajax\.googleapis\.com|'
    r'use\.typekit\.net|'
    r'www\.googletagmanager\.com|'
    r'www\.google-analytics\.com|'
    r'cdnjs\.cloudflare\.com|'
    r'use\.fontawesome\.com'
    r')'
)

def fix(match):
    return 'https://' + match.group(1)

count = 0
for root, dirs, files in os.walk(BASE):
    for f in files:
        if f.endswith(('.html', '.css')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            new_content = PATTERN.sub(fix, content)
            if new_content != content:
                with open(path, 'w', encoding='utf-8', errors='ignore') as fh:
                    fh.write(new_content)
                count += 1
                print(f"  Fixed: {os.path.relpath(path, BASE)}")

print(f"\nDone! Fixed {count} files.")
