import speech_recognition as sr


def detect_keyword(audio_path: str) -> str:
    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(audio_path) as source:
            audio_data = recognizer.record(source)

            text = recognizer.recognize_google(audio_data, language="en-US")
            return text

    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        print(f"Could not request results from Google Web Speech API; {e}")
        return ""
    except Exception as e:
        print(f"Error in keyword detection: {e}")
        return ""


def keyword_matches(detected: str, expected: str) -> bool:
    if not detected or not expected:
        return False

    return expected.lower().strip() in detected.lower().strip()
