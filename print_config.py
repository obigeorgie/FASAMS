import json

try:
    with open('config_full.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        print(json.dumps(data, indent=2))
except Exception as e:
    # Try reading as text to see what happened if json fails
    try:
        with open('config_full.json', 'r', encoding='utf-16') as f:
            print(f.read())
    except:
        print(f"Error reading file: {e}")
