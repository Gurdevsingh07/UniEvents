import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import {
    Box, Typography, CircularProgress, Alert, Paper, Button, Chip, Fade, Grow, LinearProgress
} from '@mui/material';
import {
    Face, VideoCameraFront, ArrowBack, CheckCircle, ErrorOutline,
    KeyboardArrowUp, KeyboardArrowDown, KeyboardArrowLeft, KeyboardArrowRight,
    CenterFocusStrong, LightMode, RemoveRedEye, Visibility
} from '@mui/icons-material';

const ALL_POSES = [
    { key: 'CENTER', label: 'Center', instruction: 'Look straight at the camera', icon: CenterFocusStrong },
    { key: 'LEFT', label: 'Left', instruction: 'Turn head left', icon: KeyboardArrowLeft },
    { key: 'RIGHT', label: 'Right', instruction: 'Turn head right', icon: KeyboardArrowRight },
    { key: 'RIGHT2', label: 'Right', instruction: 'Turn head right', icon: KeyboardArrowRight },
    { key: 'DOWN', label: 'Down', instruction: 'Tilt head down', icon: KeyboardArrowDown },
];

// Generates a random sequence: CENTER -> 2 random unique directions -> CENTER (final capture)
const generateRandomChallenge = () => {
    const directions = ALL_POSES.filter(p => p.key !== 'CENTER');
    // Shuffle directions array
    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }
    return [ALL_POSES[0], directions[0], directions[1], ALL_POSES[0]];
};

