from flask import Flask, request, jsonify
import numpy as np
from PIL import Image
import io
import os
import onnxruntime as ort

app = Flask(__name__)

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model", "skin_classifier.onnx"))
CLASS_NAMES = ["dry", "normal", "oil"]
session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name
input_shape = session.get_inputs()[0].shape
DETECT_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "model", "skin_conditions.onnx"))
CONDITION_NAMES = ["acne", "blackheads", "dark spots", "pores", "wrinkles"]
session2 = ort.InferenceSession(DETECT_MODEL_PATH, providers=["CPUExecutionProvider"]) if os.path.exists(DETECT_MODEL_PATH) else None
input2_name = session2.get_inputs()[0].name if session2 else None
input2_shape = session2.get_inputs()[0].shape if session2 else None


def preprocess_image(img: Image.Image):
    img = img.convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img).astype("float32") / 255.0
    arr = np.expand_dims(arr, axis=0)
    if len(input_shape) == 4 and (input_shape[1] == 3 or (isinstance(input_shape[1], str) and input_shape[1].lower() == "c")):
        arr = np.transpose(arr, (0, 3, 1, 2))
    return arr
def preprocess_image2(img: Image.Image):
    img = img.convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img).astype("float32") / 255.0
    arr = np.expand_dims(arr, axis=0)
    if input2_shape and len(input2_shape) == 4 and (input2_shape[1] == 3 or (isinstance(input2_shape[1], str) and input2_shape[1].lower() == "c")):
        arr = np.transpose(arr, (0, 3, 1, 2))
    return arr


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    if "file" in request.files:
        file = request.files["file"]
        img = Image.open(file.stream)
    else:
        data = request.get_json(silent=True) or {}
        image_bytes = data.get("image_bytes")
        if not image_bytes:
            return jsonify({"error": "no image provided"}), 400
        img = Image.open(io.BytesIO(bytes(image_bytes)))

    x = preprocess_image(img)
    outputs = session.run(None, {input_name: x})
    probs = outputs[0]
    if probs.ndim == 2:
        probs = probs[0]
    probs = probs.astype("float32")
    s = float(np.sum(probs))
    if not np.isfinite(s) or abs(s - 1.0) > 1e-3:
        e = probs - np.max(probs)
        probs = np.exp(e) / np.sum(np.exp(e))
    idx = int(np.argmax(probs))
    conf = float(probs[idx])
    return jsonify({"type": CLASS_NAMES[idx], "confidence": conf})

@app.post("/detect")
def detect():
    if session2 is None:
        return jsonify({"error": "conditions model not found"}), 500
    if "file" in request.files:
        file = request.files["file"]
        img = Image.open(file.stream)
    else:
        data = request.get_json(silent=True) or {}
        image_bytes = data.get("image_bytes")
        if not image_bytes:
            return jsonify({"error": "no image provided"}), 400
        img = Image.open(io.BytesIO(bytes(image_bytes)))
    x = preprocess_image2(img)
    outputs = session2.run(None, {input2_name: x})
    logits = outputs[0]
    if logits.ndim == 2:
        logits = logits[0]
    logits = logits.astype("float32")
    e = logits - np.max(logits)
    probs = np.exp(e) / np.sum(np.exp(e))
    probs = probs.tolist()
    dets = []
    for i, label in enumerate(CONDITION_NAMES[: len(probs)]):
        dets.append({"label": label, "confidence": float(probs[i])})
    dets.sort(key=lambda d: d["confidence"], reverse=True)
    return jsonify({"detections": dets})

if __name__ == "__main__":
    print("✅ Service is running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000)
