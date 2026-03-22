import os, re

BASE = r"e:\a\ah\web\en"

# Patterns to REMOVE from HTML files
patterns_to_remove = [
    # Typekit script tag (any relative or https URL)
    re.compile(r'\s*<script src="[^"]*use\.typekit\.net/wvc1sfl\.js"></script>\s*\r?\n?'),
    # Typekit.load() inline
    re.compile(r'\s*<script>try \{ Typekit\.load\(\); \} catch \(e\) \{ \}</script>\s*\r?\n?'),
    # GTM inline script block (head) - multiline
    re.compile(
        r'\s*<!-- Google Tag Manager -->\s*\r?\n?'
        r'\s*<script>\(function \(w, d, s, l, i\) \{.*?</script>\s*\r?\n?'
        r'\s*<!-- End Google Tag Manager -->\s*\r?\n?',
        re.DOTALL
    ),
    # GTM noscript block (body) - multiline
    re.compile(
        r'\s*<!-- Google Tag Manager \(noscript\) -->\s*\r?\n?'
        r'\s*<noscript>.*?</noscript>\s*\r?\n?'
        r'\s*<!-- End Google Tag Manager \(noscript\) -->\s*\r?\n?',
        re.DOTALL
    ),
    # jQuery ajaxPrefilter inline script
    re.compile(
        r'\s*<script>\s*\r?\n?'
        r'\s*jQuery\.ajaxPrefilter\(function \(s\) \{\s*\r?\n?'
        r'\s*if \(s\.crossDomain\) \{ s\.contents\.script = false; \}\s*\r?\n?'
        r'\s*\}\);\s*\r?\n?'
        r'\s*</script>\s*\r?\n?'
    ),
]

# After removing, add services.js reference right after <link rel="stylesheet" href="...style.css">
def add_services_js(content, rel_path):
    """Add <script src="path/to/services.js"> after the style.css link"""
    # Calculate relative path to common/js/services.js based on file depth
    depth = rel_path.count(os.sep)
    prefix = "../" * depth if depth > 0 else ""
    services_tag = f'\t<script src="{prefix}common/js/services.js"></script>'
    
    # Insert after style.css link
    style_pattern = re.compile(r'(<link rel="stylesheet" href="[^"]*style\.css">)')
    if style_pattern.search(content):
        content = style_pattern.sub(r'\1\r\n' + services_tag, content)
    
    return content

count = 0
for root, dirs, files in os.walk(BASE):
    for f in files:
        if not f.endswith('.html'):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
        
        original = content
        
        # Remove all inline service patterns
        for pattern in patterns_to_remove:
            content = pattern.sub('\r\n', content)
        
        # Clean up multiple blank lines
        content = re.sub(r'(\r?\n){3,}', '\r\n\r\n', content)
        
        if content != original:
            # Add services.js reference
            rel = os.path.relpath(os.path.dirname(path), BASE)
            if rel == '.':
                rel = ''
            content = add_services_js(content, rel)
            
            with open(path, 'w', encoding='utf-8', errors='ignore') as fh:
                fh.write(content)
            count += 1
            print(f"  Cleaned: {os.path.relpath(path, BASE)}")

print(f"\nDone! Cleaned {count} HTML files.")
print(f"All services now loaded from: common/js/services.js")
