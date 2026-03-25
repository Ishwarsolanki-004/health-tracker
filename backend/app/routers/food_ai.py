# routers/food_ai.py — Real AI food recognition using Claude Vision API

import base64, json, re, httpx
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/food-ai", tags=["Food AI"])

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL   = "claude-opus-4-5"

SYSTEM_PROMPT = """You are a professional nutritionist and food recognition AI.
When given a food image, you MUST:
1. Identify the exact dish name (be specific — not just "rice" but "Chicken Biryani" or "Dal Tadka")
2. List all visible food components
3. Estimate calories and macros (protein, carbs, fat) accurately
4. Return ONLY valid JSON — no extra text, no markdown, no explanation

Return this exact JSON structure:
{
  "detected": "Exact dish name here",
  "confidence": 88,
  "calories": 450,
  "protein": 18,
  "carbs": 62,
  "fat": 14,
  "items": [
    "Item 1 — 200 kcal",
    "Item 2 — 150 kcal",
    "Item 3 — 100 kcal"
  ],
  "cuisine": "Indian/Italian/Chinese/etc",
  "meal_type": "Breakfast/Lunch/Dinner/Snack"
}"""

class FoodAnalysisResult(BaseModel):
    detected:   str
    confidence: int
    calories:   int
    protein:    float
    carbs:      float
    fat:        float
    items:      List[str]
    cuisine:    str = "Unknown"
    meal_type:  str = "Meal"
    ai_powered: bool = True


@router.post("/analyze", response_model=FoodAnalysisResult)
async def analyze_food(file: UploadFile = File(...)):
    """
    Real AI food recognition using Claude Vision.
    Upload any food image and get accurate nutrition info.
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files allowed")

    # Read image and convert to base64
    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(400, "Image too large. Max 10MB.")

    b64_image  = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = file.content_type  # e.g. "image/jpeg"

    # Call Claude API
    headers = {
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
    }

    payload = {
        "model":      CLAUDE_MODEL,
        "max_tokens": 600,
        "system":     SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type":       "base64",
                            "media_type": media_type,
                            "data":       b64_image,
                        }
                    },
                    {
                        "type": "text",
                        "text": "Analyze this food image and return the JSON nutrition data. Be specific about the dish name."
                    }
                ]
            }
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(CLAUDE_API_URL, headers=headers, json=payload)
        except httpx.TimeoutException:
            raise HTTPException(504, "AI service timeout. Try again.")
        except Exception as e:
            raise HTTPException(502, f"AI service error: {str(e)}")

    if resp.status_code != 200:
        detail = resp.json().get("error", {}).get("message", "Unknown error")
        raise HTTPException(resp.status_code, f"Claude API error: {detail}")

    # Extract JSON from response
    raw_text = resp.json()["content"][0]["text"].strip()

    # Remove markdown code blocks if present
    raw_text = re.sub(r"```json\s*", "", raw_text)
    raw_text = re.sub(r"```\s*",     "", raw_text)
    raw_text = raw_text.strip()

    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        # Try to extract JSON from text
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise HTTPException(500, "AI returned invalid response format")

    return FoodAnalysisResult(
        detected   = data.get("detected",   "Unknown Food"),
        confidence = int(data.get("confidence", 80)),
        calories   = int(data.get("calories",   0)),
        protein    = float(data.get("protein",  0)),
        carbs      = float(data.get("carbs",    0)),
        fat        = float(data.get("fat",      0)),
        items      = data.get("items",          []),
        cuisine    = data.get("cuisine",        "Unknown"),
        meal_type  = data.get("meal_type",      "Meal"),
        ai_powered = True,
    )
