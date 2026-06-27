import csv
import json
import os

# Force deterministic ops before TF initialises
os.environ['TF_DETERMINISTIC_OPS'] = '1'
os.environ['TF_CUDNN_DETERMINISTIC'] = '1'

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image, ImageFilter
import io
import keras
import tensorflow as tf

# Seed everything so model(x, training=False) is fully reproducible
tf.random.set_seed(42)
np.random.seed(42)

# ── Face detection (OpenCV Haar cascade — no extra model download needed) ──────
try:
    import cv2 as _cv2
    _FACE_CASCADE = _cv2.CascadeClassifier(
        _cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    _USE_FACE_DETECTION = True
    print("OpenCV available — using face detection for skin validation.")
except ImportError:
    _cv2 = None
    _FACE_CASCADE = None
    _USE_FACE_DETECTION = False
    print("OpenCV not found — using colour-analysis fallback.")
    print("For best results run:  pip install opencv-python-headless")

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model"))
TYPE_MODEL_PATH = os.path.join(MODEL_DIR, "best_skinalyst_patch_cnn.keras")
COND_MODEL_PATH = os.path.join(MODEL_DIR, "best_skin_condition_custom_cnn.keras")
REC_MODEL_PATH  = os.path.join(MODEL_DIR, "skin_product_effect_model.keras")

# ── Skin type model ────────────────────────────────────────────────────────────
TYPE_CLASSES = ["dry", "normal", "oil"]
TYPE_IMG_SIZE = 160
TYPE_CROP_BOXES = [
    [0.25, 0.25, 0.75, 0.75],  # center
    [0.12, 0.35, 0.48, 0.78],  # left cheek
    [0.52, 0.35, 0.88, 0.78],  # right cheek
    [0.30, 0.12, 0.70, 0.42],  # forehead
    [0.30, 0.58, 0.70, 0.92],  # chin
]

# ── Skin condition model ───────────────────────────────────────────────────────
COND_CLASSES = ["acne", "blackheads", "dark spots", "pores", "wrinkles"]
COND_IMG_SIZE = 192

# ── Recommendation label names (17 labels, model output order) ────────────────
_LABEL_NAMES_PATH = os.path.join(os.path.dirname(__file__), "label_names.json")
with open(_LABEL_NAMES_PATH, encoding="utf-8") as _f:
    LABEL_NAMES = json.load(_f)   # list of 17 strings

print("Loading skin type model...")
type_model = keras.saving.load_model(TYPE_MODEL_PATH)
print("Loading skin condition model...")
cond_model = keras.saving.load_model(COND_MODEL_PATH)
print("Loading product recommendation model...")
rec_model  = keras.saving.load_model(REC_MODEL_PATH)
print("All models loaded.")

# ── Product CSV ───────────────────────────────────────────────────────────────
_CSV_PATH = os.path.join(os.path.dirname(__file__), "products_clean.csv")
PRODUCTS = []
if os.path.exists(_CSV_PATH):
    with open(_CSV_PATH, encoding="utf-8") as _f:
        for row in csv.DictReader(_f):
            labels = [l.strip() for l in row.get("afterUse", "").split(",") if l.strip()]
            if not labels:
                continue
            PRODUCTS.append({
                "brand":       row.get("brand", "").title(),
                "name":        row.get("name", ""),
                "type":        row.get("type", "").lower().strip(),
                "country":     row.get("country", ""),
                "ingredients": row.get("ingredients_clean", row.get("ingridients", "")),
                "labels":      labels,
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

# How many candidates per category to re-rank with the ML model
_ML_CANDIDATES = 40


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_image_from_request():
    if "file" in request.files:
        return Image.open(request.files["file"].stream)
    data = request.get_json(silent=True) or {}
    image_bytes = data.get("image_bytes")
    if image_bytes:
        return Image.open(io.BytesIO(bytes(image_bytes)))
    return None


def _region_has_skin(rgb_arr, x, y, w, h):
    """Check that a detected face region actually contains skin-tone pixels."""
    region = rgb_arr[y:y+h, x:x+w].astype(np.float32)
    if region.size == 0:
        return False
    R, G, B = region[:,:,0], region[:,:,1], region[:,:,2]

    # Orange/yellow animal fur (cats, dogs) has G >> B in a way human skin never does.
    # Human skin (all tones): G/B < 1.33.  Cat/dog fur: G/B ≈ 1.4–1.75.
    animal_fur = (R > G * 1.15) & (G > B * 1.35) & (R > 120)
    if float(animal_fur.sum()) / max(animal_fur.size, 1) > 0.30:
        return False

    ycbcr = np.array(
        Image.fromarray(rgb_arr[y:y+h, x:x+w]).convert("YCbCr"),
        dtype=np.float32
    )
    Y, Cb, Cr = ycbcr[:,:,0], ycbcr[:,:,1], ycbcr[:,:,2]
    skin = (
        (Cb >= 77) & (Cb <= 130) &
        (Cr >= 130) & (Cr <= 173) &
        (Y  >= 40) &
        (B  >= G * 0.65)
    )
    return float(skin.sum()) / max(skin.size, 1) >= 0.25


def _is_predominantly_skin(rgb_arr):
    """
    Fallback for extreme close-ups where the cascade can't find a full face.
    A tight skin/face crop has 60-90 % skin pixels; food images rarely exceed 30 %.
    """
    rgb = rgb_arr.astype(np.float32)
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    # Reject green-dominant images (plants, grass)
    green_mask = (G > R + 15) & (G > B + 15) & (G > 50)
    if float(green_mask.sum()) / max(green_mask.size, 1) > 0.25:
        return False

    # NOTE: No animal-fur gate here — warm/golden human hair has identical R/G and G/B
    # ratios to cat fur, so a full-image fur gate false-positives on portraits with
    # warm hair. The animal_fur gate lives only in _region_has_skin() where it applies
    # to the Haar-detected face box (not the whole scene).

    # Reject images with significant saturated-red pixels (strawberries, tomatoes,
    # cherries, red peppers, etc.).  Human skin — even reddish/flushed — never
    # reaches R > G*1.4 across more than a tiny fraction of a selfie.
    red_food_mask = (R > 130) & (R > G * 1.4) & (R > B * 1.8)
    if float(red_food_mask.sum()) / max(red_food_mask.size, 1) > 0.08:
        return False

    ycbcr = np.array(Image.fromarray(rgb_arr).convert("YCbCr"), dtype=np.float32)
    Y, Cb, Cr = ycbcr[:, :, 0], ycbcr[:, :, 1], ycbcr[:, :, 2]

    # Saturation: (max-min)/max — rejects near-white (coleslaw) and near-grey pixels
    maxC = np.maximum(np.maximum(R, G), B)
    minC = np.minimum(np.minimum(R, G), B)
    saturation = np.where(maxC > 0, (maxC - minC) / maxC, 0.0)

    skin = (
        (Cb >= 77) & (Cb <= 130) &
        (Cr >= 133) & (Cr <= 173) &
        (Y  >= 40)  &
        (B  >= G * 0.65) &         # raised: human skin B/G ≥ 0.75; cat/animal fur ≈ 0.55-0.62
        (saturation >= 0.12)
    )
    # Full-image ratio or generous centre-crop ratio — catches partial face / chin / neck shots
    full_ratio   = float(skin.sum()) / max(skin.size, 1)
    h, w         = skin.shape[:2]
    ch, cw       = h // 2, w // 2
    rh, rw       = max(1, h * 3 // 8), max(1, w * 3 // 8)
    centre       = skin[ch - rh:ch + rh, cw - rw:cw + rw]
    centre_ratio = float(centre.sum()) / max(centre.size, 1)
    return full_ratio >= 0.40 or centre_ratio >= 0.46


def _is_skin_image(img):
    """
    Validates that the image contains real skin / a human face.

    Two-step when OpenCV is available:
      1. Haar cascade with STRICT parameters (minNeighbors=8) to find candidate
         face regions — high minNeighbors eliminates the false positives that the
         default settings produce on food/offices/patterns.
      2. For every candidate region, verify it actually contains skin-tone pixels
         (YCbCr + B/G ratio check on the detected box). A food pattern that fools
         the cascade will NOT have enough skin-coloured pixels in that box.

    Colour-only fallback when OpenCV is absent:
      - Green gate (rejects plants)
      - Centre-crop skin ratio check (rejects food/objects)
    """
    if _USE_FACE_DETECTION:
        rgb_arr = np.array(img.convert("RGB"), dtype=np.uint8)
        gray = _cv2.cvtColor(rgb_arr, _cv2.COLOR_RGB2GRAY)
        gray = _cv2.equalizeHist(gray)
        detections = _FACE_CASCADE.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=8,
            minSize=(60, 60),
            flags=_cv2.CASCADE_SCALE_IMAGE,
        )
        img_area = gray.shape[0] * gray.shape[1]

        # Keep only detections large enough to be a real subject (≥5 % of frame)
        significant = [(x, y, w, h) for (x, y, w, h) in detections
                       if (w * h) / img_area >= 0.05]

        if significant:
            # Haar found face-geometry candidates.  Check each for human skin.
            for (x, y, w, h) in significant:
                if _region_has_skin(rgb_arr, x, y, w, h):
                    return True
            # Haar found face-like regions but NONE passed the human-skin check.
            # This is the definitive "animal face" signal (cat, dog, etc.).
            # Do NOT fall through to the colour fallback — return False immediately.
            return False

        # Haar found nothing significant (close-up, partial face, unusual angle).
        # Use the colour fallback so chin/neck/forehead close-ups still work.
        return _is_predominantly_skin(rgb_arr)

    # ── Color-based fallback ──────────────────────────────────────────────────
    rgb = np.array(img.convert("RGB"), dtype=np.float32)
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    h, w = R.shape

    # Gate 1: reject green-dominant images (plants, grass, leaves)
    green_mask = (G > R + 15) & (G > B + 15) & (G > 50)
    if float(green_mask.sum()) / max(green_mask.size, 1) > 0.30:
        return False

    # Gate 2: analyse only the centre 60 % — faces live here, background doesn't
    cy, cx = h // 2, w // 2
    rh, rw = max(1, int(h * 0.30)), max(1, int(w * 0.30))
    R_c = R[cy - rh:cy + rh, cx - rw:cx + rw]
    G_c = G[cy - rh:cy + rh, cx - rw:cx + rw]
    B_c = B[cy - rh:cy + rh, cx - rw:cx + rw]

    crop = img.crop((cx - rw, cy - rh, cx + rw, cy + rh))
    ycbcr_c = np.array(crop.convert("YCbCr"), dtype=np.float32)
    Y_c  = ycbcr_c[:, :, 0]
    Cb_c = ycbcr_c[:, :, 1]
    Cr_c = ycbcr_c[:, :, 2]

    skin_mask = (
        (Cb_c >= 77)  & (Cb_c <= 130) &
        (Cr_c >= 130) & (Cr_c <= 175) &
        (Y_c  >= 16)  &
        (B_c  >= G_c * 0.60)  # skin keeps blue; golden food/bread does not
    )
    skin_ratio = float(skin_mask.sum()) / max(skin_mask.size, 1)
    return skin_ratio >= 0.20


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
        ls["Good For Oily Skin"]   = 3
        ls["May Worsen Oily Skin"] = -4
        ls["Drying"] = -1
    elif skin_type == "dry":
        ls["Hydrating"] = 3
        ls["Drying"]    = -4
    else:
        ls["Hydrating"] = 1

    for cond in conditions:
        cond = cond.lower()
        if "acne" in cond:
            ls["Acne Fighting"]    = ls.get("Acne Fighting", 0) + 2
            ls["Acne Trigger"]     = ls.get("Acne Trigger", 0) - 3
            ls["Redness Reducing"] = ls.get("Redness Reducing", 0) + 1
        if "blackhead" in cond:
            ls["Acne Fighting"]       = ls.get("Acne Fighting", 0) + 1
            ls["Reduces Large Pores"] = ls.get("Reduces Large Pores", 0) + 2
            ls["Skin Texture"]        = ls.get("Skin Texture", 0) + 1
            ls["Acne Trigger"]        = ls.get("Acne Trigger", 0) - 2
        if "dark" in cond or "spot" in cond:
            ls["Dark Spots"]   = ls.get("Dark Spots", 0) + 3
            ls["Brightening"]  = ls.get("Brightening", 0) + 2
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


def _ml_rescore(candidates, label_scores):
    """
    Run skin_product_effect_model on a batch of candidate products.
    Returns the original list with 'ml_score' added, sorted descending.
    """
    if not candidates:
        return candidates

    # Build batched string inputs — Keras TextVectorization requires tf.constant strings
    try:
        inputs = {
            "ingredients":  tf.constant([[p["ingredients"]]  for p in candidates]),
            "product_type": tf.constant([[p["type"]]         for p in candidates]),
            "brand":        tf.constant([[p["brand"]]        for p in candidates]),
            "country":      tf.constant([[p["country"]]      for p in candidates]),
        }
        probs = rec_model.predict(inputs, verbose=0, batch_size=32)  # (N, 17)
    except Exception as e:
        print(f"[rec_model.predict error] {e}")
        # Fall back to initial score
        for p in candidates:
            p["ml_score"] = p["score"]
        return sorted(candidates, key=lambda x: x["ml_score"], reverse=True)

    # Compute ML score as dot product of probabilities with label_scores
    label_score_vec = np.array([label_scores.get(lbl, 0.0) for lbl in LABEL_NAMES], dtype="float32")
    ml_scores = probs @ label_score_vec  # (N,)

    for i, p in enumerate(candidates):
        p["ml_score"] = float(ml_scores[i])

    return sorted(candidates, key=lambda x: x["ml_score"], reverse=True)


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

    if not _is_skin_image(img):
        return jsonify({"is_skin": False, "error": "not_skin"})

    patches = _extract_type_patches(img)
    # training=False disables any Dropout in the model → deterministic output
    all_probs = type_model(patches, training=False).numpy()
    avg_probs = np.mean(all_probs, axis=0)
    idx = int(np.argmax(avg_probs))
    return jsonify({"is_skin": True, "type": TYPE_CLASSES[idx], "confidence": float(avg_probs[idx])})


@app.post("/detect")
def detect():
    img = _load_image_from_request()
    if img is None:
        return jsonify({"error": "no image provided"}), 400

    img = img.convert("RGB")

    if not _is_skin_image(img):
        return jsonify({"is_skin": False, "detections": []})

    x = _preprocess_conditions(img)
    # Run 5 forward passes with training=False and average to eliminate any
    # MC-Dropout stochasticity that caused wildly different results on the same image
    passes = np.stack([cond_model(x, training=False).numpy()[0] for _ in range(5)])
    probs  = np.mean(passes, axis=0)
    dets = [
        {"label": COND_CLASSES[i], "confidence": float(probs[i])}
        for i in range(len(COND_CLASSES))
    ]
    dets.sort(key=lambda d: d["confidence"], reverse=True)
    return jsonify({"is_skin": True, "detections": dets})


@app.post("/recommend")
def recommend():
    data       = request.get_json(silent=True) or {}
    skin_type  = data.get("skin_type", "normal").lower().strip()
    # conditions may be strings or {label, confidence} objects
    raw_conds  = data.get("conditions", [])
    conditions = [
        (c["label"] if isinstance(c, dict) else str(c)).lower().strip()
        for c in raw_conds
    ]

    label_scores  = _build_label_scores(skin_type, conditions)
    max_positive  = sum(v for v in label_scores.values() if v > 0) or 1

    results = {}
    for category, type_list in _REC_CATEGORIES.items():
        # ── Step 1: initial label-match filter ────────────────────────────────
        scored = []
        for product in PRODUCTS:
            if product["type"] not in type_list:
                continue
            score = sum(label_scores.get(lbl, 0) for lbl in product["labels"])
            if score <= 0:
                continue
            beneficial = [lbl for lbl in product["labels"] if label_scores.get(lbl, 0) > 0]
            scored.append({**product, "score": score, "beneficial": beneficial})

        scored.sort(key=lambda x: x["score"], reverse=True)
        candidates = scored[: _ML_CANDIDATES]

        # ── Step 2: ML re-rank using ingredient model ──────────────────────────
        reranked = _ml_rescore(candidates, label_scores)

        # ── Step 3: build final output (top 6) ───────────────────────────────
        top = []
        for p in reranked[:6]:
            combined = p["score"] + max(0, p["ml_score"])
            match_pct = min(100, max(10, int(combined / (max_positive * 2) * 100)))
            top.append({
                "brand":      p["brand"],
                "name":       p["name"],
                "type":       p["type"].title(),
                "match_pct":  match_pct,
                "beneficial": p["beneficial"][:3],
            })
        results[category] = top

    return jsonify({
        "skin_type":       skin_type,
        "conditions":      conditions,
        "recommendations": results,
    })


if __name__ == "__main__":
    print("Service is running on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
