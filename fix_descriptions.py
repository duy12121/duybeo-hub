import re

path = r"e:\a\ah\web\en\index.html"
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Map of section titles to find
sections = {
    "Interior Design": "Đây là chỗ để mô tả về Interior Design.",
    "Sustainability / Resilience": "Đây là chỗ để mô tả về Sustainability / Resilience.",
}

for title, placeholder in sections.items():
    # Find the accordion-text div for this section and replace the <p>...</p> content
    # Pattern: after accordion-title with this title, find the first <p>...</p> block (not the detail one)
    pattern = re.compile(
        r'(accordion-title">' + re.escape(title) + r'</h3>\s*<div class="accordion-text">\s*)'
        r'<p>.*?</p>',
        re.DOTALL
    )
    match = pattern.search(content)
    if match:
        old = match.group(0)
        new = match.group(1) + '<p>' + placeholder + '</p>'
        content = content.replace(old, new)
        print(f"  Fixed: {title}")
    else:
        print(f"  NOT FOUND: {title}")

with open(path, 'w', encoding='utf-8', errors='ignore') as f:
    f.write(content)

print("\nDone!")
