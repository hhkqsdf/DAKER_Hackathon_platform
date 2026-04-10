import { Link } from 'react-router';
import { Search, Filter, Calendar, Users, Trophy, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { getStorage, getActualParticipantCount, Hackathon } from '../../lib/storage';
import { STATUS_CONFIG } from '../../lib/constants';

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'ongoing', label: '진행중' },
  { value: 'upcoming', label: '예정' },
  { value: 'ended', label: '종료' },
];

function HackathonCard({ hackathon, index }: { hackathon: Hackathon; index: number }) {
  const status = STATUS_CONFIG[hackathon.status];
  const daysLeft = Math.max(0, Math.ceil((new Date(hackathon.endDate).getTime() - Date.now()) / 86400000));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="h-full"
    >
      <Link
        to={`/hackathons/${hackathon.slug}`}
        className="group flex flex-col h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      >
        {/* Header: Status badge + Prize */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0 ${status.bg} ${status.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${hackathon.status === 'ongoing' ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
          <div className="text-right shrink-0">
            <div className="text-violet-400 text-sm" style={{ fontWeight: 700 }}>{hackathon.totalPrize}</div>
            {hackathon.status === 'ongoing' && (
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>D-{daysLeft}</div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white text-base mb-2" style={{ fontWeight: 700 }}>{hackathon.title}</h3>

        {/* Description - 2줄 고정 */}
        <p className="text-sm mb-3 line-clamp-2 flex-none" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          {hackathon.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4 flex-1 content-start">
          {hackathon.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-lg text-xs self-start"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer - 항상 하단 고정 */}
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* 날짜 */}
          <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Calendar size={11} className="shrink-0" />
            <span>{hackathon.startDate}</span>
            <span>~</span>
            <span>{hackathon.endDate}</span>
          </div>
          {/* 참가자 수 + 자세히 보기 */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <Users size={11} />
              {getActualParticipantCount(hackathon.slug)}명 참가
            </span>
            <span className="flex items-center gap-1 text-xs text-violet-400 group-hover:gap-2 transition-all">
              자세히 보기
              <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = () => {
      const { hackathons } = getStorage();
      setHackathons(hackathons);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const filtered = hackathons.filter(h => {
    const matchSearch =
      !search ||
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const order = { ongoing: 0, upcoming: 1, ended: 2 };
    return order[a.status] - order[b.status];
  });

  const ongoingCount = hackathons.filter(h => h.status === 'ongoing').length;
  const upcomingCount = hackathons.filter(h => h.status === 'upcoming').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-violet-400" />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>해커톤 탐색</span>
        </div>
        <h1 className="text-3xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          해커톤 목록
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {ongoingCount}개 진행 중 · {upcomingCount}개 예정
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            type="text"
            placeholder="해커톤 이름 또는 태그로 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className="px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
              style={{
                background: statusFilter === value ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${statusFilter === value ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: statusFilter === value ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                fontWeight: statusFilter === value ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <Filter size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg" style={{ fontWeight: 600 }}>검색 결과가 없어요</p>
          <p className="text-sm mt-2">다른 키워드로 검색해보세요.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filtered.map((h, i) => (
            <HackathonCard key={h.slug} hackathon={h} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}