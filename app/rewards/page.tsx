// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthGuard } from "@/components/somago/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const WHEEL_SEGMENTS = [
  { label: "Nothing", color: "#e5e7eb", textColor: "#6b7280" },
  { label: "5 Coins", color: "#fbbf24", textColor: "#92400e" },
  { label: "Nothing", color: "#d1d5db", textColor: "#6b7280" },
  { label: "10 Coins", color: "#34d399", textColor: "#065f46" },
  { label: "Nothing", color: "#e5e7eb", textColor: "#6b7280" },
  { label: "20 Points", color: "#60a5fa", textColor: "#1e3a5f" },
  { label: "Nothing", color: "#d1d5db", textColor: "#6b7280" },
  { label: "Voucher!", color: "#f472b6", textColor: "#831843" },
];

function SpinWheel({ onSpin, spinning, disabled }: { onSpin: () => void; spinning: boolean; disabled: boolean }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning) {
      // Spin 5-8 full rotations + random offset
      const spins = 5 + Math.random() * 3;
      setRotation((prev) => prev + spins * 360 + Math.random() * 360);
    }
  }, [spinning]);

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  return (
    <div className="relative flex flex-col items-center">
      {/* Pointer */}
      <div className="absolute -top-2 z-10">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500" />
      </div>

      {/* Wheel */}
      <div
        className="relative h-64 w-64 rounded-full border-4 border-neutral-300 overflow-hidden shadow-lg"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
        }}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {WHEEL_SEGMENTS.map((seg, i) => {
            const startAngle = (i * segmentAngle * Math.PI) / 180;
            const endAngle = ((i + 1) * segmentAngle * Math.PI) / 180;
            const x1 = 100 + 100 * Math.cos(startAngle);
            const y1 = 100 + 100 * Math.sin(startAngle);
            const x2 = 100 + 100 * Math.cos(endAngle);
            const y2 = 100 + 100 * Math.sin(endAngle);
            const largeArc = segmentAngle > 180 ? 1 : 0;

            const midAngle = ((i + 0.5) * segmentAngle * Math.PI) / 180;
            const textX = 100 + 60 * Math.cos(midAngle);
            const textY = 100 + 60 * Math.sin(midAngle);
            const textRotation = (i + 0.5) * segmentAngle;

            return (
              <g key={i}>
                <path
                  d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={seg.color}
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={textX}
                  y={textY}
                  fill={seg.textColor}
                  fontSize="7"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="15" fill="white" stroke="#d1d5db" strokeWidth="2" />
        </svg>
      </div>

      <Button
        onClick={onSpin}
        disabled={disabled || spinning}
        className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-8"
      >
        {spinning ? "Spinning..." : "Spin (10 Coins)"}
      </Button>
    </div>
  );
}

function RewardsContent() {
  const checkInStatus = useQuery(api.gamification.getCheckInStatus);
  const spinHistory = useQuery(api.gamification.getSpinHistory);
  const dailyCheckIn = useMutation(api.gamification.dailyCheckIn);
  const spinWheel = useMutation(api.gamification.spinWheel);

  const [checkingIn, setCheckingIn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<{ prize: string; prizeType: string } | null>(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const result = await dailyCheckIn({});
      toast.success(`Checked in! +${result.coinsEarned} coins (Day ${result.streak})`);
      setShowCoinAnimation(true);
      setTimeout(() => setShowCoinAnimation(false), 2000);
    } catch (e: any) {
      toast.error(e.message || "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSpin = async () => {
    setSpinning(true);
    setLastPrize(null);
    try {
      const result = await spinWheel({});
      // Wait for animation to finish
      setTimeout(() => {
        setLastPrize(result);
        setSpinning(false);
        if (result.prizeType !== "nothing") {
          toast.success(`You won: ${result.prize}`);
        } else {
          toast.info(result.prize);
        }
      }, 4200);
    } catch (e: any) {
      setSpinning(false);
      toast.error(e.message || "Spin failed");
    }
  };

  // Generate last 7 days for calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en", { weekday: "short" }),
      dayNum: d.getDate(),
      isToday: i === 6,
    };
  });

  const checkedDates = new Set(checkInStatus?.recentCheckIns ?? []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header with coin balance */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Rewards</h1>
          <p className="text-sm text-neutral-500">Earn coins and win prizes daily</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-200 px-4 py-2">
          <span className="text-lg">&#x1FA99;</span>
          <span className="text-lg font-bold text-yellow-700">
            {checkInStatus?.totalCoins ?? 0}
          </span>
          <span className="text-sm text-yellow-600">coins</span>
          {showCoinAnimation && (
            <span className="animate-bounce text-lg">+</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Check-In Section */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Daily Check-In</h2>
            {checkInStatus && (
              <Badge variant="outline" className="text-primary-600 border-primary-300">
                {checkInStatus.currentStreak} day streak
              </Badge>
            )}
          </div>

          {/* Streak Calendar */}
          <div className="mb-5 grid grid-cols-7 gap-2">
            {last7Days.map((day) => {
              const isChecked = checkedDates.has(day.date);
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-neutral-400 uppercase">{day.dayName}</span>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      isChecked
                        ? "bg-primary-600 text-white"
                        : day.isToday
                          ? "border-2 border-primary-400 text-primary-600"
                          : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {isChecked ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      day.dayNum
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reward tiers */}
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className="flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1">
                <span className="text-neutral-500">Day {day}:</span>
                <span className="font-semibold text-yellow-600">
                  +{Math.min(day * 5, 50)} coins
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleCheckIn}
            disabled={checkingIn || checkInStatus?.checkedInToday}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            {checkInStatus?.checkedInToday
              ? "Checked In Today"
              : checkingIn
                ? "Checking In..."
                : "Check In Now"}
          </Button>
        </Card>

        {/* Spin the Wheel Section */}
        <Card className="p-6 flex flex-col items-center">
          <h2 className="mb-4 text-lg font-bold text-neutral-900 self-start">Spin the Wheel</h2>

          <SpinWheel
            onSpin={handleSpin}
            spinning={spinning}
            disabled={(checkInStatus?.totalCoins ?? 0) < 10}
          />

          {(checkInStatus?.totalCoins ?? 0) < 10 && !spinning && (
            <p className="mt-2 text-xs text-neutral-400 text-center">
              You need at least 10 coins to spin
            </p>
          )}

          {lastPrize && (
            <div
              className={`mt-4 w-full rounded-lg p-3 text-center text-sm font-semibold ${
                lastPrize.prizeType !== "nothing"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-neutral-50 text-neutral-500 border border-neutral-200"
              }`}
            >
              {lastPrize.prizeType !== "nothing" ? "You won: " : ""}
              {lastPrize.prize}
            </div>
          )}
        </Card>
      </div>

      {/* Spin History */}
      {spinHistory && spinHistory.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-bold text-neutral-900">Spin History</h2>
          <div className="space-y-2">
            {spinHistory.map((spin) => (
              <div
                key={spin._id}
                className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {spin.prizeType === "coins"
                      ? "\u{1FA99}"
                      : spin.prizeType === "voucher"
                        ? "\uD83C\uDFAB"
                        : spin.prizeType === "points"
                          ? "\u2B50"
                          : "\uD83D\uDE14"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{spin.prize}</p>
                    <p className="text-xs text-neutral-400">
                      {new Date(spin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {spin.prizeType !== "nothing" && (
                  <Badge
                    className={
                      spin.prizeType === "coins"
                        ? "bg-yellow-100 text-yellow-700"
                        : spin.prizeType === "voucher"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-blue-100 text-blue-700"
                    }
                  >
                    +{spin.prizeValue}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function RewardsPage() {
  return (
    <AuthGuard message="Sign in to access rewards and earn coins.">
      <RewardsContent />
    </AuthGuard>
  );
}
