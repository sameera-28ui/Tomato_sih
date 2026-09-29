from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import tensorflow as tf
import numpy as np
from PIL import Image
import io
from pathlib import Path

# Gemini
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os
import json
import re

from services.recommendation import get_recommendation


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in .env")


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="TomatoGuard AI API",
    description="AI-powered Tomato Disease, Pest and Tuta Detection API",
    version="2.0.0"
)


BASE_DIR = Path(__file__).resolve().parent


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MODEL PATHS
# =========================================================

validator_model_path = (
    BASE_DIR / "models" / "tomato_validator_v4_best.keras"
)

disease_model_path = (
    BASE_DIR / "models" / "tomato_disease_best.keras"
)

pest_model_path = (
    BASE_DIR / "models" / "tomato_pest_v2_best.keras"
)

tuta_model_path = (
    BASE_DIR / "models" / "tuta_absoluta_best.keras"
)


# =========================================================
# CHECK MODEL FILES
# =========================================================

print("\n========== MODEL FILE CHECK ==========")

print(
    "Validator V4:",
    validator_model_path,
    validator_model_path.exists()
)

print(
    "Disease:",
    disease_model_path,
    disease_model_path.exists()
)

print(
    "Pest:",
    pest_model_path,
    pest_model_path.exists()
)

print(
    "Tuta:",
    tuta_model_path,
    tuta_model_path.exists()
)

print("======================================\n")


# =========================================================
# LOAD MODELS
# =========================================================

print("Loading models...")

validator_model = tf.keras.models.load_model(
    validator_model_path
)

disease_model = tf.keras.models.load_model(
    disease_model_path
)

pest_model = tf.keras.models.load_model(
    pest_model_path
)

tuta_model = tf.keras.models.load_model(
    tuta_model_path
)

print("All models loaded successfully!\n")


# =========================================================
# INITIALIZE GEMINI
# =========================================================

gemini_client = None

if GEMINI_API_KEY:

    try:

        gemini_client = genai.Client(
            api_key=GEMINI_API_KEY
        )

        print("Gemini client initialized successfully.")

    except Exception as error:

        print(
            "Gemini initialization failed:",
            error
        )

else:

    print(
        "Gemini client disabled because API key is missing."
    )


# =========================================================
# CLASS NAMES
# =========================================================

DISEASE_CLASSES = [
    "bacterial_spot",
    "early_blight",
    "healthy",
    "late_blight",
    "leaf_mold",
    "septoria_leaf_spot",
    "spider_mites_two_spotted_spider_mite",
    "target_spot",
    "tomato_mosaic_virus",
    "tomato_yellow_leaf_curl_virus"
]


PEST_CLASSES = [
    "beet_armyworm",
    "fruit_borer",
    "green_peach_aphid",
    "melon_fruit_fly",
    "melon_thrips",
    "no_pest",
    "spider_mite",
    "tobacco_cutworm",
    "whitefly"
]


TUTA_CLASSES = [
    "healthy",
    "tuta_absoluta"
]


# =========================================================
# CONFIDENCE THRESHOLDS
# =========================================================

# Disease / Pest / Tuta
CONFIDENCE_THRESHOLD = 0.70

# Gemini
GEMINI_CONFIDENCE_THRESHOLD = 70

# Old V4 validator fallback
VALIDATOR_THRESHOLD = 0.50


# =========================================================
# IMAGE PREPROCESSING
# =========================================================

def preprocess_image(image_bytes):

    try:

        original_image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

    except Exception as error:

        print(
            "Image opening failed:",
            error
        )

        raise ValueError(
            "Invalid image file"
        )

    print(
        "Original image size:",
        original_image.size
    )

    print(
        "Image mode:",
        original_image.mode
    )

    # EfficientNet models use 224 x 224
    image_resized = original_image.resize(
        (224, 224)
    )

    # IMPORTANT:
    # Do NOT divide by 255.
    #
    # The saved EfficientNet models already contain
    # their own preprocessing / Rescaling layer.

    image_array = np.asarray(
        image_resized,
        dtype=np.float32
    )

    image_array = np.expand_dims(
        image_array,
        axis=0
    )

    print(
        "Model input shape:",
        image_array.shape
    )

    print(
        "Input min:",
        image_array.min()
    )

    print(
        "Input max:",
        image_array.max()
    )

    return image_array


# =========================================================
# OLD V4 VALIDATOR
# FALLBACK ONLY
# =========================================================

