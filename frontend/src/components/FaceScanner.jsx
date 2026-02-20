import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import {
    Box, Typography, CircularProgress, Alert, Paper, Button
} from '@mui/material';
import {
    Face, VideoCameraFront, ArrowBack
} from '@mui/icons-material';

const POSES = [
    { key: 'CENTER', instruction: 'Look directly at the camera' },
    { key: 'LEFT', instruction: 'Turn your head left' },
    { key: 'RIGHT', instruction: 'Turn your head right' },
    { key: 'UP', instruction: 'Look slightly up' },
    { key: 'DOWN', instruction: 'Look slightly down' }
];

// 3D Avatar Assistant Component - Light Theme
const AvatarAssistant = ({ pose, progress }) => {
    const isActive = (p) => pose === p;
    const color = progress > 80 ? '#10B981' : '#C62828';

    return (
        <Box sx={{ width: 180, height: 180, position: 'relative' }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                <ellipse
                    cx="50" cy="45" rx="30" ry="38"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    style={{
                        transition: 'all 0.5s ease-in-out',
                        transform: `translate(${isActive('LEFT') ? '-10px' : isActive('RIGHT') ? '10px' : '0'
                            }, ${isActive('UP') ? '-8px' : isActive('DOWN') ? '8px' : '0'
                            }) rotate(${isActive('LEFT') ? '-15deg' : isActive('RIGHT') ? '15deg' : '0'
                            })`,
                        transformOrigin: 'center'
                    }}
                />
                <g style={{
                    transition: 'all 0.5s ease-in-out',
                    transform: `translate(${isActive('LEFT') ? '-15px' : isActive('RIGHT') ? '15px' : '0'
                        }, ${isActive('UP') ? '-12px' : isActive('DOWN') ? '12px' : '0'
                        })`,
                    transformOrigin: 'center'
                }}>
                    <path d="M50 20 Q50 45 50 80" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
                    <path d="M30 40 Q50 40 70 40" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="40" cy="40" r="2" fill={color} />
                    <circle cx="60" cy="40" r="2" fill={color} />
                </g>
                <ellipse
                    cx="50" cy="45" rx="32" ry="40"
                    fill="none"
                    stroke={color}
                    strokeWidth="0.5"
                    opacity="0.3"
                >
                    <animate attributeName="rx" values="30;35;30" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="ry" values="38;43;38" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                </ellipse>
            </svg>
        </Box>
    );
};

const FaceScanner = ({ onComplete, onReset }) => {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [activeStep, setActiveStep] = useState(-1);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [poseProgress, setPoseProgress] = useState(0);
    const [stream, setStream] = useState(null);

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
                setError("Failed to load face recognition models.");
            }
        };
        loadModels();
    }, []);

    const startCamera = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Camera access is not supported by this browser or requires a secure (HTTPS) connection.");
            console.error("Camera API not available. This usually happens in insecure (HTTP) contexts.");
            return;
        }
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
            });
            setStream(s);
            setScanning(true);
            setActiveStep(0);
        } catch (err) {
            console.error("Camera error:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setScanning(false);
    };

    useEffect(() => {
        if (activeStep >= 0 && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
    }, [activeStep, stream]);

    useEffect(() => {
        let interval;
        if (scanning && modelsLoaded && activeStep >= 0 && activeStep < POSES.length) {
            interval = setInterval(async () => {
                const videoEl = videoRef.current;
                const canvasEl = canvasRef.current;
                if (!videoEl || !canvasEl) return;

                const detections = await faceapi.detectSingleFace(
                    videoEl,
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks().withFaceDescriptor();

                if (detections && videoRef.current && canvasRef.current) {
                    const currentPose = POSES[activeStep];
                    const isCorrectPose = checkPose(detections, currentPose.key);

                    console.log(`[FaceScan] Pose: ${currentPose.key}, Detected: true, Match: ${isCorrectPose}, Progress: ${poseProgress}`);

                    if (isCorrectPose) {
                        setPoseProgress(prev => {
                            const next = prev + 15;
                            if (next >= 100) {
                                console.log(`[FaceScan] Step Complete: ${currentPose.key}`);
                                setTimeout(() => handleStepCompletion(detections), 0);
                                return 0;
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

        const noseTip = nose[3];
        const leftEyeCenter = leftEye[3];
        const rightEyeCenter = rightEye[0];

        const verticalCenter = (leftEyeCenter.y + rightEyeCenter.y) / 2;
        const horizontalCenter = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const noseOffset = noseTip.x - horizontalCenter;
        const eyeDist = rightEyeCenter.x - leftEyeCenter.x;

        // Note: Coordinates are mirrored in the UI, but we check raw data here.
        // We'll broaden thresholds for better UX.
        switch (poseKey) {
            case 'CENTER':
                return Math.abs(noseOffset) < eyeDist * 0.3;
            case 'LEFT':
                // For a mirrored view, turning head LEFT means nose moves RIGHT in coordinates
                return noseOffset > eyeDist * 0.35;
            case 'RIGHT':
                // For a mirrored view, turning head RIGHT means nose moves LEFT in coordinates
                return noseOffset < -eyeDist * 0.35;
            case 'UP':
                return noseTip.y < verticalCenter - (eyeDist * 0.15);
            case 'DOWN':
                return noseTip.y > verticalCenter + (eyeDist * 0.25);
            default:
                return true;
        }
    };

    const handleStepCompletion = (detections) => {
        if (POSES[activeStep].key === 'CENTER') {
            const embedding = Array.from(detections.descriptor);
            if (activeStep === POSES.length - 1) {
                stopCamera();
                onComplete(embedding);
            } else {
                setActiveStep(prev => prev + 1);
                // Keep the center descriptor for final completion
                window._tempEmbedding = embedding;
            }
        } else if (activeStep < POSES.length - 1) {
            setActiveStep(prev => prev + 1);
            setPoseProgress(0);
        } else {
            stopCamera();
            onComplete(window._tempEmbedding);
            delete window._tempEmbedding;
        }
    };

    const getGlowStyles = (section) => {
        const currentKey = POSES[activeStep]?.key;
        const isTarget = currentKey === section;
        const color = poseProgress > 80 ? '#10B981' : '#C62828';
        if (!isTarget) return { opacity: 0.1, border: '2px solid rgba(0,0,0,0.05)' };
        return {
            opacity: 1,
            boxShadow: `inset 0 0 15px ${color}, 0 0 10px ${color}`,
            border: `3px solid ${color}`,
            transition: 'all 0.3s ease'
        };
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {activeStep === -1 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{
                        width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(198, 40, 40, 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
                        border: '3px dashed #C62828'
                    }}>
                        <Face sx={{ fontSize: 70, color: '#C62828' }} />
                    </Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 800 }}>Neural Enrollment</Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: '#64748b', maxWidth: 400, mx: 'auto' }}>
                        We require a 3D-space liveness verification to ensure session integrity and prevent proxy attendance.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={startCamera}
                        disabled={!modelsLoaded}
                        startIcon={!modelsLoaded ? <CircularProgress size={20} /> : <VideoCameraFront />}
                        sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, px: 6, borderRadius: 3, py: 1.5, fontWeight: 700 }}
                    >
                        {modelsLoaded ? "Initialize Scan" : "Preparing..."}
                    </Button>
                </Box>
            ) : (
                <Box sx={{ width: '100%', maxWidth: 450, position: 'relative' }}>
                    <Box sx={{
                        position: 'relative', width: '100%', aspectRatio: '1/1', bgcolor: '#000',
                        borderRadius: '50%', overflow: 'hidden', border: '6px solid #1e293b',
                    }}>
                        <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', opacity: 0.6 }} />

                        <Box sx={{ position: 'absolute', top: 0, left: '25%', width: '50%', height: '15px', borderRadius: '0 0 50% 50%', ...getGlowStyles('UP') }} />
                        <Box sx={{ position: 'absolute', bottom: 0, left: '25%', width: '50%', height: '15px', borderRadius: '50% 50% 0 0', ...getGlowStyles('DOWN') }} />
                        <Box sx={{ position: 'absolute', left: 0, top: '25%', height: '50%', width: '15px', borderRadius: '0 50% 50% 0', ...getGlowStyles('LEFT') }} />
                        <Box sx={{ position: 'absolute', right: 0, top: '25%', height: '50%', width: '15px', borderRadius: '50% 0 0 50%', ...getGlowStyles('RIGHT') }} />

                        <Box sx={{
                            position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
                            zIndex: 10, pointerEvents: 'none', opacity: 0.4
                        }}>
                            <AvatarAssistant pose={POSES[activeStep]?.key} progress={poseProgress} />
                        </Box>

                        <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 50 }}>
                            <CircularProgress
                                variant="determinate"
                                value={((activeStep + (poseProgress / 100)) / (POSES.length)) * 100}
                                size={60} thickness={5} sx={{ color: '#C62828' }}
                            />
                        </Box>
                    </Box>

                    <Paper elevation={0} sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: '#1a202c' }}>
                            {POSES[activeStep]?.instruction}
                        </Typography>
                        <Button variant="text" size="small" onClick={() => { stopCamera(); setActiveStep(-1); onReset(); }} startIcon={<ArrowBack />} sx={{ mt: 1, color: '#64748b' }}>
                            Reset
                        </Button>
                    </Paper>
                </Box>
            )}
            {error && <Alert severity="error">{error}</Alert>}
        </Box>
    );
};

export default FaceScanner;
