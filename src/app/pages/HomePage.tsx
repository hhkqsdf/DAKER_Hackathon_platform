import { Link } from 'react-router';
import { Zap, Users, Trophy, ArrowRight, Calendar, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { getStorage, Hackathon } from '../../lib/storage';
import { STATUS_CONFIG } from '../../lib/constants';

const FEATURE_CARDS = [
  {
    href: '/hackathons',
    icon: Zap,
    title: '해커톤 탐색',
    desc: '진행 중인 해커톤을 발견하고 내 역량에 맞는 대회에 도전하세요.',
    gradient: 'from-violet-600 to-violet-800',
    glow: 'rgba(124,58,237,0.4)',
  },
  {
    href: '/camp',
    icon: Users,
    title: '팀 찾기',
    desc: '지능형 매칭 알고리즘이 내 기술 스택을 분석해 최적의 팀을 추천해드립니다.',
    gradient: 'from-indigo-600 to-indigo-800',
    glow: 'rgba(79,70,229,0.4)',
  },
  {
    href: '/rankings',
    icon: Trophy,
    title: '랭킹 확인',
    desc: '전체 참가자의 활동 점수와 해커톤 성과를 한 눈에 확인하세요.',
    gradient: 'from-purple-600 to-purple-800',
    glow: 'rgba(147,51,234,0.4)',
  },
];

function HackathonCard({ hackathon, index }: { hackathon: Hackathon; index: number }) {
  const status = STATUS_CONFIG[hackathon.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="h-full"
    >
      <Link
        to={`/hackathons/${hackathon.slug}`}
        className="flex flex-col h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      >
        {/* Header: Status + Prize */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${hackathon.status === 'ongoing' ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
          <span className="text-violet-400 text-xs shrink-0" style={{ fontWeight: 700 }}>{hackathon.totalPrize}</span>
        </div>

        {/* Title */}
        <h3 className="text-base text-white mb-2 line-clamp-2" style={{ fontWeight: 600 }}>{hackathon.title}</h3>

        {/* Description */}
        <p className="text-sm mb-3 line-clamp-2 flex-1" style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{hackathon.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {hackathon.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-xs"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Calendar size={10} className="shrink-0" />
            <span>{hackathon.endDate}까지</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Users size={10} />
            <span>{hackathon.participantCount}명 참가</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomePage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  useEffect(() => {
    const load = () => {
      const { hackathons } = getStorage();
      setHackathons(
        hackathons
          .filter(h => h.status !== 'ended')
          .sort((a, b) => {
            const order: Record<string, number> = { ongoing: 0, upcoming: 1, ended: 2 };
            return (order[a.status] ?? 2) - (order[b.status] ?? 2);
          })
          .slice(0, 3)
      );
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          <Zap size={13} />
          메이커를 위한 해커톤 성장 플랫폼
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl mb-6 leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          당신의 역량을 증명하고<br />더 큰 가능성을 만나세요
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg max-w-xl mx-auto mb-10"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          모든 해커톤의 과정을 데이터로 자산화하세요.<br />당신의 메이커 여정에 가속도를 더해드립니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/hackathons"
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
          >
            해커톤 둘러보기
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/camp"
            className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{
              color: '#a78bfa',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            <Users size={15} />
            팀 찾기
          </Link>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
        {FEATURE_CARDS.map(({ href, icon: Icon, title, desc, gradient, glow }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
          >
            <Link
              to={href}
              className="group block p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${glow}`;
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient}`}
                style={{ boxShadow: `0 4px 16px ${glow}` }}
              >
                <Icon size={22} className="text-white" />
              </div>
              <h2 className="text-white mb-2" style={{ fontWeight: 700 }}>
                {title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              <div className="flex items-center gap-1 mt-4 text-sm" style={{ color: '#a78bfa' }}>
                시작하기 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Active Hackathons */}
      {hackathons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              🔥 진행 중인 해커톤
            </h2>
            <Link
              to="/hackathons"
              className="flex items-center gap-1 text-sm transition-colors"
              style={{ color: '#a78bfa' }}
            >
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {hackathons.map((h, i) => (
              <HackathonCard key={h.slug} hackathon={h} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 rounded-2xl p-6 grid grid-cols-3 gap-4 text-center"
        style={{
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        {[
          { value: '5+', label: '해커톤' },
          { value: '800+', label: '참가자' },
          { value: '₩50M+', label: '총 상금' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div
              className="text-3xl mb-1"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#a78bfa' }}
            >
              {value}
            </div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}