def validate_tomato_v4(image):

    try:

        prediction = validator_model.predict(
            image,
            verbose=0
        )[0][0]

        tomato_probability = float(
            prediction
        )

        print(
            "Validator V4 raw prediction:",
            tomato_probability
        )

        if tomato_probability >= VALIDATOR_THRESHOLD:

            return {

                "prediction": "tomato",

                "confidence": round(
                    tomato_probability * 100,
                    2
                ),

                "status": "VALID",

                "source": "V4_FALLBACK"

            }

        else:

            return {

                "prediction": "non_tomato",

                "confidence": round(
                    (1 - tomato_probability) * 100,
                    2
                ),

                "status": "WARNING",

                "source": "V4_FALLBACK"

            }

    except Exception as error:

        print(
            "V4 validator failed:",
            error
        )

        return {

            "prediction": "unknown",

            "confidence": 0,

            "status": "UNCERTAIN",

            "source": "V4_FALLBACK_ERROR",

            "message": str(error)

        }


# =========================================================
# GEMINI TOMATO VALIDATOR
# =========================================================

def validate_tomato_gemini(image_bytes):

    if gemini_client is None:

        print(
            "Gemini client unavailable."
        )

        return None

    prompt = """Look at this image and determine whether it is a tomato plant/leaf.

Return ONLY valid JSON:
{
  "label": "tomato" or "non_tomato",
  "confidence": 0-100,
  "reason": "short reason"
}"""

    try:
        image_format = Image.open(io.BytesIO(image_bytes)).format
        mime_type = Image.MIME.get(image_format)

        if not mime_type:
            raise ValueError("Could not determine image MIME type.")

        response = gemini_client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                )
            ]
        )

        raw_text = getattr(response, "text", "").strip()
        if not raw_text:
            raise ValueError("Gemini returned an empty response.")

        cleaned_text = re.sub(
            r"^```(?:json)?\s*|\s*```$",
            "",
            raw_text,
            flags=re.IGNORECASE
        ).strip()
        result = json.loads(cleaned_text)

        label = result.get("label")
        confidence = result.get("confidence")

        if label not in ["tomato", "non_tomato"]:
            raise ValueError("Gemini returned an invalid label.")

        if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
            raise ValueError("Gemini returned an invalid confidence.")

        confidence = float(confidence)
        if not 0 <= confidence <= 100:
            raise ValueError("Gemini confidence is outside the 0-100 range.")

        return {
            "prediction": label,
            "confidence": round(confidence, 2),
            "status": (
                "NON_TOMATO"
                if label == "non_tomato" and confidence >= GEMINI_CONFIDENCE_THRESHOLD
                else "VALID"
                if label == "tomato" and confidence >= GEMINI_CONFIDENCE_THRESHOLD
                else "UNCERTAIN"
            ),
            "source": "GEMINI",
            "reason": str(result.get("reason", "")),
            "validation_source": "gemini",
            "gemini_status": "available"
        }

    except Exception as error:
        print("Gemini validation failed; using local validator fallback:", error)
        return None


# =========================================================
# COMBINED TOMATO VALIDATION
# =========================================================

def validate_tomato(
    image_bytes,
    image
):

    # -----------------------------------------------------
    # FIRST: Gemini
    # -----------------------------------------------------

    gemini_result = validate_tomato_gemini(
        image_bytes
    )

    if gemini_result is not None:

        return gemini_result

    # -----------------------------------------------------
    # FALLBACK: V4
    # -----------------------------------------------------

    print(
        "Using V4 validator fallback..."
    )

    fallback_result = validate_tomato_v4(
        image
    )

    fallback_result["fallback_reason"] = (
        "Gemini validation unavailable"
    )
    fallback_result["validation_source"] = "local_fallback"
    fallback_result["gemini_status"] = "unavailable"

    if fallback_result.get("prediction") == "non_tomato":
        fallback_result["prediction"] = "uncertain"
        fallback_result["status"] = "UNCERTAIN"
        fallback_result["reason"] = (
            "Local fallback flagged non-tomato, but kept uncertain to avoid rejecting a real tomato image."
        )

    return fallback_result


# =========================================================
# SPECIALIST MODEL PREDICTION
# =========================================================

