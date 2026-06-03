from flask import Flask, request, jsonify
import numpy as np
from PIL import Image, ImageFilter
import io
import os
import keras

app = Flask(__name__)

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model"))
TYPE_MODEL_PATH = os.path.join(MODEL_DIR, "best_skinalyst_patch_cnn.keras")
COND_MODEL_PATH = os.path.join(MODEL_DIR, "best_skin_condition_custom_cnn.keras")

# Skin type model (SkinAlyst patch CNN)
TYPE_CLASSES = ["dry", "normal", "oil"]
TYPE_IMG_SIZE = 160
# Relative [left, top, right, bottom] crop boxes for 5 face regions
TYPE_CROP_BOXES = [
    [0.25, 0.25, 0.75, 0.75],  # center
    [0.12, 0.35, 0.48, 0.78],  # left cheek
    [0.52, 0.35, 0.88, 0.78],  # right cheek
    [0.30, 0.12, 0.70, 0.42],  # forehead
    [0.30, 0.58, 0.70, 0.92],  # chin
]

# Skin condition model (SkinCondition custom CNN)
# Note: model class "blackheades" is normalized to "blackheads" in responses
COND_CLASSES = ["acne", "blackheads", "dark spots", "pores", "wrinkles"]
COND_IMG_SIZE = 192

print("Loading skin type model...")
type_model = keras.saving.load_model(TYPE_MODEL_PATH)
print("Loading skin condition model...")
cond_model = keras.saving.load_model(COND_MODEL_PATH)
print("Both models loaded.")


def _load_image_from_request():
    if "file" in request.files:
        return Image.open(request.files["file"].stream)
    data = request.get_json(silent=True) or {}
    image_bytes = data.get("image_bytes")
    if image_bytes:
        return Image.open(io.BytesIO(bytes(image_bytes)))
    return None


def _extract_type_patches(img):
    """Crop 5 face-region patches, blur, resize to 160x160, normalize."""
    w, h = img.size
    patches = []
    for box in TYPE_CROP_BOXES:
        left, top, right, bottom = (
            int(box[0] * w), int(box[1] * h),
            int(box[2] * w), int(box[3] * h),
        )
        patch = img.crop((left, top, right, bottom))
        patch = patch.filter(ImageFilter.GaussianBlur(radius=1))
        patch = patch.resize((TYPE_IMG_SIZE, TYPE_IMG_SIZE))
        patches.append(np.array(patch).astype("float32") / 255.0)
    return np.stack(patches, axis=0)  # (5, 160, 160, 3)


def _preprocess_conditions(img):
    img = img.resize((COND_IMG_SIZE, COND_IMG_SIZE))
    return np.expand_dims(np.array(img).astype("float32") / 255.0, axis=0)  # (1, 192, 192, 3)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    img = _load_image_from_request()
    if img is None:
        return jsonify({"error": "no image provided"}), 400

    img = img.convert("RGB")
    patches = _extract_type_patches(img)          # (5, 160, 160, 3)
    all_probs = type_model.predict(patches, verbose=0)  # (5, 3)
    avg_probs = np.mean(all_probs, axis=0)        # (3,)
    idx = int(np.argmax(avg_probs))
    return jsonify({"type": TYPE_CLASSES[idx], "confidence": float(avg_probs[idx])})


@app.post("/detect")
def detect():
    img = _load_image_from_request()
    if img is None:
        return jsonify({"error": "no image provided"}), 400

    img = img.convert("RGB")
    x = _preprocess_conditions(img)                     # (1, 192, 192, 3)
    probs = cond_model.predict(x, verbose=0)[0]          # (5,)
    dets = [
        {"label": COND_CLASSES[i], "confidence": float(probs[i])}
        for i in range(len(COND_CLASSES))
    ]
    dets.sort(key=lambda d: d["confidence"], reverse=True)
    return jsonify({"detections": dets})


if __name__ == "__main__":
    print("Service is running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000)
