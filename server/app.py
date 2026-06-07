import csv
import os

from flask import Flask, request, jsonify
import numpy as np
from PIL import Image, ImageFilter
import io
import keras

app = Flask(__name__)

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model"))
TYPE_MODEL_PATH = os.path.join(MODEL_DIR, "best_skinalyst_patch_cnn.keras")
COND_MODEL_PATH = os.path.join(MODEL_DIR, "best_skin_condition_custom_cnn.keras")

# ── Skin type model (SkinAlyst patch CNN) ──────────────────────────────────────
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

# ── Skin condition model ───────────────────────────────────────────────────────
# "blackheades" in model labels is normalised to "blackheads" in responses
COND_CLASSES = ["acne", "blackheads", "dark spots", "pores", "wrinkles"]
COND_IMG_SIZE = 192

print("Loading skin type model...")
type_model = keras.saving.load_model(TYPE_MODEL_PATH)
print("Loading skin condition model...")
cond_model = keras.saving.load_model(COND_MODEL_PATH)
print("Both scan models loaded.")

# ── Product recommendation data ───────────────────────────────────────────────
_CSV_PATH = os.path.join(os.path.dirname(__file__), "products_clean.csv")
PRODUCTS = []
if os.path.exists(_CSV_PATH):
    with open(_CSV_PATH, encoding="utf-8") as _f:
        for row in csv.DictReader(_f):
            labels = [l.strip() for l in row.get("afterUse", "").split(",") if l.strip()]
            if labels:
                PRODUCTS.append({
                    "brand": row.get("brand", "").title(),
                    "name": row.get("name", ""),
                    "type": row.get("type", "").lower().strip(),
                    "labels": labels,
                })
    print(f"Loaded {len(PRODUCTS)} products for recommendation.")

# Categories surfaced to the frontend (display_name -> list of CSV type values)
_REC_CATEGORIES = {
    "Cleanser":    ["face cleanser"],
    "Serum":       ["serum"],
    "Moisturizer": ["general moisturizer", "day moisturizer"],
    "Sunscreen":   ["sunscreen"],
    "Treatment":   ["facial treatment", "toner", "exfoliator"],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_image_from_request():
    if "file" in request.files:
        return Image.open(request.files["file"].stream)
    data = request.get_json(silent=True) or {}
    image_bytes = data.get("image_bytes")
    if image_bytes:
        return Image.open(io.BytesIO(bytes(image_bytes)))
    return None


def _extract_type_patches(img):
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
    return np.expand_dims(np.array(img).astype("float32") / 255.0, axis=0)


def _build_label_scores(skin_type, conditions):
    """Return a dict mapping label → score modifier for a given skin profile."""
    ls = {}

    if skin_type == "oil":
        ls["Good For Oily Skin"] = 3
        ls["May Worsen Oily Skin"] = -4
        ls["Drying"] = -1
    elif skin_type == "dry":
        ls["Hydrating"] = 3
        ls["Drying"] = -4
    else:  # normal / combination
        ls["Hydrating"] = 1

    for cond in conditions:
        cond = cond.lower()
        if "acne" in cond:
            ls["Acne Fighting"]   = ls.get("Acne Fighting", 0) + 2
            ls["Acne Trigger"]    = ls.get("Acne Trigger", 0) - 3
            ls["Redness Reducing"] = ls.get("Redness Reducing", 0) + 1
        if "blackhead" in cond:
            ls["Acne Fighting"]      = ls.get("Acne Fighting", 0) + 1
            ls["Reduces Large Pores"] = ls.get("Reduces Large Pores", 0) + 2
            ls["Skin Texture"]       = ls.get("Skin Texture", 0) + 1
            ls["Acne Trigger"]       = ls.get("Acne Trigger", 0) - 2
        if "dark" in cond or "spot" in cond:
            ls["Dark Spots"]  = ls.get("Dark Spots", 0) + 3
            ls["Brightening"] = ls.get("Brightening", 0) + 2
            ls["Scar Healing"] = ls.get("Scar Healing", 0) + 1
        if "pore" in cond:
            ls["Reduces Large Pores"] = ls.get("Reduces Large Pores", 0) + 3
            ls["Skin Texture"]        = ls.get("Skin Texture", 0) + 2
        if "wrinkle" in cond:
            ls["Anti-Aging"]   = ls.get("Anti-Aging", 0) + 3
            ls["Skin Texture"] = ls.get("Skin Texture", 0) + 1
            ls["Scar Healing"] = ls.get("Scar Healing", 0) + 1

    # Universal penalties
    ls["Irritating"] = ls.get("Irritating", 0) - 2
    ls["Rosacea"]    = ls.get("Rosacea", 0) - 1
    return ls


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    img = _load_image_from_request()
    if img is None:
        return jsonify({"error": "no image provided"}), 400

    img = img.convert("RGB")
    patches = _extract_type_patches(img)
    all_probs = type_model.predict(patches, verbose=0)
    avg_probs = np.mean(all_probs, axis=0)
    idx = int(np.argmax(avg_probs))
    return jsonify({"type": TYPE_CLASSES[idx], "confidence": float(avg_probs[idx])})


@app.post("/detect")
def detect():
    img = _load_image_from_request()
    if img is None:
        return jsonify({"error": "no image provided"}), 400

    img = img.convert("RGB")
    x = _preprocess_conditions(img)
    probs = cond_model.predict(x, verbose=0)[0]
    dets = [
        {"label": COND_CLASSES[i], "confidence": float(probs[i])}
        for i in range(len(COND_CLASSES))
    ]
    dets.sort(key=lambda d: d["confidence"], reverse=True)
    return jsonify({"detections": dets})


@app.post("/recommend")
def recommend():
    data = request.get_json(silent=True) or {}
    skin_type  = data.get("skin_type", "normal").lower().strip()
    conditions = [str(c).lower().strip() for c in data.get("conditions", [])]

    ls = _build_label_scores(skin_type, conditions)
    max_positive = sum(v for v in ls.values() if v > 0) or 1

    results = {}
    for category, type_list in _REC_CATEGORIES.items():
        scored = []
        for product in PRODUCTS:
            if product["type"] not in type_list:
                continue
            labels = product["labels"]
            score = sum(ls.get(lbl, 0) for lbl in labels)
            if score <= 0:
                continue
            beneficial = [lbl for lbl in labels if ls.get(lbl, 0) > 0]
            match_pct = min(100, max(10, int(score / max_positive * 100)))
            scored.append({
                "brand":      product["brand"],
                "name":       product["name"],
                "type":       product["type"].title(),
                "score":      score,
                "match_pct":  match_pct,
                "beneficial": beneficial[:3],
            })
        scored.sort(key=lambda x: x["score"], reverse=True)
        results[category] = scored[:6]

    return jsonify({
        "skin_type":       skin_type,
        "conditions":      conditions,
        "recommendations": results,
    })


if __name__ == "__main__":
    print("Service is running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000)
