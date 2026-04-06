import { useEffect, useRef, useState } from 'react';
import { scanQRApi } from '../../api/qr.api';

/**
 * ScanEntry — Admin page to scan QR codes using device camera.
 * Uses html5-qrcode library for camera-based scanning.
 */
export default function ScanEntry() {
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null); // { status, message, student, event, entryTime }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [cameraError, setCameraError] = useState('');

    const startScanner = async () => {
        setCameraError('');
        setResult(null);
        setError('');
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const html5Qr = new Html5Qrcode('qr-reader');
            html5QrRef.current = html5Qr;

            await html5Qr.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                () => {} // ignore per-frame errors
            );
            setScanning(true);
        } catch (err) {
            if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
                setCameraError('Camera permission denied. Please allow camera access and try again.');
            } else {
                setCameraError('Could not start camera: ' + (err?.message || String(err)));
            }
        }
    };

    const stopScanner = async () => {
        try {
            if (html5QrRef.current) {
                await html5QrRef.current.stop();
                html5QrRef.current.clear();
                html5QrRef.current = null;
            }
        } catch (_) {}
        setScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        // Pause scanner while validating
        await stopScanner();
        setLoading(true);
        setResult(null);
        setError('');
        try {
            const { data } = await scanQRApi(decodedText);
            setResult(data.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Scan failed';
            setResult({ status: 'INVALID', message: msg });
        } finally {
            setLoading(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    const resultConfig = {
        VALID: {
            bg: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
            icon: '✅',
            title: 'Entry Allowed',
            textColor: 'text-green-700 dark:text-green-400',
        },
        ALREADY_USED: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
            icon: '⚠️',
            title: 'Already Entered',
            textColor: 'text-yellow-700 dark:text-yellow-400',
        },
        INVALID: {
            bg: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
            icon: '❌',
            title: 'Invalid QR',
            textColor: 'text-red-700 dark:text-red-400',
        },
    };

    const cfg = result ? (resultConfig[result.status] || resultConfig.INVALID) : null;

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scan Entry</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Use the camera to scan a student's QR pass for event entry.
            </p>

            {/* Scanner viewport */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div id="qr-reader" ref={scannerRef} className="w-full" style={{ minHeight: scanning ? 300 : 0 }} />

                {!scanning && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-4xl">
                            📷
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            Camera is off. Click Start to begin scanning.
                        </p>
                        {cameraError && (
                            <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 text-center">
                                {cameraError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
                {!scanning ? (
                    <button
                        onClick={startScanner}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
                    >
                        📷 Start Scanner
                    </button>
                ) : (
                    <button
                        onClick={stopScanner}
                        className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold text-sm transition-colors"
                    >
                        ⏹ Stop Scanner
                    </button>
                )}
                {result && (
                    <button
                        onClick={() => { setResult(null); setError(''); startScanner(); }}
                        className="flex-1 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-colors"
                    >
                        🔄 Scan Next
                    </button>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center gap-3 py-6">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Validating QR...</span>
                </div>
            )}

            {/* Result card */}
            {result && cfg && !loading && (
                <div className={`rounded-2xl border-2 p-6 ${cfg.bg} space-y-3`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{cfg.icon}</span>
                        <div>
                            <p className={`text-lg font-bold ${cfg.textColor}`}>{cfg.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{result.message}</p>
                        </div>
                    </div>

                    {result.student && (
                        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Name</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{result.student.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Email</span>
                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{result.student.email}</span>
                            </div>
                            {result.event && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Event</span>
                                    <span className="font-semibold text-gray-800 dark:text-white">{result.event.title}</span>
                                </div>
                            )}
                            {result.entryTime && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Entry Time</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {new Date(result.entryTime).toLocaleTimeString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
}
