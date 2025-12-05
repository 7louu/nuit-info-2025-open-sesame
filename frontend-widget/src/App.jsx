import { useState, useRef, useCallback } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

// Microphone Icon SVG
const MicIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
);

// Stop Icon SVG
const StopIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

// Check Icon SVG
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
);

// Audio Visualizer Component
function AudioVisualizer({ isActive, audioData }) {
    const bars = 20;

    return (
        <div className="audio-visualizer">
            {Array.from({ length: bars }).map((_, i) => {
                const height = isActive
                    ? Math.random() * 40 + 10
                    : 10;
                return (
                    <div
                        key={i}
                        className={`visualizer-bar ${isActive ? 'active' : ''}`}
                        style={{
                            height: `${height}px`,
                            animationDelay: `${i * 0.05}s`
                        }}
                    />
                );
            })}
        </div>
    );
}

// Magic Door Component
function MagicDoor({ isOpen, isListening, status }) {
    return (
        <div className="door-container">
            <div className={`door-frame ${isListening ? 'listening' : ''} ${status}`}>
                <div className={`door ${isOpen ? 'open' : ''}`}>
                    <div className="door-panels">
                        <div className="door-panel" />
                        <div className="door-panel" />
                    </div>
                    <div className="door-handle" />
                    <div className="door-keyhole" />
                </div>
                <div className="door-light" />
            </div>
        </div>
    );
}

// Sample Progress Dots
function SampleProgress({ current, total }) {
    return (
        <div className="sample-counter">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`sample-dot ${i < current ? 'filled' : ''} ${i === current ? 'current' : ''}`}
                />
            ))}
        </div>
    );
}

