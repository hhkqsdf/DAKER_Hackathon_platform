import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Calendar, Users, Trophy, FileText, Map, Star, Send,
  BarChart3, CheckCircle, Clock, AlertCircle, Upload, ExternalLink,
  ChevronRight, Zap, X, User, Paperclip, Trash2, Lock,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import {
  getStorage, Hackathon, LeaderboardEntry, Team, Submission,
  registerForHackathon, getUserTeamForHackathon, submitProject, submitPersonalProject, AttachedFile,
} from '../../lib/storage';
import { STATUS_CONFIG } from '../../lib/constants';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

type TabId = 'overview' | 'teams' | 'evaluation' | 'schedule' | 'prize' | 'guidelines' | 'submit' | 'leaderboard';

const TABS: { id: TabId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'overview', label: '개요', icon: Map },
  { id: 'teams', label: '팀', icon: Users },
  { id: 'evaluation', label: '평가', icon: Star },
  { id: 'schedule', label: '일정', icon: Calendar },
  { id: 'prize', label: '상금', icon: Trophy },
  { id: 'guidelines', label: '안내', icon: FileText },
  { id: 'submit', label: '제출', icon: Send },
  { id: 'leaderboard', label: '리더보드', icon: BarChart3 },
];

// ─── Registration Modal ───────────────────────────────────────

