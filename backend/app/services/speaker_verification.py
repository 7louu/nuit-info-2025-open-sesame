import json
import os
from typing import Dict, List, Optional, Tuple

import numpy as np
from speechbrain.inference.speaker import EncoderClassifier

# Global model instance (lazy loaded)
_speaker_model = None

# Storage path for user data
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "users.json")


def get_speaker_model():
    global _speaker_model

    if _speaker_model is None:
        _speaker_model = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
        )

    return _speaker_model


def extract_embedding(audio_path: str) -> List[float]:
    """
    Extract speaker embedding from audio file.
    Returns a list of floats representing the voice "fingerprint".
    """
    model = get_speaker_model()

    embedding = model.encode_batch(model.load_audio(audio_path).unsqueeze(0))

    return embedding.squeeze().cpu().numpy().tolist()


def cosine_similarity(emb1: List[float], emb2: List[float]) -> float:
    """Calculate cosine similarity between two embeddings"""
    a = np.array(emb1)
    b = np.array(emb2)

    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(dot_product / (norm_a * norm_b))


def verify_speaker(
    input_embedding: List[float],
    stored_embeddings: List[List[float]],
    threshold: float = 0.70,
) -> Tuple[bool, float]:
    """
    Verify if speaker matches stored embeddings.
    Returns (is_match, average_score)
    """
    if not stored_embeddings:
        return False, 0.0

    similarities = [
        cosine_similarity(input_embedding, stored) for stored in stored_embeddings
    ]

    avg_score = float(np.mean(similarities))

    return avg_score >= threshold, avg_score


def store_user_embeddings(
    user_id: str,
    email: str,
    passphrase: str,
    embeddings: List[List[float]],
) -> None:
    """Store user data and embeddings in JSON file"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    users = {}
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "r") as f:
            users = json.load(f)

    users[email] = {
        "user_id": user_id,
        "email": email,
        "passphrase": passphrase,
        "embeddings": embeddings,
    }

    with open(DB_PATH, "w") as f:
        json.dump(users, f, indent=2)


def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user data by email"""
    if not os.path.exists(DB_PATH):
        return None

    with open(DB_PATH, "r") as f:
        users = json.load(f)

    return users.get(email)
