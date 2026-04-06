import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEntryLogsApi, getPlatformEntryStatsApi } from '../../api/qr.api';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import useStore from '../../store/useStore';
import { io as socketIO } from 'socket.io-client';

export default function EntryLogs() {
    const accessToken = useStore((s) => s.accessToken);
    const [liveLogs, setLiveLogs] = useState([]);

    const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } =
        useQuery({
            queryKey: ['platform-entry-stats'],
            queryFn: () => getPlatformEntryStatsApi().then((r) => r.data.data),
            refetchInterval: 15000,
        });

    const { data: logsData, isLoading: logsLoading, isError: logsError, refetch: refetchLogs } =
        useQuery({
            queryKey: ['entry-logs'],
            queryFn: () => getEntryLogsApi().then((r) => r.data.data),
        });

    // Real-time socket updates
    useEffect(() => {
        if (!accessToken) return;
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const socket = socketIO(socketUrl, { auth: { token: accessToken } });

        socket.on('entry:scanned', (log) => {
            setLiveLogs((prev) => [log, ...prev].slice(0, 50));
            refetchStats();
        });

        return () => socket.disconnect();
    }, [accessToken]);

    if (statsLoading || logsLoading) return <Loader />;
    if (statsError || logsError) return <ErrorState onRetry={() => { refetchStats(); refetchLogs(); }} />;

    const { totalRegistrations = 0, totalEntries = 0, remainingEntries = 0 } = statsData || {};
    const historicalLogs = logsData?.logs || [];

    // Merge live + historical, deduplicate by registrationId
    const seen = new Set();
    const allLogs = [...liveLogs, ...historicalLogs].filter((l) => {
        const key = l.registrationId || l.email + l.entryTime;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Entry Logs</h2>
                {liveLogs.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Registrations', value: totalRegistrations, icon: '📋', color: 'text-indigo-600 dark:text-indigo-400' },
                    { label: 'Total Entries', value: totalEntries, icon: '✅', color: 'text-green-600 dark:text-green-400' },
                    { label: 'Remaining', value: remainingEntries, icon: '⏳', color: 'text-amber-600 dark:text-amber-400' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
                                <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                            </div>
                            <span className="text-3xl">{kpi.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Entry progress bar */}
            {totalRegistrations > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Entry Progress</span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                            {Math.round((totalEntries / totalRegistrations) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((totalEntries / totalRegistrations) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Logs table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Entry Log</h3>
                </div>
                {allLogs.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">No entries recorded yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Event</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Entry Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allLogs.map((log, i) => (
                                    <tr key={i} className={`border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i === 0 && liveLogs.includes(log) ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{log.name}</td>
                                        <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{log.email}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{log.eventTitle}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {log.entryTime ? new Date(log.entryTime).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