function RegistrationModal({
  hackathon,
  onConfirm,
  onCancel,
}: {
  hackathon: Hackathon;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState({ rules: false, ip: false, privacy: false });
  const allChecked = checked.rules && checked.ip && checked.privacy;

  const terms = [
    {
      key: 'rules' as const,
      title: '대회 규칙 및 안내사항 동의',
      desc: '해커톤 참가 규칙, 제출 기준, 일정 등 공식 안내사항을 숙지하고 준수할 것에 동의합니다.',
    },
    {
      key: 'ip' as const,
      title: '저작권 및 지식재산권 정책 동의',
      desc: '제출 프로젝트의 저작권은 팀에 귀속되며, 대회 홍보 목적의 활용에 동의합니다.',
    },
    {
      key: 'privacy' as const,
      title: '개인정보 수집 및 이용 동의',
      desc: '대회 운영을 위한 성명, 연락처 등 최소한의 개인정보 수집 및 이용에 동의합니다.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 12 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0d0d1f', border: '1px solid rgba(124,58,237,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
              >
                <Zap size={15} className="text-white" />
              </div>
              <span className="text-white" style={{ fontWeight: 700 }}>참가 신청 확인</span>
            </div>
            <button onClick={onCancel} style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X size={18} />
            </button>
          </div>
          <p className="text-xs mt-2 ml-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {hackathon.title}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            아래 항목을 확인하고 동의해주세요.
          </p>
          {terms.map(({ key, title, desc }) => (
            <button
              key={key}
              onClick={() => setChecked(p => ({ ...p, [key]: !p[key] }))}
              className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
              style={{
                background: checked[key] ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${checked[key] ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div
                className="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center transition-all"
                style={{
                  background: checked[key] ? '#7c3aed' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${checked[key] ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
                }}
              >
                {checked[key] && <CheckCircle size={12} className="text-white" />}
              </div>
              <div>
                <p className="text-sm text-white" style={{ fontWeight: 600 }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{desc}</p>
              </div>
            </button>
          ))}

          <div
            className="rounded-xl p-4 mt-2"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              위 내용을 모두 확인하고 <span style={{ color: '#a78bfa', fontWeight: 700 }}>{hackathon.title}</span>에<br />
              공식 참가 신청합니다.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            취소
          </button>
          <button
            onClick={allChecked ? onConfirm : undefined}
            className="flex-1 py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: allChecked
                ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: allChecked ? '0 4px 16px rgba(124,58,237,0.4)' : 'none',
              color: allChecked ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: allChecked ? 'pointer' : 'not-allowed',
            }}
          >
            <Zap size={14} />
            신청하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Tab Components ───────────────────────────────────────────

function OverviewTab({ hackathon }: { hackathon: Hackathon }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-white mb-4" style={{ fontWeight: 700 }}>대회 소개</h3>
        {hackathon.longDescription.split('\n\n').map((p, i) => (
          <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>{p}</p>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '주최', value: hackathon.organizer, icon: Star },
          { label: '최대 팀원', value: `${hackathon.maxTeamSize}명`, icon: Users },
          { label: '총 상금', value: hackathon.totalPrize, icon: Trophy },
          { label: '참가자', value: `${hackathon.participantCount}명`, icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <Icon size={18} className="mx-auto mb-2 text-violet-400" />
            <div className="text-white text-sm mb-0.5" style={{ fontWeight: 700 }}>{value}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-white mb-4" style={{ fontWeight: 700 }}>제출 요구사항</h3>
        <ul className="space-y-2">
          {hackathon.submissionRequirements.map((req, i) => (
            <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-violet-400" />
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TeamsTab({ hackathon }: { hackathon: Hackathon }) {
  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => {
    const load = () => {
      const { teams } = getStorage();
      setTeams(teams.filter(t => t.hackathonSlug === hackathon.slug));
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [hackathon.slug]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white" style={{ fontWeight: 700 }}>참가 팀 ({teams.length}팀)</h3>
        {hackathon.status === 'ongoing' && (
          <Link
            to={`/camp?hackathon=${hackathon.slug}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
            }}
          >
            <Users size={14} />
            이 해커톤 팀 보기/생성
          </Link>
        )}
      </div>
      {teams.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>아직 팀이 없어요. 첫 번째 팀을 만들어 보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <Link
              key={team.id}
              to={`/camp?hackathon=${hackathon.slug}`}
              className="block rounded-xl p-5 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>{team.teamName}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: team.isOpen ? 'rgba(52,211,153,0.15)' : 'rgba(100,116,139,0.15)',
                    color: team.isOpen ? '#34d399' : '#94a3b8',
                    border: `1px solid ${team.isOpen ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.3)'}`,
                  }}
                >
                  {team.isOpen ? '모집중' : '마감'}
                </span>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{team.intro}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <Users size={11} />
                {team.members.length}/{hackathon.maxTeamSize}명
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EvaluationTab({ hackathon }: { hackathon: Hackathon }) {
  const radarData = hackathon.evaluationCriteria
    .filter((c, idx, arr) => arr.findIndex(x => x.name === c.name) === idx)
    .map(c => ({
      subject: c.name,
      weight: c.weight,
      fullMark: 40,
    }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="text-white mb-4" style={{ fontWeight: 700 }}>평가 기준</h3>
        <div className="space-y-4">
          {hackathon.evaluationCriteria.map((c, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-white" style={{ fontWeight: 600 }}>{c.name}</span>
                <span className="text-sm text-violet-400" style={{ fontWeight: 700 }}>{c.weight}%</span>
              </div>
              <div className="h-2 rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.weight}%` }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{c.description}</p>
            </div>
          ))}
        </div>
      </div>
      {radarData.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="text-white mb-4" style={{ fontWeight: 700 }}>역량 분포 시각화</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 40]} tick={false} axisLine={false} />
              <Radar name="weight" dataKey="weight" stroke="#7c3aed" fill="rgba(124,58,237,0.3)" fillOpacity={0.6} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ hackathon }: { hackathon: Hackathon }) {
  const today = new Date();
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-white mb-6" style={{ fontWeight: 700 }}>진행 일정</h3>
      <div className="relative">
        <div
          className="absolute left-5 top-3 bottom-3 w-0.5"
          style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.6), rgba(124,58,237,0.15))' }}
        />
        <div className="space-y-7">
          {hackathon.schedule.map((item, i) => {
            const date = new Date(item.date);
            const isPast = date < today;
            const isCurrent = Math.abs(date.getTime() - today.getTime()) < 86400000 * 7;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative flex items-start gap-4 pl-12"
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full -translate-x-1/2 border-2 shrink-0"
                  style={{
                    left: '21px',
                    background: isPast ? '#7c3aed' : isCurrent ? '#a78bfa' : '#0f0f1f',
                    borderColor: isPast ? '#7c3aed' : isCurrent ? '#a78bfa' : 'rgba(124,58,237,0.4)',
                    boxShadow: isCurrent ? '0 0 14px rgba(167,139,250,0.7)' : isPast ? '0 0 6px rgba(124,58,237,0.35)' : 'none',
                    zIndex: 1,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.date}</span>
                    {item.milestone && (
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                        마일스톤
                      </span>
                    )}
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-xs animate-pulse" style={{ background: 'rgba(167,139,250,0.2)', color: '#c4b5fd' }}>
                        진행 중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-white mb-0.5" style={{ fontWeight: 600 }}>{item.title}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.description}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrizeTab({ hackathon }: { hackathon: Hackathon }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))', border: '1px solid rgba(124,58,237,0.25)' }}>
        <Trophy size={40} className="mx-auto mb-3 text-yellow-400" />
        <div className="text-3xl mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#a78bfa' }}>
          {hackathon.totalPrize}
        </div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>총 상금</div>
      </div>
      <div className="space-y-3">
        {hackathon.prizeDetails.map((prize, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{
              background: i === 0 ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === 0 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
            <div className="flex-1">
              <div className="text-white text-sm" style={{ fontWeight: 700 }}>{prize.rank}</div>
              {prize.description && (
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{prize.description}</div>
              )}
            </div>
            <div className="text-lg" style={{ fontWeight: 800, color: i === 0 ? '#fbbf24' : '#a78bfa' }}>
              {prize.amount}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GuidelinesTab({ hackathon }: { hackathon: Hackathon }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-white mb-5" style={{ fontWeight: 700 }}>참가 안내 및 규칙</h3>
      <div className="space-y-3">
        {hackathon.guidelines.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa', fontWeight: 700 }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{g}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Submit Tab ───────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄';
  if (type.includes('zip') || type.includes('compressed') || type.includes('x-tar')) return '📦';
  if (type.includes('csv') || type.includes('spreadsheet') || type.includes('excel')) return '📊';
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  return '📎';
}

function SubmitTab({
  hackathon,
  userTeam,
  isRegistered,
}: {
  hackathon: Hackathon;
  userTeam: Team | null;
  isRegistered: boolean;
}) {
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [personalSub, setPersonalSub] = useState<Submission | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userTeam) {
      const { userProfile } = getStorage();
      const personal = userProfile.personalData[hackathon.slug]?.personalSubmission;
      if (personal) {
        setPersonalSub(personal);
        setNotes(personal.notes || '');
        setFileUrl(personal.fileUrl || '');
        setAttachedFiles(personal.attachedFiles || []);
      }
    } else if (userTeam.submission) {
      setNotes(userTeam.submission.notes || '');
      setFileUrl(userTeam.submission.fileUrl || '');
      setAttachedFiles(userTeam.submission.attachedFiles || []);
    }
  }, [userTeam, hackathon.slug]);

  const hasSubmitted = userTeam ? !!userTeam.submission : !!personalSub;
  const isEnded = hackathon.status === 'ended';
  const isUpcoming = hackathon.status === 'upcoming';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: AttachedFile[] = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onFinalSubmitClick = () => {
    if (!notes.trim()) {
      toast.error('프로젝트 설명을 입력해주세요.');
      return;
    }
    if (userTeam && !userTeam.isTeamLocked) {
      toast.error('팀 대시보드에서 팀 확정 후 제출할 수 있어요.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    const payload = {
      notes,
      fileUrl: fileUrl || undefined,
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    if (userTeam) {
      submitProject(userTeam.id, payload);
    } else {
      submitPersonalProject(hackathon.slug, payload);
      setPersonalSub({ ...payload, submittedAt: new Date().toISOString() });
    }
    toast.success('🚀 프로젝트가 최종 제출되었습니다!');
    setSubmitting(false);
  };

  if (!isRegistered) {
    return (
      <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <AlertCircle size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <p className="text-white mb-2" style={{ fontWeight: 600 }}>참가 등록이 필요해요</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>해커톤에 먼저 참가 신청을 해주세요.</p>
      </div>
    );
  }

  if (isUpcoming) {
    return (
      <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Clock size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <p className="text-white mb-2" style={{ fontWeight: 600 }}>아직 시작 전이에요</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>해커톤이 시작된 후 제출할 수 있습니다.</p>
      </div>
    );
  }

  const submittedData = userTeam ? userTeam.submission : personalSub;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <h3 className="text-white mb-2" style={{ fontWeight: 700 }}>제출 가이드</h3>
        <ul className="space-y-1.5">
          {hackathon.submissionRequirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <CheckCircle size={13} className="mt-0.5 shrink-0 text-violet-400" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      {!userTeam && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          <User size={16} className="text-indigo-400 shrink-0" />
          <div>
            <p className="text-sm text-white" style={{ fontWeight: 600 }}>개인 참가자 제출 모드</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              팀 없이 개인 참가자로 프로젝트를 제출합니다.{' '}
              <Link to={`/camp?hackathon=${hackathon.slug}`} className="text-indigo-400 underline">팀 합류하기</Link>
            </p>
          </div>
        </div>
      )}

      {hasSubmitted && submittedData ? (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <span className="text-white" style={{ fontWeight: 700 }}>제출 완료!</span>
            <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date(submittedData.submittedAt).toLocaleString('ko-KR')}
            </span>
          </div>
          {submittedData.notes && (
            <p className="text-sm mb-3 p-3 rounded-xl" style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)' }}>
              {submittedData.notes}
            </p>
          )}
          {submittedData.fileUrl && (
            <a
              href={submittedData.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-sm text-violet-400 mb-2"
            >
              <ExternalLink size={13} />
              {submittedData.fileUrl}
            </a>
          )}
          {submittedData.attachedFiles && submittedData.attachedFiles.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {submittedData.attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                  <span>{getFileIcon(f.type)}</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>{formatFileSize(f.size)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 flex items-center gap-2 font-medium">
              <ShieldCheck size={14} />
              최종 제출이 완료되어 팀 구성을 수정할 수 없는 상태입니다.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <label className="block text-sm text-white mb-2" style={{ fontWeight: 600 }}>
              프로젝트 설명 <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="프로젝트 개요, 주요 기능, 사용 기술 등을 간략히 설명해주세요."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-white mb-2" style={{ fontWeight: 600 }}>
              링크 URL <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(GitHub, 데모, 발표자료 등)</span>
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={e => setFileUrl(e.target.value)}
              placeholder="https://github.com/your-repo"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-white mb-2" style={{ fontWeight: 600 }}>
              파일 첨부 <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>ZIP · PDF · CSV · APK · IPA · 기타</span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl p-5 flex flex-col items-center gap-2 transition-all"
              style={{
                background: 'rgba(124,58,237,0.06)',
                border: '2px dashed rgba(124,58,237,0.3)',
                color: 'rgba(255,255,255,0.5)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.6)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)';
              }}
            >
              <Paperclip size={20} className="text-violet-400" />
              <span className="text-sm">클릭하여 파일 선택</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                .zip .pdf .csv .apk .ipa .docx .pptx .tar.gz 지원
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,.pdf,.csv,.apk,.ipa,.docx,.pptx,.tar.gz,.tar,.gz,.xlsx,.7z"
              onChange={handleFileChange}
              className="hidden"
            />
            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}
                  >
                    <span className="text-base shrink-0">{getFileIcon(f.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate text-white" style={{ fontWeight: 600 }}>{f.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatFileSize(f.size)}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>준비완료</span>
                    <button onClick={() => removeFile(i)} className="p-1 rounded-lg shrink-0 transition-all" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[11px] text-violet-400/70 flex items-start gap-1.5 font-medium">
              <span className="shrink-0">•</span>
              <span>최종 제출을 완료하면 팀 수정이 불가능합니다.</span>
            </p>
          </div>

          <button
            onClick={onFinalSubmitClick}
            disabled={submitting || isEnded}
            className="w-full py-4 rounded-xl text-sm text-white font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: isEnded ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: isEnded ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              opacity: submitting ? 0.7 : 1,
              cursor: isEnded || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />제출 중...</>
            ) : isEnded ? (
              <><Lock size={14} />해커톤이 종료되었습니다</>
            ) : (
              <><Upload size={15} />최종 제출하기</>
            )}
          </button>
        </div>
      )}

      <AnimatePresence>
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center bg-[#0f0f1f] border border-violet-500/30 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-5 border border-violet-500/30">
                <AlertTriangle size={32} className="text-violet-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">최종 제출 재확인</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8 whitespace-nowrap">
                <span className="text-violet-400 font-bold">최종 제출을 하면 팀 수정이 더 이상 불가능합니다.</span><br />
                정말 제출하시겠습니까?
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleConfirmedSubmit} className="w-full py-4 rounded-2xl text-white font-bold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-900/20 active:scale-95 transition-transform">
                  네, 최종 제출합니다
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full py-3 rounded-2xl text-white/40 text-sm font-medium hover:text-white/60 transition-colors">
                  돌아가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeaderboardTab({ hackathon, leaderboards }: { hackathon: Hackathon; leaderboards: LeaderboardEntry[] }) {
  const entries = leaderboards
    .filter(l => l.hackathonSlug === hackathon.slug && l.rank !== 999)
    .sort((a, b) => a.rank - b.rank);
  const unranked = leaderboards.filter(l => l.hackathonSlug === hackathon.slug && l.rank === 999);

  if (hackathon.status !== 'ended' && entries.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Clock size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <p className="text-white mb-1" style={{ fontWeight: 600 }}>아직 결과가 없어요</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>해커톤 종료 후 순위가 공개됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white" style={{ fontWeight: 700 }}>최종 순위</h3>
        {unranked.length > 0 && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>제출 팀: {unranked.length}팀 (심사 중)</span>}
      </div>
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="flex items-center gap-4 p-5 rounded-2xl"
          style={{
            background: entry.rank === 1 ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${entry.rank === 1 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <div className="text-2xl w-10 text-center">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}</div>
          <div className="flex-1">
            <div className="text-white text-sm" style={{ fontWeight: 700 }}>{entry.teamName}</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{entry.memberNames.join(', ')}</div>
          </div>
          <div className="text-right"><div className="text-lg" style={{ fontWeight: 800, color: entry.rank === 1 ? '#fbbf24' : '#a78bfa' }}>{entry.score}점</div></div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export function HackathonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const load = () => {
      if (!slug) return;
      const { hackathons, leaderboards: lb, userProfile } = getStorage();
      const found = hackathons.find(h => h.slug === slug);
      setHackathon(found || null);
      setLeaderboards(lb);
      setUserTeam(getUserTeamForHackathon(slug));
      setIsRegistered(userProfile.joinedHackathons.includes(slug));
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [slug]);

  const handleRegisterConfirm = async () => {
    if (!slug) return;
    setShowRegisterModal(false);
    setRegistering(true);
    await new Promise(r => setTimeout(r, 600));
    registerForHackathon(slug);
    toast.success('✅ 해커톤 참가 신청 완료!');
    setRegistering(false);
  };

  const handleGoToDashboard = () => {
    if (!slug) return;
    if (userTeam) {
      navigate(`/teams/${userTeam.id}`);
    } else {
      navigate(`/personal-dashboard/${slug}`);
    }
  };

  if (!hackathon) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <AlertCircle size={40} className="mx-auto mb-3" />
          <p>해커톤을 찾을 수 없어요.</p>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[hackathon.status];
  const daysLeft = Math.max(0, Math.ceil((new Date(hackathon.endDate).getTime() - Date.now()) / 86400000));
  const canRegister = hackathon.status === 'ongoing';

  return (
    <>
      <AnimatePresence>
        {showRegisterModal && (
          <RegistrationModal
            hackathon={hackathon}
            onConfirm={handleRegisterConfirm}
            onCancel={() => setShowRegisterModal(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/hackathons')}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          <ArrowLeft size={15} />
          해커톤 목록으로
        </button>

        <div className="rounded-3xl p-8 mb-6" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mb-4 ${status.bg} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${hackathon.status === 'ongoing' ? 'animate-pulse' : ''}`} />
                {status.label} {hackathon.status === 'ongoing' && ` · D-${daysLeft}`}
              </span>
              <h1 className="text-2xl sm:text-3xl text-white mb-3" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{hackathon.title}</h1>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{hackathon.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {hackathon.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-lg text-xs" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
              <div className="text-2xl text-violet-400" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{hackathon.totalPrize}</div>
              {isRegistered ? (
                <button onClick={handleGoToDashboard} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all" style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                  <ChevronRight size={15} />{userTeam ? '팀 대시보드' : '개인 대시보드'}
                </button>
              ) : canRegister ? (
                <button onClick={() => setShowRegisterModal(true)} disabled={registering} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white transition-all" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', opacity: registering ? 0.7 : 1, boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
                  {registering ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={15} />}
                  참가 신청
                </button>
              ) : hackathon.status === 'upcoming' ? (
                <span className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', color: '#fbbf24' }}><Clock size={14} />곧 시작 예정</span>
              ) : (
                <span className="px-5 py-2.5 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>종료된 해커톤</span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200"
                style={{
                  background: activeTab === id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeTab === id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: activeTab === id ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                  fontWeight: activeTab === id ? 600 : 400,
                }}
              >
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {activeTab === 'overview' && <OverviewTab hackathon={hackathon} />}
            {activeTab === 'teams' && <TeamsTab hackathon={hackathon} />}
            {activeTab === 'evaluation' && <EvaluationTab hackathon={hackathon} />}
            {activeTab === 'schedule' && <ScheduleTab hackathon={hackathon} />}
            {activeTab === 'prize' && <PrizeTab hackathon={hackathon} />}
            {activeTab === 'guidelines' && <GuidelinesTab hackathon={hackathon} />}
            {activeTab === 'submit' && <SubmitTab hackathon={hackathon} userTeam={userTeam} isRegistered={isRegistered} />}
            {activeTab === 'leaderboard' && <LeaderboardTab hackathon={hackathon} leaderboards={leaderboards} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}