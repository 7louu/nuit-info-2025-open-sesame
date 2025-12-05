import requests
import pyaudio
import wave
import time
import os
import json

BASE_URL = "http://localhost:8000/api"
EMAIL = "test_user@example.com"
PASSPHRASE = "Open Sesame"


def record_audio(filename, duration=3):
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000

    p = pyaudio.PyAudio()

    print(f"🎤 Recording {filename} for {duration} seconds... SPEAK NOW!")

    stream = p.open(
        format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK
    )

    frames = []

    for i in range(0, int(RATE / CHUNK * duration)):
        data = stream.read(CHUNK)
        frames.append(data)

    print("Recording finished.")

    stream.stop_stream()
    stream.close()
    p.terminate()

    wf = wave.open(filename, "wb")
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b"".join(frames))
    wf.close()


def test_registration():
    print("\n--- TESTING REGISTRATION ---")
    print("We need 3 audio samples of you saying the passphrase.")

    files = []
    file_paths = []

    for i in range(3):
        filename = f"reg_sample_{i}.wav"
        input(f"Press Enter to record sample {i+1}/3...")
        record_audio(filename)
        file_paths.append(filename)
        files.append(("audio_files", (filename, open(filename, "rb"), "audio/wav")))

    data = {"email": EMAIL, "passphrase": PASSPHRASE}

    print("Sending registration request...")
    try:
        response = requests.post(f"{BASE_URL}/register", data=data, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Close files and cleanup
        for _, (name, f, _) in files:
            f.close()
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)


def test_authentication():
    print("\n--- TESTING AUTHENTICATION ---")
    filename = "auth_sample.wav"
    input("Press Enter to record authentication sample...")
    record_audio(filename)

    files = {"audio_files": (filename, open(filename, "rb"), "audio/wav")}

    data = {"email": EMAIL}

    print("Sending authentication request...")
    try:
        response = requests.post(f"{BASE_URL}/authenticate", data=data, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        files["audio_files"][1].close()
        if os.path.exists(filename):
            os.remove(filename)


if __name__ == "__main__":
    print("🚀 Starting Live Integration Test")
    print(f"Target: {BASE_URL}")

    test_registration()
    test_authentication()
