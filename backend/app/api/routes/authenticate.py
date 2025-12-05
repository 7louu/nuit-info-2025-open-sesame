from fastapi import APIRouter, Form, File, UploadFile, HTTPException
from app.models.user import AuthenticationResponse
from app.services.preprocessing import preprocess_audio
from app.services.speaker_verification import (
    extract_embedding,
    verify_speaker,
    get_user_by_email,
)
from app.services.keyword_detection import detect_keyword, keyword_matches
from pathlib import Path
import shutil
import uuid

# Get the backend directory (parent of app directory)
BACKEND_DIR = Path(
    "C:/Users/7louu/OneDrive/Bureau/nuit_info_2025/nuit-info-2025-open-sesame/backend"
)
TEMP_DIR = BACKEND_DIR / "temp"

router = APIRouter()


@router.post("/authenticate", response_model=AuthenticationResponse)
def authenticate(email: str = Form(...), audio_files: UploadFile = File(...)):
    # 1. Get user
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Ensure temp directory exists
    TEMP_DIR.mkdir(exist_ok=True)

    # 3. Save audio to local temp
    filename = f"{uuid.uuid4()}.wav"
    audio_path = TEMP_DIR / filename

    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio_files.file, buffer)

    try:
        # Use as_posix() to get path with forward slashes
        processed_path = preprocess_audio(audio_path.resolve().as_posix())

        # 4. Speaker Verification
        input_embedding = extract_embedding(processed_path)
        is_speaker_ok, speaker_score = verify_speaker(
            input_embedding, user["embeddings"], threshold=0.69
        )

        # 5. Keyword Detection
        detected_text = detect_keyword(processed_path)
        is_keyword_ok = keyword_matches(detected_text, user["passphrase"])

        # Cleanup processed file
        Path(processed_path).unlink(missing_ok=True)

    finally:
        # Cleanup original temp file
        audio_path.unlink(missing_ok=True)

    # 6. Return result
    success = is_speaker_ok and is_keyword_ok
    message = "Authentication successful" if success else "Authentication failed"

    return AuthenticationResponse(
        success=success,
        message=message,
        speaker_verified=is_speaker_ok,
        keyword_verified=is_keyword_ok,
        confidence_score=speaker_score,
    )
