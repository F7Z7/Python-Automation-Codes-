# This project tracks and automates new file changes.
# Whenever a new file is detected, it is automatically pushed to the GitHub repo
# with the commit message set to the file name.
# Technologies used: subprocess, os



import subprocess


result = subprocess.run(
    ["git", "status", "--porcelain"],
    capture_output=True,
    text=True
)
# print(result)
lines=result.stdout.splitlines()
untracked_files=[]

for file in lines:
    if file.startswith("??") or file.startswith(" M") or file.startswith("A ") or file.startswith("AM"):
        file_name=file[3:]
        print(file_name)
        untracked_files.append(file_name)

# print(untracked_files)


for f in untracked_files:
    subprocess.run(["git", "add", f])
    subprocess.run(["git", "commit", "-m", f])
    subprocess.run(["git", "push", "origin", "main"])
    print(f"Pushed {f} to the repo")