// Confidence Meter
function ConfidenceMeter({ score }) {
    const percentage = Math.round(score * 100);
    const level = score >= 0.7 ? 'high' : score >= 0.5 ? 'medium' : 'low';

    return (
        <div>
            <div className="confidence-meter">
                <div
                    className={`confidence-fill ${level}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <p className="text-center text-muted mt-sm">
                Confidence: {percentage}%
            </p>
        </div>
    );
}

// Star Background
function StarBackground() {
    const stars = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 2 + 1
    }));

    return (
        <div className="stars">
            {stars.map(star => (
                <div
                    key={star.id}
                    className="star"
                    style={{
                        left: `${star.left}%`,
                        top: `${star.top}%`,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        animationDelay: `${star.delay}s`
                    }}
                />
            ))}
        </div>
    );
}

function App() {
    // Mode: 'register' or 'authenticate'
    const [mode, setMode] = useState('authenticate');

    // Form state
    const [email, setEmail] = useState('');
    const [passphrase, setPassphrase] = useState('');

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [audioSamples, setAudioSamples] = useState([]);
    const [currentSample, setCurrentSample] = useState(0);

    // UI state
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isDoorOpen, setIsDoorOpen] = useState(false);
    const [confidenceScore, setConfidenceScore] = useState(null);
    const [authResult, setAuthResult] = useState(null);

    // Refs
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    const REQUIRED_SAMPLES = 3;
    const RECORDING_DURATION = 3000; // 3 seconds

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                if (mode === 'register') {
                    // Add to samples array
                    const newSamples = [...audioSamples, audioBlob];
                    setAudioSamples(newSamples);
                    setCurrentSample(newSamples.length);

                    if (newSamples.length >= REQUIRED_SAMPLES) {
                        // All samples collected, submit registration
                        await submitRegistration(newSamples);
                    } else {
                        setStatus({
                            type: 'info',
                            message: `Sample ${newSamples.length}/${REQUIRED_SAMPLES} recorded. ${REQUIRED_SAMPLES - newSamples.length} more needed.`
                        });
                    }
                } else {
                    // Single sample for authentication
                    await submitAuthentication(audioBlob);
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setStatus({ type: 'info', message: `Recording... Speak now!` });

            // Auto-stop after duration
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    stopRecording();
                }
            }, RECORDING_DURATION);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            setStatus({ type: 'error', message: 'Could not access microphone. Please grant permission.' });
        }
    }, [mode, audioSamples]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    // Convert webm to wav using AudioContext
    const convertToWav = async (webmBlob) => {
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio data
        const numberOfChannels = 1;
        const length = audioBuffer.length;
        const sampleRate = 16000;
        const wavBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(wavBuffer);

        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Write audio data
        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        await audioContext.close();
        return new Blob([wavBuffer], { type: 'audio/wav' });
    };

    // Submit registration
    const submitRegistration = async (samples) => {
        if (!email || !passphrase) {
            setStatus({ type: 'error', message: 'Please enter email and passphrase.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: 'info', message: 'Processing registration...' });

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('passphrase', passphrase);

            // Convert and append all audio samples
            for (let i = 0; i < samples.length; i++) {
                const wavBlob = await convertToWav(samples[i]);
                formData.append('audio_files', wavBlob, `sample_${i}.wav`);
            }

            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setStatus({ type: 'success', message: 'Registration successful! You can now authenticate.' });
                setIsDoorOpen(true);
                setTimeout(() => {
                    setIsDoorOpen(false);
                    setMode('authenticate');
                    resetState();
                }, 3000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Registration failed.' });
            }
        } catch (error) {
            console.error('Registration error:', error);
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Submit authentication
    const submitAuthentication = async (audioBlob) => {
        if (!email) {
            setStatus({ type: 'error', message: 'Please enter your email.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: 'info', message: 'Verifying your voice...' });

        try {
            const formData = new FormData();
            formData.append('email', email);

            const wavBlob = await convertToWav(audioBlob);
            formData.append('audio_files', wavBlob, 'auth_sample.wav');

            const response = await fetch(`${API_BASE}/authenticate`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            setAuthResult(data);
            setConfidenceScore(data.confidence_score || 0);

            if (data.success) {
                setStatus({ type: 'success', message: '✨ Access Granted! Welcome back.' });
                setIsDoorOpen(true);
            } else {
                let message = 'Access Denied. ';
                if (!data.speaker_verified) message += 'Voice not recognized. ';
                if (!data.keyword_verified) message += 'Passphrase incorrect.';
                setStatus({ type: 'error', message });
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset state
    const resetState = () => {
        setAudioSamples([]);
        setCurrentSample(0);
        setStatus({ type: '', message: '' });
        setConfidenceScore(null);
        setAuthResult(null);
        setIsDoorOpen(false);
    };

    // Handle mode change
    const handleModeChange = (newMode) => {
        setMode(newMode);
        resetState();
    };

    return (
        <div className="app-container">
            <StarBackground />

            <main className="main-content">
                <h1 className="title">Open Sesame</h1>
                <p className="subtitle">Voice-powered authentication</p>

                {/* Mode Toggle */}
                <div className="mode-toggle">
                    <button
                        className={`mode-toggle-btn ${mode === 'authenticate' ? 'active' : ''}`}
                        onClick={() => handleModeChange('authenticate')}
                    >
                        Authenticate
                    </button>
                    <button
                        className={`mode-toggle-btn ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => handleModeChange('register')}
                    >
                        Register
                    </button>
                </div>

                <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
                    {/* Email Input */}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Passphrase Input (Registration only) */}
                    {mode === 'register' && (
                        <div className="form-group">
                            <label className="form-label">Passphrase</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder='e.g., "Open Sesame"'
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Magic Door */}
                    <MagicDoor
                        isOpen={isDoorOpen}
                        isListening={isRecording}
                        status={authResult?.success ? 'success' : authResult ? 'error' : ''}
                    />

                    {/* Audio Visualizer */}
                    <AudioVisualizer isActive={isRecording} />

                    {/* Sample Progress (Registration only) */}
                    {mode === 'register' && (
                        <SampleProgress current={currentSample} total={REQUIRED_SAMPLES} />
                    )}

                    {/* Record Button */}
                    <button
                        className={`record-button ${isRecording ? 'recording' : ''} ${isDoorOpen ? 'success' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="spinner" />
                        ) : isRecording ? (
                            <StopIcon />
                        ) : isDoorOpen ? (
                            <CheckIcon />
                        ) : (
                            <MicIcon />
                        )}
                    </button>

                    {/* Instructions */}
                    <p className="text-center text-muted">
                        {mode === 'register'
                            ? `Record ${REQUIRED_SAMPLES} voice samples saying your passphrase`
                            : 'Press to speak your passphrase'
                        }
                    </p>

                    {/* Status Message */}
                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    {/* Confidence Meter (Authentication only) */}
                    {mode === 'authenticate' && confidenceScore !== null && (
                        <ConfidenceMeter score={confidenceScore} />
                    )}

                    {/* Auth Result Details */}
                    {authResult && (
                        <div className="mt-lg text-center">
                            <p className="text-muted">
                                Speaker: {authResult.speaker_verified ? '✅' : '❌'} |
                                Keyword: {authResult.keyword_verified ? '✅' : '❌'}
                            </p>
                        </div>
                    )}

                    {/* Reset Button */}
                    {(audioSamples.length > 0 || authResult) && (
                        <button className="btn btn-secondary mt-lg" onClick={resetState} style={{ width: '100%' }}>
                            Start Over
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