// SVG progress ring outside the video circle
const ProgressRing = ({ activeStep, poseProgress, totalSteps, stepCompleted }) => {
    const size = 310;
    const strokeWidth = 5;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const segmentGap = 8;
    const segmentLength = (circumference - segmentGap * totalSteps) / totalSteps;

    return (
        <svg
            width={size} height={size}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, pointerEvents: 'none' }}
        >
            {Array.from({ length: totalSteps }).map((_, i) => {
                const offset = i * (segmentLength + segmentGap) + segmentGap / 2;
                const isCompleted = stepCompleted[i];
                const isActive = i === activeStep;
                const fillLength = isCompleted ? segmentLength : isActive ? (segmentLength * poseProgress / 100) : 0;

                return (
                    <g key={i}>
                        <circle
                            cx={size / 2} cy={size / 2} r={radius}
                            fill="none" stroke="#E0E0E0"
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                        {fillLength > 0 && (
                            <circle
                                cx={size / 2} cy={size / 2} r={radius}
                                fill="none"
                                stroke={isCompleted ? '#4CAF50' : '#C62828'}
                                strokeWidth={strokeWidth + 1}
                                strokeDasharray={`${fillLength} ${circumference - fillLength}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                                style={{
                                    transform: 'rotate(-90deg)', transformOrigin: 'center',
                                    transition: isCompleted ? 'none' : 'stroke-dasharray 0.3s ease',
                                }}
                            />
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

// Direction arrow outside the circle
const DirectionIndicator = ({ pose, isActive, progress }) => {
    if (!isActive || pose === 'CENTER') return null;

    const positions = {
        RIGHT2: { right: -28, top: '50%', transform: 'translateY(-50%)' },
        DOWN: { bottom: -28, left: '50%', transform: 'translateX(-50%)' },
        LEFT: { left: -28, top: '50%', transform: 'translateY(-50%)' },
        RIGHT: { right: -28, top: '50%', transform: 'translateY(-50%)' },
    };

    const IconComponent = ALL_POSES.find(p => p.key === pose)?.icon || CenterFocusStrong;
    const done = progress > 75;

    return (
        <Grow in={isActive} timeout={300}>
            <Box sx={{
                position: 'absolute', ...positions[pose], zIndex: 15,
                width: 40, height: 40, borderRadius: '50%',
                bgcolor: done ? '#4CAF50' : '#C62828', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 2,
                transition: 'background-color 0.3s ease',
            }}>
                <IconComponent sx={{ fontSize: 24 }} />
            </Box>
        </Grow>
    );
};

const FaceScanner = ({ onComplete, onReset }) => {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [activeStep, setActiveStep] = useState(-1);
    const activeStepRef = useRef(-1);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [poseProgress, setPoseProgress] = useState(0);
    const [stream, setStream] = useState(null);
    const embeddingRef = useRef(null);
    const [poses, setPoses] = useState(generateRandomChallenge());
    const [stepCompleted, setStepCompleted] = useState(poses.map(() => false));
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceSize, setFaceSize] = useState(0);
    const [stepJustCompleted, setStepJustCompleted] = useState(false);
    const noFaceTimer = useRef(null);
    const [noFaceHint, setNoFaceHint] = useState(false);
    const playPromiseRef = useRef(null);
    const processingRef = useRef(false); // Guard against multiple completions per step

    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) {
                console.error("Error loading models", err);
                setError("We could not load the necessary components for face verification. Please check your connection and try again.");
            }
        };
        loadModels();
    }, []);

    const startCamera = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("We need a secure connection (HTTPS or localhost) to access your camera.");
            return;
        }
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });
            setStream(s);
            setScanning(true);
            const newChallenge = generateRandomChallenge();
            setPoses(newChallenge);
            setActiveStep(0);
            activeStepRef.current = 0;
            setStepCompleted(newChallenge.map(() => false));
        } catch (err) {
            console.error("Camera error:", err);
            const msg = err.name === 'NotReadableError'
                ? "Camera is in use by another tab or application. Please close other tabs using the camera, then try again."
                : err.name === 'NotAllowedError'
                    ? "Camera permission was denied. Please allow camera access in your browser settings."
                    : "We could not access your camera. Please check your browser permissions and try again.";
            setError(msg);
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setScanning(false);
    }, [stream]);

    // Release camera on unmount (navigation away, registration complete, etc.)
    const streamRef = useRef(null);
    streamRef.current = stream;
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Attach stream to video element — wait for loadedmetadata before playing
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl || activeStep < 0 || !stream) return;

        videoEl.srcObject = stream;

        const handleLoaded = () => {
            // Cancel any outstanding play promise before starting a new one
            const p = videoEl.play();
            if (p !== undefined) {
                playPromiseRef.current = p;
                p.catch(e => {
                    // Only log if it's not the expected AbortError from a new load
                    if (e.name !== 'AbortError') {
                        console.error("Error playing video:", e);
                    }
                });
            }
        };

        videoEl.addEventListener('loadedmetadata', handleLoaded);
        return () => {
            videoEl.removeEventListener('loadedmetadata', handleLoaded);
        };
    }, [activeStep, stream]);

    // No-face timeout hint
    useEffect(() => {
        if (scanning && !faceDetected) {
            noFaceTimer.current = setTimeout(() => setNoFaceHint(true), 5000);
        } else {
            setNoFaceHint(false);
            if (noFaceTimer.current) clearTimeout(noFaceTimer.current);
        }
        return () => { if (noFaceTimer.current) clearTimeout(noFaceTimer.current); };
    }, [scanning, faceDetected]);

    useEffect(() => {
        let interval;
        if (scanning && modelsLoaded && activeStep >= 0 && activeStep < poses.length) {
            interval = setInterval(async () => {
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                if (!videoEl || !canvasEl) return;

                const detections = await faceapi.detectSingleFace(
                    videoEl,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks().withFaceDescriptor();

                if (detections && videoRef.current && canvasRef.current) {
                    setFaceDetected(true);
                    const box = detections.detection.box;
                    const relativeSize = (box.width * box.height) / (videoEl.videoWidth * videoEl.videoHeight);
                    setFaceSize(relativeSize);

                    const currentPose = poses[activeStep];
                    const isCorrectPose = checkPose(detections, currentPose.key);

                    if (isCorrectPose) {
                        setPoseProgress(prev => {
                            if (processingRef.current) return prev; // Skip if step is being processed
                            const next = prev + 15;
                            if (next >= 100) {
                                processingRef.current = true; // Lock immediately
                                setTimeout(() => handleStepCompletion(detections), 0);
                                return 100;
                            }
                            return next;
                        });
                    } else {
                        setPoseProgress(prev => Math.max(0, prev - 8));
                    }

                    const videoWidth = videoEl.videoWidth || 640;
                    const videoHeight = videoEl.videoHeight || 480;
                    const displaySize = { width: videoWidth, height: videoHeight };
                    faceapi.matchDimensions(canvasEl, displaySize);
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    const context = canvasEl.getContext('2d');
                    context.clearRect(0, 0, videoWidth, videoHeight);
                    faceapi.draw.drawFaceLandmarks(canvasEl, resizedDetections);
                } else {
                    setFaceDetected(false);
                    setFaceSize(0);
                    setPoseProgress(prev => Math.max(0, prev - 12));
                }
            }, 200);
        }
        return () => clearInterval(interval);
    }, [scanning, modelsLoaded, activeStep]);

    const checkPose = (detections, poseKey) => {
        const landmarks = detections.landmarks;
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Basic lighting check (Brightness of face box)
        const box = detections.detection.box;
        const canvas = document.createElement('canvas');
        canvas.width = box.width;
        canvas.height = box.height;
        const ctx = canvas.getContext('2d');
        if (videoRef.current) {
            ctx.drawImage(videoRef.current, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
            const imageData = ctx.getImageData(0, 0, box.width, box.height);
            const data = imageData.data;
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            brightness = brightness / (data.length / 4);
            if (brightness < 40) return false; // Too dark
            if (brightness > 230) return false; // Too bright
        }

        const noseTip = nose[3];
        const leftEyeCenter = leftEye[3];
        const rightEyeCenter = rightEye[0];

        const verticalCenter = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        const horizontalCenter = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const noseOffset = noseTip.x - horizontalCenter;
        const eyeDist = rightEyeCenter.x - leftEyeCenter.x;

        switch (poseKey) {
            case 'CENTER':
                return Math.abs(noseOffset) < eyeDist * 0.35;
            case 'LEFT':
                return noseOffset > eyeDist * 0.25;
            case 'RIGHT':
            case 'RIGHT2':
                return noseOffset < -eyeDist * 0.25;
            case 'DOWN':
                return noseTip.y > verticalCenter + (eyeDist * 0.15);
            default:
                return true;
        }
    };

    const handleStepCompletion = (detections) => {
        const currentStep = activeStepRef.current;

        if (currentStep < 0 || currentStep >= poses.length) {
            processingRef.current = false;
            return;
        }

        // Store current embedding
        const embedding = Array.from(detections.descriptor);
        if (!embeddingRef.current) embeddingRef.current = [];
        embeddingRef.current.push(embedding);

        setStepCompleted(prev => {
            const next = [...prev];
            next[currentStep] = true;
            return next;
        });
        setStepJustCompleted(true);
        setTimeout(() => setStepJustCompleted(false), 500);

        if (currentStep < poses.length - 1) {
            setTimeout(() => {
                setActiveStep(prev => prev + 1);
                activeStepRef.current = currentStep + 1;
                setPoseProgress(0);
                processingRef.current = false;
            }, 500);
        } else {
            stopCamera();
            // Average the embeddings
            const totalEmbeddings = embeddingRef.current.length;
            const avgEmbedding = new Array(embedding[0].length).fill(0);

            for (const emb of embeddingRef.current) {
                for (let i = 0; i < emb.length; i++) {
                    avgEmbedding[i] += emb[i];
                }
            }

            for (let i = 0; i < avgEmbedding.length; i++) {
                avgEmbedding[i] /= totalEmbeddings;
            }

            onComplete(avgEmbedding);
            embeddingRef.current = [];
        }
    };

    const getDistanceHint = () => {
        if (!faceDetected) return null;
        if (faceSize < 0.03) return { text: 'Move closer', color: '#E65100' };
        if (faceSize > 0.25) return { text: 'Move back', color: '#E65100' };
        return { text: 'Good distance', color: '#2E7D32' };
    };

    // ── Pre-scan screen ──────────────────────────────────────────────────
    if (activeStep === -1) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 1 }}>
                <Box sx={{
                    width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(198, 40, 40, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px dashed #C62828',
                }}>
                    <Face sx={{ fontSize: 48, color: '#C62828' }} />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: '#212121' }}>
                    Face Verification
                </Typography>
                <Typography variant="body2" sx={{ color: '#757575', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                    We'll scan your face from multiple angles to verify your identity and prevent proxy attendance.
                </Typography>

                {/* Tips */}
                <Box sx={{
                    width: '100%', maxWidth: 340, p: 2, borderRadius: 2,
                    bgcolor: '#FFF8E1', border: '1px solid #FFE082',
                }}>
                    <Typography variant="caption" sx={{
                        fontWeight: 700, color: '#E65100', textTransform: 'uppercase',
                        letterSpacing: 1.2, mb: 1, display: 'block',
                    }}>
                        Before you start
                    </Typography>
                    {[
                        { icon: <LightMode sx={{ fontSize: 15 }} />, text: 'Ensure good, even lighting on your face' },
                        { icon: <RemoveRedEye sx={{ fontSize: 15 }} />, text: 'Remove sunglasses or hats' },
                        { icon: <Visibility sx={{ fontSize: 15 }} />, text: 'Keep your face centered and visible' },
                    ].map((tip, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Box sx={{ color: '#F57F17' }}>{tip.icon}</Box>
                            <Typography variant="caption" sx={{ color: '#5D4037' }}>{tip.text}</Typography>
                        </Box>
                    ))}
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    onClick={startCamera}
                    disabled={!modelsLoaded}
                    startIcon={!modelsLoaded ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <VideoCameraFront />}
                    sx={{
                        bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' },
                        px: 5, borderRadius: 3, py: 1.4, fontWeight: 700, mt: 0.5,
                        boxShadow: 'none', '&:active': { boxShadow: 'none' },
                    }}
                >
                    {modelsLoaded ? "Start Face Scan" : "Loading Models..."}
                </Button>

                {error && <Alert severity="error" sx={{ width: '100%', maxWidth: 340 }}>{error}</Alert>}
            </Box>
        );
    }

    // ── Active scanning screen ───────────────────────────────────────────
    // Constant array length
    const displayStep = Math.min(activeStep, poses.length - 1);
    const currentPose = poses[displayStep];
    const distanceHint = getDistanceHint();
    const completedCount = stepCompleted.filter(Boolean).length;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {/* Step chips */}
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
                {poses.map((pose, index) => {
                    const active = index === activeStep;
                    const done = stepCompleted[index];
                    return (
                        <Chip
                            key={`${pose.key}-${index}`}
                            label={pose.label}
                            size="small"
                            icon={done ? <CheckCircle sx={{ fontSize: 15 }} /> : undefined}
                            sx={{
                                fontWeight: 600, fontSize: '0.7rem', height: 26,
                                transition: 'all 0.3s',
                                ...(done ? {
                                    bgcolor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7',
                                    '& .MuiChip-icon': { color: '#43A047' },
                                } : active ? {
                                    bgcolor: '#FFEBEE', color: '#C62828', border: '2px solid #EF9A9A',
                                } : {
                                    bgcolor: '#F5F5F5', color: '#9E9E9E', border: '1px solid #E0E0E0',
                                }),
                            }}
                        />
                    );
                })}
            </Box>

            {/* Video container */}
            <Box sx={{ position: 'relative', width: 310, height: 310 }}>
                {/* Progress ring */}
                <ProgressRing
                    activeStep={displayStep}
                    poseProgress={poseProgress}
                    totalSteps={poses.length}
                    stepCompleted={stepCompleted}
                />

                {/* Video circle */}
                <Box sx={{
                    position: 'absolute', top: 12, left: 12,
                    width: 286, height: 286,
                    borderRadius: '50%', overflow: 'hidden', bgcolor: '#000',
                    border: stepJustCompleted
                        ? '3px solid #4CAF50'
                        : faceDetected
                            ? '3px solid #C62828'
                            : '3px solid #E0E0E0',
                    transition: 'border-color 0.3s',
                }}>
                    <video
                        ref={videoRef} autoPlay muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%',
                            transform: 'scaleX(-1)', opacity: 0.5,
                        }}
                    />

                    {/* Step-complete flash */}
                    <Fade in={stepJustCompleted} timeout={200}>
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(76,175,80,0.2)',
                        }}>
                            <CheckCircle sx={{ fontSize: 56, color: '#4CAF50' }} />
                        </Box>
                    </Fade>
                </Box>

                {/* Direction arrow */}
                <DirectionIndicator
                    pose={currentPose?.key}
                    isActive={displayStep >= 0}
                    progress={poseProgress}
                />

                {/* Counter badge */}
                <Box sx={{
                    position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 20, bgcolor: '#fff', borderRadius: 10, px: 1.5, py: 0.3,
                    border: '1px solid #E0E0E0', boxShadow: 1,
                }}>
                    <Typography variant="caption" sx={{ color: '#424242', fontWeight: 700, fontSize: '0.7rem' }}>
                        {completedCount} / {poses.length} done
                    </Typography>
                </Box>
            </Box>

            {/* Status panel */}
            <Paper elevation={0} sx={{
                width: '100%', maxWidth: 340, borderRadius: 2, overflow: 'hidden',
                border: '1px solid #E0E0E0',
            }}>
                {/* Instruction bar */}
                <Box sx={{
                    px: 2, py: 1.5,
                    bgcolor: poseProgress > 75 ? '#E8F5E9' : '#FAFAFA',
                    borderBottom: '1px solid #E0E0E0',
                    transition: 'background-color 0.4s',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {React.createElement(currentPose?.icon || CenterFocusStrong, {
                            sx: { color: poseProgress > 75 ? '#2E7D32' : '#C62828', fontSize: 20 }
                        })}
                        <Box>
                            <Typography variant="body2" sx={{
                                fontWeight: 700, lineHeight: 1.2,
                                color: poseProgress > 75 ? '#2E7D32' : '#212121',
                            }}>
                                {currentPose?.instruction}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                                Step {displayStep + 1} of {poses.length}
                            </Typography>
                        </Box>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={poseProgress}
                        sx={{
                            mt: 1, height: 4, borderRadius: 2, bgcolor: '#E0E0E0',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: poseProgress > 75 ? '#4CAF50' : '#C62828',
                                borderRadius: 2,
                                transition: 'transform 0.2s ease, background-color 0.3s',
                            },
                        }}
                    />
                </Box>

                {/* Feedback row */}
                <Box sx={{ px: 2, py: 1.2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{
                                width: 7, height: 7, borderRadius: '50%',
                                bgcolor: faceDetected ? '#4CAF50' : '#F44336',
                                animation: !faceDetected ? 'blink 1s infinite' : 'none',
                                '@keyframes blink': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.3 },
                                },
                            }} />
                            <Typography variant="caption" sx={{
                                fontWeight: 600,
                                color: faceDetected ? '#2E7D32' : '#C62828',
                            }}>
                                {faceDetected ? 'Face Detected' : 'No Face Detected'}
                            </Typography>
                        </Box>
                        {distanceHint && (
                            <Typography variant="caption" sx={{ fontWeight: 600, color: distanceHint.color }}>
                                {distanceHint.text}
                            </Typography>
                        )}
                    </Box>

                    {faceDetected && (
                        <Typography variant="caption" sx={{
                            fontWeight: 600,
                            color: poseProgress > 50 ? '#2E7D32' : '#757575',
                        }}>
                            {poseProgress > 75 ? '✓ Almost there — hold still...'
                                : poseProgress > 30 ? 'Matching pose — keep holding...'
                                    : currentPose?.instruction}
                        </Typography>
                    )}

                    {noFaceHint && !faceDetected && (
                        <Fade in>
                            <Box sx={{
                                display: 'flex', alignItems: 'flex-start', gap: 0.75,
                                mt: 0.5, p: 1, bgcolor: '#FFF8E1', borderRadius: 1.5, border: '1px solid #FFE082',
                            }}>
                                <ErrorOutline sx={{ fontSize: 14, color: '#E65100', mt: 0.2 }} />
                                <Typography variant="caption" sx={{ color: '#5D4037', lineHeight: 1.3 }}>
                                    Make sure your face is well-lit and clearly visible. Try adjusting your position.
                                </Typography>
                            </Box>
                        </Fade>
                    )}
                </Box>
            </Paper>

            <Button
                variant="text" size="small"
                onClick={() => {
                    stopCamera();
                    setActiveStep(-1);
                    activeStepRef.current = -1;
                    embeddingRef.current = null;
                    processingRef.current = false;
                    setPoseProgress(0);
                    setStepCompleted(poses.map(() => false));
                    setFaceDetected(false);
                    setNoFaceHint(false);
                    onReset();
                }}
                startIcon={<ArrowBack />}
                sx={{ color: '#757575', fontWeight: 600 }}
            >
                Cancel & Go Back
            </Button>

            {error && <Alert severity="error" sx={{ width: '100%', maxWidth: 340 }}>{error}</Alert>}
        </Box>
    );
};

export default FaceScanner;
