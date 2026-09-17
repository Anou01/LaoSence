import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface GameResult {
    id: string;
    playerName: string;
    score: number;
    totalQuestions: number;
    timeInSeconds: number;
    completedAt: string;
}

const STORAGE_KEY = 'wardriving_quiz_results';

export default function GameDashboardPage() {
    const [results, setResults] = useState<GameResult[]>([]);
    const [topPlayers, setTopPlayers] = useState<GameResult[]>([]);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            // Try to fetch from API first
            const response = await fetch('http://localhost:3001/api/results');
            if (response.ok) {
                const parsedResults: GameResult[] = await response.json();
                setResults(parsedResults);

                // Sort by score (descending), then by time (ascending)
                const sorted = [...parsedResults].sort((a, b) => {
                    if (b.score !== a.score) {
                        return b.score - a.score; // Higher score first
                    }
                    return a.timeInSeconds - b.timeInSeconds; // Faster time first
                });

                setTopPlayers(sorted.slice(0, 10)); // Top 10 players
                return;
            }
        } catch (error) {
            console.error('Error fetching from API:', error);
        }

        // Fallback to localStorage
        const storedResults = localStorage.getItem(STORAGE_KEY);
        if (storedResults) {
            const parsedResults: GameResult[] = JSON.parse(storedResults);
            setResults(parsedResults);

            // Sort by score (descending), then by time (ascending)
            const sorted = [...parsedResults].sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score; // Higher score first
                }
                return a.timeInSeconds - b.timeInSeconds; // Faster time first
            });

            setTopPlayers(sorted.slice(0, 10)); // Top 10 players
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('lo-LA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMedalEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getMedalColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-400 to-yellow-600';
        if (rank === 2) return 'from-gray-300 to-gray-500';
        if (rank === 3) return 'from-orange-400 to-orange-600';
        return 'from-primary/20 to-primary/10';
    };

    const clearLeaderboard = () => {
        if (window.confirm('ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂໍ້ມູນທັງໝົດ?')) {
            localStorage.removeItem(STORAGE_KEY);
            setResults([]);
            setTopPlayers([]);
        }
    };

    return (
        <div className="min-h-screen bg-background py-6 sm:py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-card rounded-xl shadow-lg p-6 sm:p-8 mb-6 border border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                                    ຕາຕະລາງຄະແນນ
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                    Wardriving Quiz Leaderboard
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                to="/game"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                ເລີ່ມເກມ 🎮
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="bg-primary/5 rounded-lg p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-primary">{results.length}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">ຜູ້ເຂົ້າຮ່ວມທັງໝົດ</p>
                        </div>
                        <div className="bg-accent/10 rounded-lg p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold text-accent-foreground">{topPlayers.length > 0 ? topPlayers[0]?.playerName : '-'}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">ຜູ້ນຳ</p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-4 text-center col-span-2 sm:col-span-1">
                            <p className="text-2xl sm:text-3xl font-bold text-green-600">
                                {topPlayers.length > 0 && topPlayers[0] ? `${topPlayers[0].score}/${topPlayers[0].totalQuestions}` : '-'}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">ຄະແນນສູງສຸດ</p>
                        </div>
                    </div>
                </div>

                {/* Top 3 Podium */}
                {topPlayers.length >= 3 && (
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 px-2">🏆 Top 3 Champions</h2>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
                            {/* 2nd Place */}
                            <div className="order-1">
                                <div className={`bg-gradient-to-br ${getMedalColor(2)} rounded-xl p-4 sm:p-6 text-center shadow-xl transform hover:scale-105 transition-transform`}>
                                    <div className="text-4xl sm:text-5xl mb-2">🥈</div>
                                    <p className="font-bold text-white text-sm sm:text-lg truncate">{topPlayers[1].playerName}</p>
                                    <p className="text-white/90 text-xs sm:text-sm mt-1">{topPlayers[1].score}/{topPlayers[1].totalQuestions}</p>
                                    <p className="text-white/80 text-xs mt-1">{formatTime(topPlayers[1].timeInSeconds)}</p>
                                </div>
                            </div>

                            {/* 1st Place */}
                            <div className="order-2">
                                <div className={`bg-gradient-to-br ${getMedalColor(1)} rounded-xl p-4 sm:p-8 text-center shadow-2xl transform hover:scale-105 transition-transform`}>
                                    <div className="text-5xl sm:text-6xl mb-2">🥇</div>
                                    <p className="font-bold text-white text-base sm:text-xl truncate">{topPlayers[0].playerName}</p>
                                    <p className="text-white/90 text-sm sm:text-base mt-1">{topPlayers[0].score}/{topPlayers[0].totalQuestions}</p>
                                    <p className="text-white/80 text-xs sm:text-sm mt-1">{formatTime(topPlayers[0].timeInSeconds)}</p>
                                </div>
                            </div>

                            {/* 3rd Place */}
                            <div className="order-3">
                                <div className={`bg-gradient-to-br ${getMedalColor(3)} rounded-xl p-4 sm:p-6 text-center shadow-xl transform hover:scale-105 transition-transform`}>
                                    <div className="text-4xl sm:text-5xl mb-2">🥉</div>
                                    <p className="font-bold text-white text-sm sm:text-lg truncate">{topPlayers[2].playerName}</p>
                                    <p className="text-white/90 text-xs sm:text-sm mt-1">{topPlayers[2].score}/{topPlayers[2].totalQuestions}</p>
                                    <p className="text-white/80 text-xs mt-1">{formatTime(topPlayers[2].timeInSeconds)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Leaderboard Table */}
                <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">ລາຍຊື່ທັງໝົດ</h2>
                        {results.length > 0 && (
                            <button
                                onClick={clearLeaderboard}
                                className="text-sm text-destructive hover:text-destructive/80 font-medium"
                            >
                                ລຶບທັງໝົດ
                            </button>
                        )}
                    </div>

                    {topPlayers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-block p-4 bg-muted rounded-full mb-4">
                                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                </svg>
                            </div>
                            <p className="text-muted-foreground text-lg">ຍັງບໍ່ມີຂໍ້ມູນ</p>
                            <p className="text-muted-foreground text-sm mt-2">ເລີ່ມເກມເພື່ອເຂົ້າສູ່ຕາຕະລາງຄະແນນ!</p>
                            <Link
                                to="/game"
                                className="inline-block mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                            >
                                ເລີ່ມເກມດຽວນີ້
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">ອັນດັບ</th>
                                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">ຊື່ຜູ້ຫຼີ້ນ</th>
                                        <th className="text-center py-3 px-4 font-semibold text-sm text-muted-foreground">ຄະແນນ</th>
                                        <th className="text-center py-3 px-4 font-semibold text-sm text-muted-foreground">ເວລາ</th>
                                        <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground hidden sm:table-cell">ວັນທີ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topPlayers.map((result, index) => {
                                        const rank = index + 1;
                                        const percentage = Math.round((result.score / result.totalQuestions) * 100);

                                        return (
                                            <tr
                                                key={result.id}
                                                className={`border-b border-border hover:bg-accent/5 transition-colors ${rank <= 3 ? 'bg-primary/5' : ''
                                                    }`}
                                            >
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                        rank === 2 ? 'bg-gray-100 text-gray-700' :
                                                            rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {getMedalEmoji(rank)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="font-semibold text-foreground">{result.playerName}</p>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div>
                                                        <p className="font-bold text-primary">{result.score}/{result.totalQuestions}</p>
                                                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <p className="font-mono text-sm text-foreground">{formatTime(result.timeInSeconds)}</p>
                                                    <p className="text-xs text-muted-foreground">{result.timeInSeconds}s</p>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                                                    {formatDate(result.completedAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="inline-block text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← ກັບໄປໜ້າຫຼັກ
                    </Link>
                </div>
            </div>
        </div>
    );
}
