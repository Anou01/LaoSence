import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import quizData from '../json/question.json';

interface Question {
    id: number;
    question: string;
    choices: string[];
    correct_index: number;
    explanation: string;
}

interface QuizData {
    quiz_title: string;
    description: string;
    questions: Question[];
}

interface GameResult {
    id: string;
    playerName: string;
    score: number;
    totalQuestions: number;
    timeInSeconds: number;
    completedAt: string;
}

const STORAGE_KEY = 'wardriving_quiz_results';

export default function WardrivingGamePage() {
    const navigate = useNavigate();

    // Game states
    const [gameState, setGameState] = useState<'entry' | 'playing' | 'result'>('entry');
    const [playerName, setPlayerName] = useState('');
    const [nameError, setNameError] = useState('');

    // Quiz states
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);
    const [showExplanation, setShowExplanation] = useState(false);

    // Timer states
    const [startTime, setStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const [playerRank, setPlayerRank] = useState<number>(0);

    const data: QuizData = quizData as QuizData;
    const currentQuestion = data.questions[currentQuestionIndex];
    const totalQuestions = data.questions.length;

    // Timer effect
    useEffect(() => {
        if (gameState === 'playing') {
            const interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [gameState, startTime]);

    useEffect(() => {
        if (gameState === 'playing') {
            setAnsweredQuestions(new Array(totalQuestions).fill(false));
        }
    }, [totalQuestions, gameState]);

    const handleStartGame = () => {
        const trimmedName = playerName.trim();
        if (!trimmedName) {
            setNameError('ກະລຸນາໃສ່ຊື່ຂອງທ່ານ');
            return;
        }
        if (trimmedName.length < 2) {
            setNameError('ຊື່ຕ້ອງມີຢ່າງໜ້ອຍ 2 ຕົວອັກສອນ');
            return;
        }
        setNameError('');
        setGameState('playing');
        setStartTime(Date.now());
    };

    const saveResult = async (finalScore: number, timeInSeconds: number) => {
        const result: GameResult = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            playerName: playerName.trim(),
            score: finalScore,
            totalQuestions,
            timeInSeconds,
            completedAt: new Date().toISOString(),
        };

        try {
            // Save to result.json via backend API
            const response = await fetch('http://10.0.1.136:3001/api/save-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });

            if (!response.ok) {
                throw new Error('Failed to save result to server');
            }

            // Also save to localStorage as backup
            const existingResults = localStorage.getItem(STORAGE_KEY);
            const results: GameResult[] = existingResults ? JSON.parse(existingResults) : [];
            results.push(result);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(results));

        } catch (error) {
            console.error('Error saving result to server:', error);
            // Fallback to localStorage only
            const existingResults = localStorage.getItem(STORAGE_KEY);
            const results: GameResult[] = existingResults ? JSON.parse(existingResults) : [];
            results.push(result);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
        }
    };

    const handleAnswerClick = (index: number) => {
        if (!answeredQuestions[currentQuestionIndex]) {
            setSelectedAnswer(index);
            setShowExplanation(true);

            const newAnsweredQuestions = [...answeredQuestions];
            newAnsweredQuestions[currentQuestionIndex] = true;
            setAnsweredQuestions(newAnsweredQuestions);

            if (index === currentQuestion.correct_index) {
                setScore(score + 1);
            }
        }
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            // Game finished
            const finalTime = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(finalTime);
            await saveResult(score, finalTime);

            // Navigate to map page instead of showing results
            navigate('/map');
        }
    };

    const handleRestartQuiz = () => {
        setGameState('entry');
        setPlayerName('');
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setAnsweredQuestions([]);
        setShowExplanation(false);
        setElapsedTime(0);
        setPlayerRank(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getChoiceClassName = (index: number) => {
        if (!answeredQuestions[currentQuestionIndex]) {
            return 'bg-card hover:bg-accent hover:text-accent-foreground border-2 border-border transition-all duration-200 cursor-pointer';
        }

        if (index === currentQuestion.correct_index) {
            return 'bg-green-500 text-white border-2 border-green-600';
        }

        if (index === selectedAnswer && index !== currentQuestion.correct_index) {
            return 'bg-destructive text-destructive-foreground border-2 border-destructive';
        }

        return 'bg-muted text-muted-foreground border-2 border-border opacity-60';
    };

    // Name Entry Screen
    if (gameState === 'entry') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-card rounded-xl shadow-2xl p-6 sm:p-8 border border-border">
                    <div className="text-center space-y-6">
                        <div className="inline-block p-4 bg-primary/10 rounded-full">
                            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-15.857 21.213 0"></path>
                            </svg>
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                                {data.quiz_title}
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                {data.description}
                            </p>
                        </div>

                        <div className="bg-primary/5 rounded-lg p-4 space-y-2 text-left">
                            <p className="text-sm text-foreground flex items-center gap-2">
                                <span className="text-primary">📝</span>
                                <span>{totalQuestions} ຄຳຖາມ</span>
                            </p>
                            <p className="text-sm text-foreground flex items-center gap-2">
                                <span className="text-primary">⏱️</span>
                                <span>ເວລາຈະຖືກບັນທຶກ</span>
                            </p>
                            <p className="text-sm text-foreground flex items-center gap-2">
                                <span className="text-primary">🏆</span>
                                <span>ແຂ່ງຂັນເພື່ອເຂົ້າ Top 3!</span>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="text-left">
                                <label htmlFor="playerName" className="block text-sm font-medium text-foreground mb-2">
                                    ໃສ່ຊື່ຂອງທ່ານ *
                                </label>
                                <input
                                    id="playerName"
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => {
                                        setPlayerName(e.target.value);
                                        setNameError('');
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleStartGame();
                                        }
                                    }}
                                    placeholder="ຊື່ຂອງທ່ານ..."
                                    className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
                                    maxLength={50}
                                />
                                {nameError && (
                                    <p className="mt-2 text-sm text-destructive">{nameError}</p>
                                )}
                            </div>

                            <button
                                onClick={handleStartGame}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                ເລີ່ມເກມ 🚀
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Results Screen
    if (gameState === 'result') {
        const percentage = Math.round((score / totalQuestions) * 100);

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-card rounded-xl shadow-2xl p-6 sm:p-8 md:p-12 border border-border">
                    <div className="text-center space-y-6">
                        <div className="inline-block p-4 bg-primary/10 rounded-full">
                            <svg className="w-16 h-16 sm:w-20 sm:h-20 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                                ແບບທົດສອບສຳເລັດ!
                            </h2>
                            <p className="text-lg text-primary font-semibold">{playerName}</p>
                        </div>

                        <div className="bg-primary/5 rounded-lg p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-1">ຄະແນນ</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {score}/{totalQuestions}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">{percentage}%</p>
                                </div>
                                <div className="bg-background rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-1">ເວລາ</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {formatTime(elapsedTime)}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">{elapsedTime} ວິນາທີ</p>
                                </div>
                            </div>

                            {playerRank > 0 && (
                                <div className="bg-accent/20 border-2 border-accent rounded-lg p-4">
                                    <p className="text-sm text-accent-foreground mb-1">ອັນດັບຂອງທ່ານ</p>
                                    <p className="text-4xl font-bold text-accent-foreground">
                                        #{playerRank}
                                    </p>
                                    {playerRank <= 3 && (
                                        <p className="text-sm text-accent-foreground mt-2">
                                            {playerRank === 1 && '🥇 ຊະນະເລີດ!'}
                                            {playerRank === 2 && '🥈 ອັນດັບ 2!'}
                                            {playerRank === 3 && '🥉 ອັນດັບ 3!'}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-1000 ease-out"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="space-y-2 text-muted-foreground">
                            {percentage >= 80 && (
                                <p className="text-lg sm:text-xl">🎉 ດີເລີດ! ທ່ານມີຄວາມຮູ້ດີຫຼາຍກ່ຽວກັບ Wardriving!</p>
                            )}
                            {percentage >= 60 && percentage < 80 && (
                                <p className="text-lg sm:text-xl">👍 ດີ! ທ່ານມີຄວາມເຂົ້າໃຈພື້ນຖານທີ່ດີ!</p>
                            )}
                            {percentage < 60 && (
                                <p className="text-lg sm:text-xl">💪 ພະຍາຍາມຕື່ມອີກ! ລອງເລີ່ມໃໝ່ເພື່ອປັບປຸງຄະແນນ!</p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={handleRestartQuiz}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                            >
                                ເລີ່ມໃໝ່
                            </button>
                            <a
                                href="/game/leaderboard"
                                className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 rounded-lg text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block text-center"
                            >
                                ເບິ່ງຕາຕະລາງຄະແນນ 🏆
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Playing Screen
    return (
        <div className="min-h-screen bg-background py-6 sm:py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-card rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-border">
                    <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-15.857 21.213 0"></path>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
                                    {playerName}
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {data.quiz_title}
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-2xl sm:text-3xl font-bold text-primary">
                                {formatTime(elapsedTime)}
                            </div>
                            <p className="text-xs text-muted-foreground">⏱️ ເວລາ</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                            <span>ຄຳຖາມ {currentQuestionIndex + 1} ຈາກ {totalQuestions}</span>
                            <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 sm:h-3 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300 ease-out"
                                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-card rounded-xl shadow-lg p-6 sm:p-8 border border-border">
                    <div className="mb-6 sm:mb-8">
                        <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold mb-4">
                            ຄຳຖາມ {currentQuestionIndex + 1}
                        </div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-relaxed">
                            {currentQuestion.question}
                        </h2>
                    </div>

                    {/* Choices */}
                    <div className="space-y-3 sm:space-y-4 mb-6">
                        {currentQuestion.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerClick(index)}
                                disabled={answeredQuestions[currentQuestionIndex]}
                                className={`w-full text-left p-4 sm:p-5 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${getChoiceClassName(index)}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-background/50 flex items-center justify-center font-bold text-xs sm:text-sm">
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="flex-1">{choice}</span>
                                    {answeredQuestions[currentQuestionIndex] && index === currentQuestion.correct_index && (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                        </svg>
                                    )}
                                    {answeredQuestions[currentQuestionIndex] && index === selectedAnswer && index !== currentQuestion.correct_index && (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Explanation */}
                    {showExplanation && (
                        <div className="mb-6 p-4 sm:p-5 bg-accent/20 border-l-4 border-primary rounded-r-lg animate-fade-in">
                            <p className="text-sm sm:text-base text-accent-foreground">
                                <span className="font-semibold">ຄຳອະທິບາຍ: </span>
                                {currentQuestion.explanation}
                            </p>
                        </div>
                    )}

                    {/* Next Button */}
                    <button
                        onClick={handleNextQuestion}
                        disabled={!answeredQuestions[currentQuestionIndex]}
                        className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 ${answeredQuestions[currentQuestionIndex]
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            }`}
                    >
                        {currentQuestionIndex < totalQuestions - 1 ? 'ຄຳຖາມຕໍ່ໄປ →' : 'ສຳເລັດ ✓'}
                    </button>
                </div>

                {/* Score Display */}
                <div className="mt-6 text-center">
                    <p className="text-sm sm:text-base text-muted-foreground">
                        ຄະແນນປັດຈຸບັນ: <span className="font-bold text-primary text-lg sm:text-xl">{score}</span> / {currentQuestionIndex + 1}
                    </p>
                </div>
            </div>
        </div>
    );
}
