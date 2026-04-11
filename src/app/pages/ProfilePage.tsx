import {
  User, Edit3, Save, X, ChevronRight, Zap, Trophy, Users,
  Send, Clock, CheckCircle, XCircle, MessageSquare, Briefcase, AlertTriangle,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';
import {
  getStorage, updateUserProfile, UserProfile, TechStack,
  getUserTeamForHackathon, isFreeAgent,
  getAllUserApplications, UserApplicationRecord, cancelApplication,
  getAllPendingInvitations, PendingInvitationRecord, acceptInvitation, rejectInvitation,
} from '../../lib/storage';
import { TECH_CATEGORIES, SKILLS_BY_CATEGORY, CATEGORY_COLORS, STATUS_CONFIG } from '../../lib/constants';
import type { TechCategory } from '../../lib/constants';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import { calculateXP, getTierFromXP, TIERS, getUserAwards, getUserTotalHackathonCount, RANK_LABELS } from '../../lib/tier';
import { TierBadge, TierIcon } from '../components/TierIcon';


// ─── TechStackEditor ──────────────────────────────────────────

function TechStackEditor({
  techStack,
  onChange,
}: {
  techStack: TechStack[];
  onChange: (ts: TechStack[]) => void;
}) {
  const addCategory = (cat: string) => {
    if (techStack.some(t => t.category === cat)) return;
    onChange([...techStack, { category: cat, skills: [] }]);
  };

  const removeCategory = (cat: string) => {
    onChange(techStack.filter(t => t.category !== cat));
  };

  const toggleSkill = (cat: string, skill: string) => {
    const updated = techStack.map(t => {
      if (t.category !== cat) return t;
      const has = t.skills.includes(skill);
      return { ...t, skills: has ? t.skills.filter(s => s !== skill) : [...t.skills, skill] };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>포지션 추가</p>
        <div className="flex flex-wrap gap-2">
          {TECH_CATEGORIES.map(cat => {
            const active = techStack.some(t => t.category === cat);
            const colors = CATEGORY_COLORS[cat as TechCategory];
            return (
              <button
                key={cat}
                onClick={() => active ? removeCategory(cat) : addCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${active ? `${colors.bg} ${colors.text}` : ''}`}
                style={{
                  background: active ? undefined : 'rgba(255,255,255,0.06)',
                  border: active ? `1px solid` : '1px solid rgba(255,255,255,0.1)',
                  color: active ? undefined : 'rgba(255,255,255,0.55)',
                }}
              >
                {active ? '✓ ' : '+ '}{cat}
              </button>
            );
          })}
        </div>
      </div>

      {techStack.map(ts => {
        const colors = CATEGORY_COLORS[ts.category as TechCategory] || CATEGORY_COLORS.Frontend;
        const availableSkills = SKILLS_BY_CATEGORY[ts.category as TechCategory] || [];
        return (
          <div
            key={ts.category}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs ${colors.bg} ${colors.text}`} style={{ border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600 }}>
                {ts.category}
              </span>
              <button
                onClick={() => removeCategory(ts.category)}
                className="text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
              >
                <X size={12} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSkills.map(skill => {
                const selected = ts.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(ts.category, skill)}
                    className="px-2.5 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: selected ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                      border: selected ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: selected ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {selected ? '✓ ' : ''}{skill}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Application Status Config ────────────────────────────────

const APP_STATUS_CONFIG = {
  pending: {
    label: '검토 중',
    icon: Clock,
    bg: 'rgba(251,191,36,0.12)',
    color: '#fbbf24',
    border: 'rgba(251,191,36,0.3)',
  },
  accepted: {
    label: '합격',
    icon: CheckCircle,
    bg: 'rgba(52,211,153,0.12)',
    color: '#34d399',
    border: 'rgba(52,211,153,0.3)',
  },
  rejected: {
    label: '미선발',
    icon: XCircle,
    bg: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    border: 'rgba(239,68,68,0.25)',
  },
};

// ─── Application History Section ─────────────────────────────

function CancelConfirmModal({
  teamName,
  onConfirm,
  onCancel,
}: {
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0f0f1f', border: '1px solid rgba(239,68,68,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>지원 취소 확인</h3>
        </div>
        <p className="text-sm mb-5 ml-7 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <span className="text-white" style={{ fontWeight: 600 }}>"{teamName}"</span> 팀에 대한 지원을 취소하시겠습니까?<br />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>이 작업은 되돌릴 수 없습니다.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            돌아가기
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
          >
            지원 취소하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InvitationConfirmModal({
  teamName,
  onConfirm,
  onCancel,
}: {
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0f0f1f', border: '1px solid rgba(59,130,246,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>초대 수락 확인</h3>
        </div>
        <p className="text-sm mb-5 ml-7 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <span className="text-white" style={{ fontWeight: 600 }}>"{teamName}"</span> 팀의 초대를 수락하시겠습니까?<br />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>수락 시 해당 팀의 멤버로 등록됩니다.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            돌아가기
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all flex items-center justify-center gap-1"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}
          >
            <CheckCircle size={14} /> 수락하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RejectConfirmModal({
  teamName,
  onConfirm,
  onCancel,
}: {
  teamName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0f0f1f', border: '1px solid rgba(239,68,68,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>초대 거절 확인</h3>
        </div>
        <p className="text-sm mb-5 ml-7 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
          <span className="text-white" style={{ fontWeight: 600 }}>"{teamName}"</span> 팀의 초대를 거절하시겠습니까?<br />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>거절 후에는 해당 팀의 초대에 다시 응할 수 없습니다.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            돌아가기
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
          >
            거절하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function IncomingInvitationsSection() {
  const [invitations, setInvitations] = useState<PendingInvitationRecord[]>([]);
  const [hackathonMap, setHackathonMap] = useState<Record<string, string>>({});
  const [acceptConfirm, setAcceptConfirm] = useState<{ teamId: string; teamName: string } | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<{ teamId: string; teamName: string } | null>(null);

  const loadData = () => {
    const { hackathons } = getStorage();
    const map: Record<string, string> = {};
    hackathons.forEach(h => { map[h.slug] = h.title; });
    setHackathonMap(map);
    setInvitations(getAllPendingInvitations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleAccept = (teamId: string) => {
    const result = acceptInvitation(teamId);
    setAcceptConfirm(null);

    if (result === 'ok') {
      toast.success('초대를 수락하여 팀에 합류했습니다!');
    } else if (result === 'already_finalized') {
      toast.error('이미 해당 대회의 최종 제출을 완료하여 다른 팀에 합류할 수 없습니다.');
    } else if (result === 'already_in_team') {
      toast.error('이미 해당 대회의 다른 팀에 소속되어 있어 초대를 수락할 수 없습니다.');
    } else {
      toast.error('초대를 수락하는 중 오류가 발생했습니다.');
    }
  };

  const handleReject = (teamId: string) => {
    rejectInvitation(teamId);
    setRejectConfirm(null);
    toast.success('초대를 거절했습니다.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            <Zap size={14} className="text-violet-400" />
          </div>
          <h2 className="text-white" style={{ fontWeight: 700 }}>도착한 초대장</h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
          >
            {invitations.length}건
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {invitations.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(124,58,237,0.1)' }}>
            <Zap size={24} className="mx-auto mb-2 text-violet-400 opacity-20" />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>아직 도착한 초대장이 없습니다.</p>
          </div>
        ) : (
          <AnimatePresence>
            {invitations.map((inv, i) => {
            const hackathonTitle = inv.hackathonSlug ? hackathonMap[inv.hackathonSlug] : null;

            return (
              <motion.div
                key={inv.teamId}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl overflow-hidden p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{ border: `1px solid rgba(124,58,237,0.3)`, background: 'rgba(124,58,237,0.1)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-base truncate" style={{ fontWeight: 700 }}>
                      {inv.teamName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs shrink-0" style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>팀장 초대</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {inv.selectedRole && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={10} />
                        {inv.selectedRole} 합류 요청
                      </span>
                    )}
                    {hackathonTitle && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        · {hackathonTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRejectConfirm({ teamId: inv.teamId, teamName: inv.teamName })}
                    className="px-3 py-2 rounded-xl text-sm transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    거절
                  </button>
                  <button
                    onClick={() => setAcceptConfirm({ teamId: inv.teamId, teamName: inv.teamName })}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                  >
                    <CheckCircle size={14} />
                    수락
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {acceptConfirm && (
          <InvitationConfirmModal
            teamName={acceptConfirm.teamName}
            onConfirm={() => handleAccept(acceptConfirm.teamId)}
            onCancel={() => setAcceptConfirm(null)}
          />
        )}
        {rejectConfirm && (
          <RejectConfirmModal
            teamName={rejectConfirm.teamName}
            onConfirm={() => handleReject(rejectConfirm.teamId)}
            onCancel={() => setRejectConfirm(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ApplicationHistorySection({ applications, loadData }: { applications: UserApplicationRecord[], loadData: () => void }) {
  const [hackathonMap, setHackathonMap] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ teamId: string; teamName: string } | null>(null);

  useEffect(() => {
    const { hackathons } = getStorage();
    const map: Record<string, string> = {};
    hackathons.forEach(h => { map[h.slug] = h.title; });
    setHackathonMap(map);
  }, []);

  const handleCancel = (teamId: string) => {
    cancelApplication(teamId);
    setCancelConfirm(null);
    toast.success('지원이 취소되었습니다.');
    loadData(); // 부모 상태 리프레시
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl p-6"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}
          >
            <Send size={14} className="text-yellow-400" />
          </div>
          <h2 className="text-white" style={{ fontWeight: 700 }}>팀 지원 내역</h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
          >
            {applications.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              <Clock size={10} />
              검토 중 {pendingCount}
            </span>
          )}
          {acceptedCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
              <CheckCircle size={10} />
              합격 {acceptedCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Send size={24} className="mx-auto mb-2 text-white opacity-20" />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>아직 지원한 팀이 없습니다.</p>
          </div>
        ) : (
          <AnimatePresence>
            {applications.map((app, i) => {
              const cfg = APP_STATUS_CONFIG[app.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === app.teamId;
              const hackathonTitle = app.hackathonSlug ? hackathonMap[app.hackathonSlug] : null;

              return (
                <motion.div
                  key={app.teamId}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <StatusIcon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white text-sm truncate" style={{ fontWeight: 700 }}>{app.teamName}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs shrink-0" style={{ background: 'rgba(0,0,0,0.25)', color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {app.selectedRole && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                            <Briefcase size={10} /> {app.selectedRole}
                          </span>
                        )}
                        {hackathonTitle && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>· {hackathonTitle}</span>}
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>· {new Date(app.appliedAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.message && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : app.teamId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{
                            background: isExpanded ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
                            color: isExpanded ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                            border: `1px solid ${isExpanded ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          }}
                        >
                          <MessageSquare size={11} /> 메시지
                        </button>
                      )}
                      {app.status === 'accepted' && (
                        <Link to={`/teams/${app.teamId}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <ChevronRight size={11} /> 팀 이동
                        </Link>
                      )}
                      {app.status === 'pending' && (
                        <button
                          onClick={() => setCancelConfirm({ teamId: app.teamId, teamName: app.teamName })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <XCircle size={11} /> 취소
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && app.message && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-4 pb-4 pt-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          <p className="text-xs mb-1 pt-3" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>보낸 메시지</p>
                          <p className="text-sm leading-relaxed p-3 rounded-xl" style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            {app.message}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {cancelConfirm && (
          <CancelConfirmModal
            teamName={cancelConfirm.teamName}
            onConfirm={() => handleCancel(cancelConfirm.teamId)}
            onCancel={() => setCancelConfirm(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [applications, setApplications] = useState<UserApplicationRecord[]>([]);

  const loadAllData = () => {
    const data = getStorage();
    setProfile(data.userProfile);
    setApplications(getAllUserApplications());
  };

  useEffect(() => {
    loadAllData();
    window.addEventListener('storage', loadAllData);
    return () => window.removeEventListener('storage', loadAllData);
  }, []);

  const startEdit = () => {
    setDraft(profile ? { ...profile, techStack: profile.techStack.map(t => ({ ...t, skills: [...t.skills] })) } : null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!draft) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    updateUserProfile(draft);
    toast.success('✅ 프로필이 저장되었습니다!');
    setSaving(false);
    setEditing(false);
    setDraft(null);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const radarData = (draft || profile).techStack.map(ts => ({
    subject: ts.category,
    skills: ts.skills.length,
    fullMark: 10,
  }));

  const { hackathons } = getStorage();
  const joinedHackathons = hackathons.filter(h => profile.joinedHackathons.includes(h.slug));

  const xpBreakdown = calculateXP(profile.tag);
  const tier = getTierFromXP(xpBreakdown.total);
  const awards = getUserAwards(profile.tag);
  const totalHackathons = getUserTotalHackathonCount(profile.tag);

  const nextTierIdx = TIERS.findIndex(t => t.id === tier.id) + 1;
  const nextTier = TIERS[nextTierIdx] ?? null;
  const xpProgress = nextTier
    ? Math.min(100, Math.round(((xpBreakdown.total - tier.xpMin) / (nextTier.xpMin - tier.xpMin)) * 100))
    : 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <User size={20} className="text-violet-400" />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>내 프로필</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            프로필 관리
          </h1>
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
            >
              <Edit3 size={14} />
              수정하기
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                <X size={14} />
                취소
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Save size={14} />}
                저장
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h2 className="text-white mb-5" style={{ fontWeight: 700 }}>기본 정보</h2>
            {editing && draft ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>이름</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={e => setDraft(p => p ? { ...p, name: e.target.value } : p)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>한 줄 소개</label>
                  <textarea
                    value={draft.bio}
                    onChange={e => setDraft(p => p ? { ...p, bio: e.target.value } : p)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                  {profile.name[0]}
                </div>
                <div>
                  <div className="text-white text-lg mb-0.5" style={{ fontWeight: 700 }}>{profile.name}</div>
                  <div className="text-sm mb-2" style={{ color: '#a78bfa' }}>{profile.tag}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{profile.bio || '소개를 입력해주세요'}</div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white" style={{ fontWeight: 700 }}>기술 스택</h2>
              {(editing ? draft?.techStack : profile.techStack)?.length === 0 && !editing && (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>등록된 스택이 없어요</span>
              )}
            </div>

            {editing && draft ? (
              <TechStackEditor
                techStack={draft.techStack}
                onChange={ts => setDraft(p => p ? { ...p, techStack: ts } : p)}
              />
            ) : profile.techStack.length === 0 ? (
              <div
                className="text-center py-8 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
              >
                <Zap size={28} className="mx-auto mb-2 text-violet-400 opacity-50" />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>기술 스택을 등록하면 지능형 매칭이 활성화됩니다.</p>
                <button
                  onClick={startEdit}
                  className="mt-3 px-4 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
                >
                  + 스택 추가
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.techStack.map(ts => {
                  const colors = CATEGORY_COLORS[ts.category as TechCategory] || CATEGORY_COLORS.Frontend;
                  return (
                    <div key={ts.category}>
                      <span className={`px-2.5 py-1 rounded-lg text-xs mb-2 inline-block ${colors.bg} ${colors.text}`} style={{ fontWeight: 600 }}>
                        {ts.category}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ts.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg text-xs"
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            {skill}
                          </span>
                        ))}
                        {ts.skills.length === 0 && (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>선택된 스킬 없음</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Joined Hackathons */}
          {joinedHackathons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-white mb-5" style={{ fontWeight: 700 }}>참가 중인 해커톤</h2>
              <div className="space-y-3">
                {joinedHackathons.map(h => {
                  const status = STATUS_CONFIG[h.status];
                  const myTeam = getUserTeamForHackathon(h.slug);
                  const myApps = applications.filter(a => a.hackathonSlug === h.slug && a.status === 'pending');
                  const primaryApp = myApps[0];
                  
                  // 최종 제출 여부 확인 (개인 또는 팀)
                  const isSubmitted = !!(profile.personalData[h.slug]?.personalSubmission || myTeam?.isFinalized);
                  const displayStatus = (isSubmitted && h.status === 'ongoing') 
                    ? { label: '최종 제출 완료', bg: 'bg-blue-500/20', text: 'text-blue-400' }
                    : status;

                  return (
                    <div
                      key={h.slug}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div>
                        <div className="text-white text-sm mb-1" style={{ fontWeight: 600 }}>{h.title}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${displayStatus.bg} ${displayStatus.text}`}>{displayStatus.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: myTeam ? 'rgba(52,211,153,0.15)' : primaryApp ? 'rgba(124,58,237,0.15)' : 'rgba(251,191,36,0.15)',
                            color: myTeam ? '#34d399' : primaryApp ? '#a78bfa' : '#fbbf24',
                          }}>
                            {myTeam ? `팀: ${myTeam.teamName}` : primaryApp ? `지원 중: ${primaryApp.teamName}` : 'Free Agent'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (myTeam) navigate(`/teams/${myTeam.id}`);
                          else navigate(`/personal-dashboard/${h.slug}`);
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs transition-all"
                        style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}
                      >
                        대시보드
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Incoming Invitations */}
          <IncomingInvitationsSection />

          {/* Application History */}
          <ApplicationHistorySection applications={applications} loadData={loadAllData} />
        </div>

        {/* Right: Radar Chart & Stats */}
        <div className="space-y-5">
          {/* ── Tier Card ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${tier.bgColor}, rgba(0,0,0,0.3))`,
              border: `1px solid ${tier.borderColor}`,
              boxShadow: `0 0 24px ${tier.glowColor}`,
            }}
          >
            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TierIcon tierId={tier.id} color={tier.color} size={22} />
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>내 티어</span>
              </div>
              <button
                onClick={() => setShowTierModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Info size={11} />
                티어 안내
              </button>
            </div>

            {/* Tier badge */}
            <div className="mb-4">
              <TierBadge
                tierId={tier.id}
                tierName={tier.name}
                color={tier.color}
                bgColor={tier.bgColor}
                borderColor={tier.borderColor}
                size="lg"
              />
              <p
                className="mt-1.5 text-xs"
                style={{ color: tier.color, opacity: 0.7, fontStyle: 'italic' }}
              >
                {tier.description}
              </p>
            </div>

            {/* XP bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {xpBreakdown.total.toLocaleString()} XP
                </span>
                {nextTier && (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {nextTier.xpMin.toLocaleString()} XP → {nextTier.name}
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${xpProgress}%`, background: tier.color }}
                />
              </div>
            </div>

            {/* XP breakdown */}
            <div className="mt-3 space-y-1">
              {xpBreakdown.fromHackathons > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>🏆 해커톤 성과</span>
                  <span style={{ color: tier.color, fontWeight: 600 }}>+{xpBreakdown.fromHackathons} XP</span>
                </div>
              )}
              {xpBreakdown.sincereMsg > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>💬 Sincere Msg</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>+{xpBreakdown.sincereMsg} XP</span>
                </div>
              )}
              {xpBreakdown.matchKing > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>👑 Match King</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>+{xpBreakdown.matchKing} XP</span>
                </div>
              )}
              {xpBreakdown.lateCancelPenalty > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>⚠️ Late Cancel</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>-{xpBreakdown.lateCancelPenalty} XP</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Awards section — 우측 사이드바 */}
          {awards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-yellow-400" />
                <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>수상 내역</h3>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  {awards.length}건
                </span>
              </div>
              <div className="space-y-2">
                {awards.map((award, i) => {
                  const rl = RANK_LABELS[award.rank];
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl"
                      style={{
                        background: award.rank === 1 ? 'rgba(251,191,36,0.08)' : award.rank === 2 ? 'rgba(148,163,184,0.08)' : 'rgba(217,119,6,0.08)',
                        border: `1px solid ${award.rank === 1 ? 'rgba(251,191,36,0.2)' : award.rank === 2 ? 'rgba(148,163,184,0.2)' : 'rgba(217,119,6,0.2)'}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{rl.emoji}</span>
                        <span className="text-xs" style={{ color: rl.color, fontWeight: 700 }}>{rl.label}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>· {award.teamName}</span>
                      </div>
                      <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{award.hackathonTitle}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Radar Chart */}
          {(editing ? draft?.techStack : profile.techStack)!.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h3 className="text-white text-sm mb-4 text-center" style={{ fontWeight: 700 }}>역량 분포</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <Radar name="skills" dataKey="skills" stroke="#7c3aed" fill="rgba(124,58,237,0.3)" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>활동 현황</h3>
            {[
              {
                icon: Zap,
                label: '참가 해커톤',
                value: `${profile.joinedHackathons.length}개`,
              },
              {
                icon: Trophy,
                label: '완주한 대회',
                value: `${totalHackathons}개`,
              },
              {
                icon: Users,
                label: '등록 스택',
                value: `${profile.techStack.length}개 직군`,
              },
              {
                icon: Send,
                label: '팀 지원',
                value: `${getAllUserApplications().length}건`,
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.12)' }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-violet-400" />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                </div>
                <span className="text-sm text-white" style={{ fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </motion.div>

          {/* Quick Nav */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl p-5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>빠른 이동</h3>
            {[
              { to: '/hackathons', label: '해커톤 탐색', icon: Zap },
              { to: '/camp', label: '팀 찾기', icon: Users },
              { to: '/rankings', label: '랭킹 확인', icon: Trophy },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-violet-400" />
                  <span className="text-xs text-white">{label}</span>
                </div>
                <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Tier Explanation Modal ── */}
      <AnimatePresence>
        {showTierModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowTierModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 10 }}
              className="w-full max-w-lg rounded-2xl p-7 overflow-y-auto"
              style={{ background: '#0d0d1f', border: '1px solid rgba(124,58,237,0.35)', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TierIcon tierId={tier.id} color={tier.color} size={22} />
                  <h3 className="text-white" style={{ fontWeight: 700 }}>DAKER XP 티어 시스템</h3>
                </div>
                <button onClick={() => setShowTierModal(false)} style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Philosophy */}
              <div
                className="p-4 rounded-xl mb-5 text-sm leading-relaxed"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: 'rgba(255,255,255,0.7)' }}
              >
                실력은 기본, 끝까지 자리를 지키는 <span className="text-white" style={{ fontWeight: 600 }}>'완주'</span>와 매너 있는 <span className="text-white" style={{ fontWeight: 600 }}>'소통'</span>을 데이터로 증명하여 <span className="text-white" style={{ fontWeight: 600 }}>'함께 일하고 싶은 동료'</span>를 가려내는 신뢰 중심의 XP 티어 시스템입니다.
              </div>

              {/* Tier table */}
              <div className="space-y-2 mb-6">
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>티어 구간</p>
                {TIERS.map(t => {
                  const isCurrent = t.id === tier.id;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{
                        background: isCurrent ? t.bgColor : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isCurrent ? t.borderColor : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: isCurrent ? `0 0 12px ${t.glowColor}` : 'none',
                      }}
                    >
                      <TierIcon tierId={t.id} color={t.color} size={24} />
                      <div className="flex-1">
                        <span style={{ color: t.color, fontWeight: 700 }}>{t.name}</span>
                        {isCurrent && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>현재</span>
                        )}
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.description}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {t.xpMin.toLocaleString()}{t.xpMax !== null ? ` – ${t.xpMax.toLocaleString()}` : '+'} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* XP 산정 기준 */}
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>XP 산정 기준 (P_base X W_rank + C_bonus)</p>
              <div className="space-y-2 mb-4">
                {/* P_base */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs text-white mb-2" style={{ fontWeight: 600 }}>🏆 대회 기간 기본 XP (P_base)</div>
                  <div className="flex gap-3 flex-wrap">
                    {[['Short', '14일 미만', '100 XP'], ['Medium', '14–28일', '250 XP'], ['Long', '28일 초과', '500 XP']].map(([name, range, xp]) => (
                      <div key={name} className="text-center p-2 rounded-lg flex-1" style={{ background: 'rgba(124,58,237,0.1)', minWidth: 70 }}>
                        <div className="text-xs text-white" style={{ fontWeight: 700 }}>{xp}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{name} · {range}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* W_rank */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs text-white mb-2" style={{ fontWeight: 600 }}>🎖 순위 가중치 (W_rank)</div>
                  <div className="flex gap-2 flex-wrap">
                    {[['🥇 우승', '×5'], ['🥈 준우승', '×3'], ['🥉 입상', '×2'], ['✅ 완주', '×1']].map(([label, w]) => (
                      <div key={label} className="text-center p-2 rounded-lg flex-1" style={{ background: 'rgba(124,58,237,0.08)', minWidth: 60 }}>
                        <div className="text-xs text-white" style={{ fontWeight: 700 }}>{w}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Bonus */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xs text-white mb-2" style={{ fontWeight: 600 }}>⚡ 활동 신뢰도 보너스 (C_bonus)</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>💬 Sincere Msg — 지원 메세지 100자 이상</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>+20 XP</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>👑 Match King — 팀 합류 후 최종 완주</span>
                      <span style={{ color: '#60a5fa', fontWeight: 700 }}>+50 XP</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>⚠️ Late Cancel — 팀 합류 확정 후 탈퇴</span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>-100 XP</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTierModal(false)}
                className="w-full py-2.5 rounded-xl text-sm text-white transition-all"
                style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}