def get_prediction(
    model,
    classes,
    image,
    model_label
):

    raw_prediction = model.predict(
        image,
        verbose=0
    )

    prediction = raw_prediction[0]

    print(
        f"{model_label} output shape:",
        raw_prediction.shape
    )

    print(
        f"{model_label} raw prediction:",
        prediction
    )

    index = int(
        np.argmax(prediction)
    )

    confidence = float(
        prediction[index]
    )

    label = classes[index]

    if confidence >= CONFIDENCE_THRESHOLD:

        status = "DETECTED"

    else:

        status = "UNCERTAIN"

    return {

        "prediction": label,

        "confidence": round(
            confidence * 100,
            2
        ),

        "status": status

    }


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "message":
            "TomatoGuard AI Backend is running!",

        "status":
            "online",

        "models": {

            "tomato_validator":
                "Gemini 3.8 Flash",

            "validator_fallback":
                "Tomato Validator V4",

            "disease":
                "Tomato Disease EfficientNetB0",

            "pest":
                "Tomato Pest V2 EfficientNetB0",

            "tuta":
                "Tuta Absoluta EfficientNetB0"

        }

    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy",

        "gemini_available":
            gemini_client is not None,

        "models_loaded": {

            "validator_v4":
                validator_model is not None,

            "disease":
                disease_model is not None,

            "pest":
                pest_model is not None,

            "tuta":
                tuta_model is not None

        }

    }


