import urllib.request
import json
import urllib.error

models = [
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro"
]

data = json.dumps({"contents": [{"parts": [{"text": "Hello"}]}]}).encode('utf-8')

for m in models:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key=DUMMY"
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as f:
            print(f"{m}: OK")
    except urllib.error.HTTPError as e:
        print(f"{m}: HTTP Error: {e.code}")
