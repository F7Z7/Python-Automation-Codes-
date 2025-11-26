import os
import re

# Folder path where your files are stored
folder_path = f"E:\\Games"   # <-- change this to your folder

pattern = re.compile(r".*\.part(\d+)\.rar$", re.IGNORECASE)

found_parts = set()

for filename in os.listdir(folder_path):
    match = pattern.match(filename)
    if match:
        num = int(match.group(1))
        found_parts.add(num)

# expected parts 1 to 53
expected_parts = set(range(1, 54))

missing = sorted(expected_parts - found_parts)

if missing:
    print("Missing Parts:")
    for m in missing:
        print(f"part{m:02}.rar")
else:
    print("All parts 1–53 are present!")
