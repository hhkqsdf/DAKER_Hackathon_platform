import { Trophy, Medal, TrendingUp, Users, Calendar, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { getStorage, getGlobalRankings, GlobalRankingEntry, LeaderboardEntry, Hackathon } from '../../lib/storage';
import { RANKING_PERIOD_OPTIONS } from '../../lib/constants';
import { Link } from 'react-router';

function PodiumCard({ entry, rank }: { entry: GlobalRankingEntry; rank: number }) {
  const heights = [120, 90, 70];
  const colors = ['#fbbf24', '#94a3b8', '#d97706'];
  const emojis = ['🥇', '🥈', '🥉'];
  const h = heights[rank - 1] || 60;
  const color = colors[rank - 1] || '#a78bfa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex flex-col items-center"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-xl mb-3"
        style={{
          background: `radial-gradient(circle, ${color}30, ${color}10)`,
          border: `2px solid ${color}40`,
          boxShadow: `0 0 20px ${color}30`,
        }}
      >
        {entry.name[0]}
      </div>
      <div className="text-white text-sm mb-0.5 text-center" style={{ fontWeight: 700 }}>
        {entry.name}
      </div>
      <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{entry.tag}</div>
      <div className="text-sm mb-3" style={{ color, fontWeight: 800 }}>{entry.totalScore}pt</div>
      <div
        className="w-24 rounded-t-xl flex items-end justify-center pb-2"
        style={{ height: h, background: `linear-gradient(to top, ${color}20, ${color}08)`, border: `1px solid ${color}20` }}
      >
        <span className="text-2xl">{emojis[rank - 1]}</span>
      </div>
    </motion.div>
  );
}

