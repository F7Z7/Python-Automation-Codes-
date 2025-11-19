#this is a file i used to familirize with face detection
#another hobby project


from retinaface import RetinaFace
import cv2
import matplotlib.pyplot as plt


img_path = "Farza.jpeg"
img = cv2.imread(img_path)
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


results = RetinaFace.detect_faces(img_path)


if isinstance(results, dict):
    for key in results:
        face = results[key]
        x1, y1, x2, y2 = face["facial_area"]

        # Draw rectangle
        cv2.rectangle(
            img,
            (x1, y1),
            (x2, y2),
            (0, 255, 0), 3
        )

plt.imshow(img)
plt.axis("off")
plt.show()
