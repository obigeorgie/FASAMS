import json
import os

try:
    with open('firebase_config.json', 'r', encoding='utf-16') as f:
        content = f.read()
    print(content)
except Exception as e:
    print(f"Error: {e}")
