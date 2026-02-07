import json

try:
    with open('sdk_config_json.json', 'r', encoding='utf-8') as f:
        print(f.read())
except UnicodeDecodeError:
    with open('sdk_config_json.json', 'r', encoding='utf-16') as f:
        print(f.read())
except Exception as e:
    print(e)
