# This is one of my most-used automation scripts.
# When working with websites, I often need to convert images to WebP.
# Doing it manually is slow and repetitive.
# With Python and Pillow, the whole process that takes hours can now be done in seconds.



from PIL import Image
import os

source_folder = "E:\\2025\\webp"
web_quality = 85

for filename in os.listdir(source_folder):
    if filename.lower().endswith((".png", ".jpg", ".jpeg")):
        base_name = os.path.splitext(filename)[0]
        webp_path = os.path.join(source_folder, base_name + ".webp")

        # Skip if WebP version already exists
        if os.path.exists(webp_path):
            print(f"Skipping (already converted): {filename}")
            continue

        original_path = os.path.join(source_folder, filename)
        try:
            img = Image.open(original_path)
            img.save(webp_path, "WEBP", quality=web_quality)
            os.remove(original_path)  # delete the original image
            print(f"Converted and deleted: {filename} -> {base_name}.webp")
        except Exception as e:
            print(f"Failed to convert {filename}: {e}")

print("Conversion complete.")
