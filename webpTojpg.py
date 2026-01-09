# I had to manually convert some WebP images back to JPG recently.
# So, I created this simple script to automate the process.




import PIL
import os


source_folder = "E:\\To_Jpg"


if os.path.exists(source_folder):
    for file in os.listdir(source_folder):
        if file.lower().endswith(".webp"):
            base_name = os.path.splitext(file)[0]
            jpg_path = os.path.join(source_folder, base_name + ".jpg")

            webp_path = os.path.join(source_folder, file)
            try:
                img = PIL.Image.open(webp_path).convert("RGB")
                img.save(jpg_path, "JPEG", quality=95)
                os.remove(webp_path)
                print(f"Converted and deleted: {file} -> {base_name}.jpg")
            except Exception as e:
                print(f"Failed to convert {file}: {e}")

