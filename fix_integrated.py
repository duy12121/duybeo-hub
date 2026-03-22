import os

# Fix asset paths in the integrated index.html from absolute to relative
path = r"e:\a\ah\web\en\integrated\index.html"

if not os.path.exists(path):
    print("ERROR: Chay setup_integrated.bat truoc!")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace absolute paths with relative paths
content = content.replace('href="/vite.svg"', 'href="./vite.svg"')
content = content.replace('src="/assets/', 'src="./assets/')
content = content.replace('href="/assets/', 'href="./assets/')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Fixed asset paths to relative.")
print("Truy cap: web/en/integrated/index.html")
