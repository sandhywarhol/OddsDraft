import os
import glob
import json
import re

base_dir = '/Users/macbookpro/Documents/OddsDraft/public/commentary base'
txt_files = glob.glob(os.path.join(base_dir, '*.txt'))

knowledge_base = {}

for file in txt_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by double newline to roughly get blocks for each country
    blocks = content.split('\n\n')
    
    for block in blocks:
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        if not lines:
            continue
        
        # A country block usually starts with a flag and name, e.g. "🇦🇷 Argentina"
        # We look for lines that have emojis and a country name, or just "Argentina" without bullet points
        first_line = lines[0]
        if first_line.startswith('OddsDraft Commentary') or first_line.startswith('Document'):
            continue
            
        # Match something like "🇦🇷 Argentina" -> "Argentina"
        country_match = re.search(r'(?:[\U0001F1E6-\U0001F1FF]{2}\s*)?([A-Za-z\s]+)', first_line)
        if not country_match:
            continue
            
        country = country_match.group(1).strip()
        if country.lower() in ['oddsdraft commentary knowledge base', 'document']:
            continue
            
        if country not in knowledge_base:
            knowledge_base[country] = {}
            
        current_category = None
        for line in lines[1:]:
            # If line doesn't start with a bullet, it's a category (e.g. "Pemain", "World Cup")
            if not line.startswith('•'):
                current_category = line
                if current_category not in knowledge_base[country]:
                    knowledge_base[country][current_category] = []
            else:
                if current_category:
                    fact = line.lstrip('• \t')
                    knowledge_base[country][current_category].append(fact)

# Clean up empty entries
clean_kb = {}
for country, data in knowledge_base.items():
    if data and any(data.values()):
        clean_kb[country] = data

# Output JSON to a specific path
output_path = '/Users/macbookpro/Documents/OddsDraft/src/lib/commentaryKnowledge.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(clean_kb, f, ensure_ascii=False, indent=2)

print(f'Successfully parsed {len(clean_kb)} countries.')