# =========================================================
# PREDICTION API
# =========================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    print(
        "\n========================================"
    )

    print(
        "          NEW PREDICTION"
    )

    print(
        "========================================"
    )

    print(
        "Filename:",
        file.filename
    )

    print(
        "Content type:",
        file.content_type
    )

    disease_result = None
    pest_result = None
    tuta_result = None

    # -----------------------------------------------------
    # READ IMAGE
    # -----------------------------------------------------

    image_bytes = await file.read()

    print(
        "Uploaded bytes:",
        len(image_bytes)
    )

    if not image_bytes:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty"
        )

    # -----------------------------------------------------
    # PREPROCESS IMAGE FOR EFFICIENTNET
    # -----------------------------------------------------

    try:

        image = preprocess_image(
            image_bytes
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    # =====================================================
    # STEP 1 — GEMINI TOMATO VALIDATION
    # =====================================================

    tomato_validation = validate_tomato(
        image_bytes,
        image
    )

    print(
        "\nTomato validation:"
    )

    print(
        tomato_validation
    )

    # =====================================================
    # STEP 1.5 — NON-TOMATO DECISION
    # =====================================================

    strong_non_tomato = (

        tomato_validation.get("prediction") == "non_tomato"

        and

        tomato_validation.get("confidence", 0)
        >= GEMINI_CONFIDENCE_THRESHOLD

        and

        tomato_validation.get("status") == "NON_TOMATO"

        and

        tomato_validation.get("source") == "GEMINI"

    )

    print(
        "Strong non-tomato:",
        strong_non_tomato
    )

    # =====================================================
    # STEP 2 — DISEASE / PEST / TUTA
    # =====================================================

    specialist_tomato_evidence = False

    if not strong_non_tomato:

        disease_confident = (
            disease_result is not None
            and disease_result.get("status") == "DETECTED"
            and disease_result.get("prediction") not in [None, "healthy"]
            and disease_result.get("confidence", 0) >= 80
        )

        pest_confident = (
            pest_result is not None
            and pest_result.get("status") == "DETECTED"
            and pest_result.get("prediction") not in [None, "no_pest"]
            and pest_result.get("confidence", 0) >= 80
        )

        tuta_confident = (
            tuta_result is not None
            and tuta_result.get("status") == "DETECTED"
            and tuta_result.get("prediction") not in [None, "healthy"]
            and tuta_result.get("confidence", 0) >= 80
        )

        specialist_tomato_evidence = disease_confident or pest_confident or tuta_confident

    if strong_non_tomato:

        print(
            "\nHIGH-CONFIDENCE NON-TOMATO IMAGE."
        )

        print(
            "Skipping disease, pest and Tuta models."
        )

        disease_result = {

            "prediction":
                None,

            "confidence":
                0,

            "status":
                "NOT_ANALYZED",

            "message":
                "Image appears to be non-tomato."

        }

        pest_result = {

            "prediction":
                None,

            "confidence":
                0,

            "status":
                "NOT_ANALYZED",

            "message":
                "Image appears to be non-tomato."

        }

        tuta_result = {

            "prediction":
                None,

            "confidence":
                0,

            "status":
                "NOT_ANALYZED",

            "message":
                "Image appears to be non-tomato."

        }

    else:

        # =================================================
        # DISEASE
        # =================================================

        disease_result = get_prediction(

            disease_model,

            DISEASE_CLASSES,

            image,

            "Disease"

        )

        # =================================================
        # PEST
        # =================================================

        pest_result = get_prediction(

            pest_model,

            PEST_CLASSES,

            image,

            "Pest"

        )

        # =================================================
        # TUTA
        # =================================================

        tuta_result = get_prediction(

            tuta_model,

            TUTA_CLASSES,

            image,

            "Tuta"

        )

    if (
        tomato_validation.get("prediction") == "non_tomato"
        and specialist_tomato_evidence
    ):
        tomato_validation["prediction"] = "uncertain"
        tomato_validation["status"] = "UNCERTAIN"
        tomato_validation["reason"] = (
            "Local validator suggested non-tomato, but specialist tomato model evidence is strong."
        )
        tomato_validation["validation_source"] = "local_fallback"
        tomato_validation["gemini_status"] = "unavailable"

    # =====================================================
    # STEP 3 — MANAGEMENT RECOMMENDATIONS
    # =====================================================

    recommendations = []

    if not strong_non_tomato:

        # -------------------------------------------------
        # DISEASE RECOMMENDATION
        # -------------------------------------------------

        if (

            disease_result is not None
            and disease_result.get("status") == "DETECTED"
            and disease_result.get("prediction") != "healthy"

        ):

            recommendations.append({

                "type":
                    "Disease",

                "prediction":
                    disease_result["prediction"],

                "recommendation":
                    get_recommendation(
                        disease_result["prediction"]
                    )

            })

        # -------------------------------------------------
        # PEST RECOMMENDATION
        # -------------------------------------------------

        if (

            pest_result is not None
            and pest_result.get("status") == "DETECTED"
            and pest_result.get("prediction") != "no_pest"

        ):

            recommendations.append({

                "type":
                    "Pest",

                "prediction":
                    pest_result["prediction"],

                "recommendation":
                    get_recommendation(
                        pest_result["prediction"]
                    )

            })

        # -------------------------------------------------
        # TUTA RECOMMENDATION
        # -------------------------------------------------

        if (

            tuta_result is not None
            and tuta_result.get("status") == "DETECTED"
            and tuta_result.get("prediction") != "healthy"

        ):

            recommendations.append({

                "type":
                    "Tuta",

                "prediction":
                    tuta_result["prediction"],

                "recommendation":
                    get_recommendation(
                        tuta_result["prediction"]
                    )

            })

    # =====================================================
    # STEP 4 — OVERALL STATUS
    # =====================================================

    detected_conditions = []

    if not strong_non_tomato:

        # -------------------------------------------------
        # DISEASE
        # -------------------------------------------------

        if (

            disease_result is not None
            and disease_result.get("status") == "DETECTED"
            and disease_result.get("prediction") is not None
            and disease_result.get("prediction") != "healthy"

        ):

            detected_conditions.append(
                disease_result["prediction"]
            )

        # -------------------------------------------------
        # PEST
        # -------------------------------------------------

        if (

            pest_result is not None
            and pest_result.get("status") == "DETECTED"
            and pest_result.get("prediction") is not None
            and pest_result.get("prediction") != "no_pest"

        ):

            detected_conditions.append(
                pest_result["prediction"]
            )

        # -------------------------------------------------
        # TUTA
        # -------------------------------------------------

        if (

            tuta_result is not None
            and tuta_result.get("status") == "DETECTED"
            and tuta_result.get("prediction") is not None
            and tuta_result.get("prediction") != "healthy"

        ):

            detected_conditions.append(
                tuta_result["prediction"]
            )

    # =====================================================
    # FINAL OVERALL STATUS
    # =====================================================

    if strong_non_tomato:

        overall_status = "NON_TOMATO_IMAGE"

    elif detected_conditions:

        overall_status = "ISSUE_DETECTED"

    elif tomato_validation["status"] == "UNCERTAIN":

        overall_status = "VALIDATION_UNCERTAIN"

    else:

        overall_status = "NO_HIGH_CONFIDENCE_ISSUE"

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    response = {

        "filename":
            file.filename,

        "overall_status":
            overall_status,

        "tomato_validation":
            tomato_validation,

        "validation_source":
            tomato_validation.get("validation_source", "unknown"),

        "gemini_status":
            tomato_validation.get("gemini_status", "unknown"),

        "disease":
            disease_result,

        "pest":
            pest_result,

        "tuta":
            tuta_result,

        "recommendations":
            recommendations

    }

    print(
        "\nFinal response:"
    )

    print(
        response
    )

    print(
        "========================================\n"
    )

    return response