import librosa
import soundfile as sf
from pathlib import Path
import uuid

# Get the backend directory
BACKEND_DIR = Path(
    "C:/Users/7louu/OneDrive/Bureau/nuit_info_2025/nuit-info-2025-open-sesame/backend"
)
TEMP_DIR = BACKEND_DIR / "temp"


def preprocess_audio(input_path: str) -> str:
    # Load audio
    audio, _ = librosa.load(input_path, sr=16000, mono=True)

    # Ensure temp directory exists
    TEMP_DIR.mkdir(exist_ok=True)

    # Create output path in local temp
    filename = f"{uuid.uuid4()}.wav"
    output_path = TEMP_DIR / filename

    # Write processed audio
    sf.write(str(output_path), audio, samplerate=16000)

    # Return path with forward slashes for cross-platform compatibility
    return output_path.resolve().as_posix()