export function RankingsPage() {
  const [rankings, setRankings] = useState<GlobalRankingEntry[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState('all');
  const [userTag, setUserTag] = useState('');
  const [activeView, setActiveView] = useState<'global' | 'hackathon'>('global');
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    const load = () => {
      const data = getStorage();
      setRankings(getGlobalRankings());
      setHackathons(data.hackathons);
      setLeaderboards(data.leaderboards);
      setUserTag(data.userProfile.tag);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  // 종료된 대회만 필터
  const endedHackathons = hackathons.filter(h => h.status === 'ended');

  // 연도 목록 (startDate 기준, 내림차순)
  const years = Array.from(
    new Set(endedHackathons.map(h => h.startDate.slice(0, 4)))
  ).sort((a, b) => Number(b) - Number(a));

  // 선택된 연도에 해당하는 월 목록 (오름차순)
  const months = selectedYear
    ? Array.from(
        new Set(
          endedHackathons
            .filter(h => h.startDate.startsWith(selectedYear))
            .map(h => h.startDate.slice(5, 7))
        )
      ).sort((a, b) => Number(a) - Number(b))
    : [];

  // 선택된 연/월에 해당하는 대회 목록
  const filteredEndedHackathons = selectedYear && selectedMonth
    ? endedHackathons.filter(h =>
        h.startDate.startsWith(`${selectedYear}-${selectedMonth}`)
      )
    : [];

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth('');
    setSelectedHackathon('');
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedHackathon('');
  };

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const hackathonLeaderboard = leaderboards
    .filter(l => l.hackathonSlug === selectedHackathon && l.rank !== 999)
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={20} className="text-violet-400" />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>랭킹</span>
        </div>
        <h1 className="text-3xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          글로벌 랭킹
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          해커톤 성적 기반 활동 점수 (성적 상위 3개 대회 합산)
        </p>
      </motion.div>

      {/* View Switcher */}
      <div className="flex gap-2 mb-8">
        {(['global', 'hackathon'] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className="px-5 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: activeView === v ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${activeView === v ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: activeView === v ? '#a78bfa' : 'rgba(255,255,255,0.6)',
              fontWeight: activeView === v ? 600 : 400,
            }}
          >
            {v === 'global' ? '🌐 전체 랭킹' : '🏆 해커톤 별 순위'}
          </button>
        ))}

        {activeView === 'global' && (
          <div className="ml-auto flex gap-2">
            {RANKING_PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className="px-3 py-2 rounded-xl text-xs transition-all"
                style={{
                  background: period === value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${period === value ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  color: period === value ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeView === 'global' ? (
        <>
          {/* Score Formula - 위로 이동 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-start gap-2">
              <Zap size={14} className="text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-white mb-1" style={{ fontWeight: 600 }}>점수 계산 방식</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  대회별 점수 = √(총 팀 수) ÷ √(내 순위) × 100 · 성적 상위 3개 대회 합산 적용
                </p>
              </div>
            </div>
          </motion.div>

          {/* Podium */}
          {top3.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center items-end gap-6 mb-12"
            >
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                return entry ? <PodiumCard key={entry.tag} entry={entry} rank={actualRank} /> : null;
              })}
            </motion.div>
          )}

          {/* Rankings Table */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-6 py-4" style={{ background: 'rgba(124,58,237,0.12)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-12 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span className="col-span-1">순위</span>
                <span className="col-span-5">참가자</span>
                <span className="col-span-2 text-center">참가 수</span>
                <span className="col-span-2 text-center">최고 순위</span>
                <span className="col-span-2 text-right">점수</span>
              </div>
            </div>
            {rankings.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)' }}>
                <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                <p>아직 집계된 랭킹이 없어요</p>
              </div>
            ) : (
              rankings.map((entry, i) => {
                const isMe = entry.tag === userTag;
                return (
                  <motion.div
                    key={entry.tag}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="px-6 py-4 grid grid-cols-12 items-center transition-colors"
                    style={{
                      background: isMe ? 'rgba(124,58,237,0.12)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="col-span-1">
                      <span className="text-sm" style={{ color: i < 3 ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontWeight: i < 3 ? 700 : 400 }}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                        style={{
                          background: isMe ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)',
                          color: isMe ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                          fontWeight: 700,
                        }}
                      >
                        {entry.name[0]}
                      </div>
                      <div>
                        <div className="text-sm text-white flex items-center gap-2" style={{ fontWeight: isMe ? 700 : 500 }}>
                          {entry.name}
                          {isMe && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa' }}>나</span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{entry.tag}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {entry.hackathonCount}회
                    </div>
                    <div className="col-span-2 text-center text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {entry.bestRank === 999 ? '-' : `${entry.bestRank}위`}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm" style={{ color: i < 3 ? '#fbbf24' : '#a78bfa', fontWeight: 700 }}>
                        {entry.totalScore}pt
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Hackathon Leaderboard */
        <div>
          {/* 연도 → 월 → 대회 단계 선택 */}
          <div className="mb-6 space-y-3">
            <label className="block text-sm text-white mb-1" style={{ fontWeight: 600 }}>해커톤 선택 (대회 시작일)</label>

            {/* 연도 선택 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.45)', minWidth: 28 }}>연도</span>
              {years.length === 0 ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>종료된 대회가 없습니다</span>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {years.map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className="px-4 py-2 rounded-xl text-sm transition-all"
                      style={{
                        background: selectedYear === year ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${selectedYear === year ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: selectedYear === year ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
                        fontWeight: selectedYear === year ? 700 : 400,
                      }}
                    >
                      {year}년
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 월 선택 — 연도 선택 후 활성화 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs shrink-0" style={{ color: selectedYear ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', minWidth: 28 }}>월</span>
              {!selectedYear ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>연도를 먼저 선택해주세요</span>
              ) : months.length === 0 ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>해당 연도의 대회가 없습니다</span>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {months.map(month => (
                    <button
                      key={month}
                      onClick={() => handleMonthChange(month)}
                      className="px-4 py-2 rounded-xl text-sm transition-all"
                      style={{
                        background: selectedMonth === month ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${selectedMonth === month ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: selectedMonth === month ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
                        fontWeight: selectedMonth === month ? 700 : 400,
                      }}
                    >
                      {Number(month)}월
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 대회 선택 — 연도+월 선택 후 활성화 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs shrink-0" style={{ color: selectedMonth ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', minWidth: 28 }}>대회</span>
              {!selectedYear || !selectedMonth ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>연도와 월을 먼저 선택해주세요</span>
              ) : filteredEndedHackathons.length === 0 ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>해당 기간의 대회가 없습니다</span>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {filteredEndedHackathons.map(h => (
                    <button
                      key={h.slug}
                      onClick={() => setSelectedHackathon(h.slug)}
                      className="px-4 py-2 rounded-xl text-sm transition-all text-left"
                      style={{
                        background: selectedHackathon === h.slug ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${selectedHackathon === h.slug ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        color: selectedHackathon === h.slug ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
                        fontWeight: selectedHackathon === h.slug ? 700 : 400,
                      }}
                    >
                      {h.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 대회 미선택 안내 */}
          {!selectedHackathon ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>연도 · 월 · 대회를 순서대로 선택해주세요.</p>
            </div>
          ) : hackathonLeaderboard.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>이 해커톤의 결과가 아직 없어요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hackathonLeaderboard.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-5 rounded-2xl"
                  style={{
                    background: entry.rank <= 3 ? 'rgba(234,179,8,0.06)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${entry.rank <= 3 ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="text-2xl w-10 text-center">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm" style={{ fontWeight: 700 }}>{entry.teamName}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Users size={11} />
                      {entry.memberNames.join(', ')}
                    </div>
                  </div>
                  <div className="text-lg" style={{ fontWeight: 800, color: entry.rank <= 3 ? '#fbbf24' : '#a78bfa' }}>
                    {entry.score > 0 ? `${entry.score}점` : '심사 중'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}