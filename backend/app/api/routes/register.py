from fastapi import APIRouter, Form, File, UploadFile
from typing import List
from app.models.user import RegistrationResponse
from app.services.preprocessing import preprocess_audio
from app.services.speaker_verification import extract_embedding, store_user_embeddings
from pathlib import Path
import uuid
import shutil
import os
from loguru import logger

# Get the backend directory
BACKEND_DIR = Path(
    "C:/Users/7louu/OneDrive/Bureau/nuit_info_2025/nuit-info-2025-open-sesame/backend"
)
TEMP_DIR = BACKEND_DIR / "temp"

router = APIRouter()


@router.post("/register", response_model=RegistrationResponse)
def register(
    email: str = Form(...),
    passphrase: str = Form(...),
    audio_files: List[UploadFile] = File(...),
):
    try:
        user_id = str(uuid.uuid4())
        embeddings = []

        # Ensure temp directory exists
        TEMP_DIR.mkdir(exist_ok=True)

        for audio_file in audio_files:
            # Generate unique filename and save to local temp
            filename = f"{uuid.uuid4()}.wav"
            audio_path = TEMP_DIR / filename

            # Write the file content
            with open(audio_path, "wb") as buffer:
                shutil.copyfileobj(audio_file.file, buffer)

            logger.info(f"Processing audio file: {audio_path}")

            try:
                # Use as_posix() to get path with forward slashes
                processed_path = preprocess_audio(audio_path.resolve().as_posix())
                embedding = extract_embedding(processed_path)
                embeddings.append(embedding)

                # Cleanup processed file
                Path(processed_path).unlink(missing_ok=True)
            finally:
                # Cleanup original temp file
                audio_path.unlink(missing_ok=True)

        store_user_embeddings(user_id, email, passphrase, embeddings)

        return RegistrationResponse(
            success=True, message="User registered successfully", user_id=user_id
        )

    except Exception as e:
        logger.error(f"Error registering user: {e}")
        return RegistrationResponse(
            success=False,
            message=str(e),
            user_id=user_id if "user_id" in locals() else "",
        )
