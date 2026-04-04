import {
  Users, Zap, Plus, ExternalLink, ChevronRight, Search,
  Send, X, Lock, AlertTriangle, XCircle, Clock, AlertCircle, Star, Crown, Trophy,
  UserPlus, Info,
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getStorage, Team, UserProfile, Hackathon,
  calculateMatchScore, applyToTeam, cancelApplication,
  checkExistingApplicationForHackathon, createTeam,
  getUserApplications, LookingFor, acceptInvitation,
} from '../../lib/storage';
import { TECH_CATEGORIES, SKILLS_BY_CATEGORY, CATEGORY_COLORS } from '../../lib/constants';
import type { TechCategory } from '../../lib/constants';
import { calculateXP, getTierFromXP, getUserAwards, getUserTotalHackathonCount } from '../../lib/tier';
import { TierBadge } from '../components/TierIcon';

interface TeamWithScore extends Team {
  matchScore: number;
  isMine: boolean;
  hasApplied: boolean;
  hasTeamInHackathon: boolean;
  hackathonStatus: 'ongoing' | 'upcoming' | 'ended' | null;
  isUserRegisteredForHackathon: boolean;
  isInvited: boolean;
  isHackathonFinalized: boolean;
  hasPersonalSubmission: boolean;
}

// src/app/pages/CampPage.tsx 상단 임포트 추가
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../components/ui/tooltip'; // 경로 확인 필요

// ─── Match Score Style ────────────────────────────────────────

function getMatchScoreStyle(score: number) {
  if (score >= 80) {
    return {
      background: 'rgba(79,70,229,0.22)',
      color: '#818cf8',
      border: '1px solid rgba(79,70,229,0.4)',
    };
  }
  if (score >= 50) {
    return {
      background: 'rgba(192,38,211,0.2)',
      color: '#e879f9',
      border: '1px solid rgba(192,38,211,0.4)',
    };
  }
  return {
    background: 'rgba(8,145,178,0.2)',
    color: '#22d3ee',
    border: '1px solid rgba(8,145,178,0.4)',
  };
}

// ─── Confirm Modal ────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
  zIndex = 60,
  variant,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  zIndex?: number;
  variant?: 'info' | 'warning' | 'danger';
}) {
  const Icon = variant === 'info' ? Info : AlertTriangle;
  const iconColor = variant === 'danger' || danger ? 'text-red-400' : (variant === 'info' ? 'text-blue-400' : 'text-yellow-400');
  const borderColor = variant === 'danger' || danger ? 'rgba(239,68,68,0.3)' : (variant === 'info' ? 'rgba(59,130,246,0.3)' : 'rgba(124,58,237,0.3)');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0f0f1f', border: `1px solid ${borderColor}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <Icon size={18} className={`${iconColor} shrink-0 mt-0.5`} />
          <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>{title}</h3>
        </div>
        <p className="text-sm mb-5 ml-7" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{
              background: danger
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: danger
                ? '0 4px 14px rgba(220,38,38,0.35)'
                : '0 4px 14px rgba(124,58,237,0.35)',
              whiteSpace: 'pre-line',
              lineHeight: 1.2, // ✅ 2줄일 때 더 균형있게 보임
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Application Modal ────────────────────────────────────────

function ApplicationModal({
  team,
  onClose,
}: {
  team: Team;
  onClose: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<Team | null>(null);
  const [showLeaderDetail, setShowLeaderDetail] = useState(false);
  const [showConfirmApply, setShowConfirmApply] = useState(false);

  // 팀장 정보 계산
  const masterMember = team.members.find(m => m.tag === team.master);
  const masterXP = masterMember ? calculateXP(masterMember.tag) : null;
  const masterTier = masterXP ? getTierFromXP(masterXP.total) : null;
  const masterAwards = masterMember ? getUserAwards(masterMember.tag) : [];
  const masterHackCount = masterMember ? getUserTotalHackathonCount(masterMember.tag) : 0;

  const doApply = async (existingToCancel?: Team) => {
    setSending(true);
    await new Promise(r => setTimeout(r, 600));
    if (existingToCancel) {
      cancelApplication(existingToCancel.id);
    }
    const result = applyToTeam(team.id, message.trim(), selectedRole);
    
    if (result === 'ok') {
      toast.success(`✅ "${team.teamName}" 팀에 지원 완료!`);
      setSending(false);
      onClose();
    } else if (result === 'already_finalized') {
      toast.error('이미 해당 대회의 최종 제출을 완료했습니다.');
      setSending(false);
    } else if (result === 'already_in_team') {
      toast.error('이미 해당 대회의 다른 팀에 소속되어 있습니다.');
      setSending(false);
    } else {
      toast.error('지원 처리 중 오류가 발생했습니다.');
      setSending(false);
    }
  };

  const handleApply = async () => {
    if (!selectedRole) {
      toast.error('지원할 포지션을 선택해주세요.');
      return;
    }
    if (!message.trim()) {
      toast.error('팀장에게 보낼 메시지를 입력해주세요.');
      return;
    }
    // Check for existing application in same hackathon
    if (team.hackathonSlug) {
      const existing = checkExistingApplicationForHackathon(team.hackathonSlug);
      if (existing && existing.id !== team.id) {
        setSwitchTarget(existing);
        return;
      }
    }
    setShowConfirmApply(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          className="w-full max-w-md rounded-2xl p-6 overflow-y-auto"
          style={{ background: '#0f0f1f', border: '1px solid rgba(124,58,237,0.3)', maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white" style={{ fontWeight: 700 }}>팀 지원하기</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Team Preview */}
          <div
            className="rounded-xl p-3 mb-3"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <div className="text-white text-sm mb-1.5" style={{ fontWeight: 700 }}>{team.teamName}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{team.intro}</div>
          </div>

          {/* 팀장 정보 — 토글 */}
          {masterMember && masterTier && (
            <div className="mb-4">
              {/* 팀장 컴팩트 행 (항상 표시) */}
              <button
                onClick={() => setShowLeaderDetail(v => !v)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: showLeaderDetail ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showLeaderDetail ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                  style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontWeight: 700 }}>
                  {masterMember.name[0]}
                </div>
                <Crown size={11} className="text-yellow-400 shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <span className="text-white text-xs truncate" style={{ fontWeight: 600 }}>{masterMember.name}</span>
                  <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{masterMember.tag}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs shrink-0"
                    style={{ background: masterTier.bgColor, color: masterTier.color, border: `1px solid ${masterTier.borderColor}` }}>
                    {masterTier.name}
                  </span>
                </div>
                <span className="text-xs shrink-0 transition-transform" style={{ color: 'rgba(255,255,255,0.3)', transform: showLeaderDetail ? 'rotate(180deg)' : 'none' }}>
                  ▼
                </span>
              </button>

              {/* 상세 펼침 영역 */}
              <AnimatePresence>
                {showLeaderDetail && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="mt-1.5 rounded-xl p-4 space-y-3"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

                      {/* ── 프로필 헤더 ── */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.2))', color: '#a78bfa', fontWeight: 800 }}>
                          {masterMember.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* 이름 + 태그 */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white text-sm" style={{ fontWeight: 700 }}>{masterMember.name}</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{masterMember.tag}</span>
                          </div>
                          {/* 포지션 배지 + 티어 배지 */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-lg"
                              style={{ background: 'rgba(124,58,237,0.18)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.25)' }}>
                              {masterMember.role}
                            </span>
                            <TierBadge
                              tierId={masterTier.id}
                              tierName={masterTier.name}
                              color={masterTier.color}
                              bgColor={masterTier.bgColor}
                              borderColor={masterTier.borderColor}
                              size="sm"
                            />
                          </div>
                          {/* 서브 기술 스택 */}
                          {masterMember.skills && masterMember.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {masterMember.skills.map(skill => (
                                <span key={skill} className="px-1.5 py-0.5 rounded text-xs"
                                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── 한 줄 소개 ── */}
                      {masterMember.bio && (
                        <div className="px-3 py-2.5 rounded-xl"
                          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>
                            "{masterMember.bio}"
                          </p>
                        </div>
                      )}

                      {/* ── 통계 (수상 경력 · 참가 대회) ── */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl"
                          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                          <span className="text-base" style={{ fontWeight: 800, color: '#fbbf24' }}>{masterAwards.length}</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>수상 경력</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl"
                          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                          <span className="text-base" style={{ fontWeight: 800, color: '#60a5fa' }}>{masterHackCount}</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>참가 대회</span>
                        </div>
                      </div>

                      {/* ── 수상 내역 ── */}
                      {masterAwards.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                            <Trophy size={10} /> 수상 내역
                          </p>
                          {masterAwards.slice(0, 3).map((award, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="shrink-0">{award.rank === 1 ? '🥇' : award.rank === 2 ? '🥈' : '🥉'}</span>
                              <span className="flex-1 truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{award.hackathonTitle}</span>
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-xs"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                                {award.teamName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}


                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-sm text-white mb-2.5" style={{ fontWeight: 600 }}>
              지원 포지션 선택
              <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>* 필수</span>
            </label>
            {team.lookingFor.length === 0 ? (
              <p className="text-xs py-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                지정된 모집 포지션이 없습니다.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {team.lookingFor.map(lf => {
                  const colors = CATEGORY_COLORS[lf.role as TechCategory] || CATEGORY_COLORS.Frontend;
                  const isSelected = selectedRole === lf.role;
                  return (
                    <button
                      key={lf.role}
                      onClick={() => setSelectedRole(isSelected ? '' : lf.role)}
                      className="flex flex-col items-start px-3 py-2 rounded-xl text-xs transition-all"
                      style={{
                        background: isSelected ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                        border: isSelected ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        color: isSelected ? '#c4b5fd' : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {isSelected ? '✓ ' : ''}{lf.role}
                      </span>
                      {lf.skills.length > 0 && (
                        <span className="mt-0.5 opacity-60" style={{ fontSize: '10px' }}>
                          {lf.skills.slice(0, 3).join(' · ')}{lf.skills.length > 3 ? ' ...' : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="mb-5">
            <label className="block text-sm text-white mb-2" style={{ fontWeight: 600 }}>
              팀장에게 메시지
              <span className="ml-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>* 필수</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="본인의 기술 스택과 팀에 기여할 수 있는 점을 간략히 소개해주세요..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </div>

          <button
            onClick={handleApply}
            disabled={sending}
            className="w-full py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Send size={14} />}
            지원 보내기
          </button>
        </motion.div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmApply && (
          <ConfirmModal
            key="confirm-apply"
            variant="info"
            title="지원 확인"
            message={`"${team.teamName}" 팀에 지원을 보내시겠습니까?`}
            confirmLabel="지원하기"
            onConfirm={() => {
              setShowConfirmApply(false);
              doApply();
            }}
            onCancel={() => setShowConfirmApply(false)}
            zIndex={70}
          />
        )}
        {switchTarget && (
          <ConfirmModal
            key="switch-modal"
            variant="warning"
            title="지원 팀 변경"
            message={`이미 "${switchTarget.teamName}" 팀에 지원한 상태입니다. 기존 지원을 취소하고 이 팀에 새로 지원하시겠습니까?`}
            confirmLabel={`기존 지원 취소 후\n새로 지원`}
            onConfirm={() => {
              const existing = switchTarget;
              setSwitchTarget(null);
              doApply(existing);
            }}
            onCancel={() => setSwitchTarget(null)}
            zIndex={70}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Create Team Modal ────────────────────────────────────────

function CreateTeamModal({
  onClose,
  hackathonSlug,
  hackathons,
}: {
  onClose: () => void;
  hackathonSlug: string | null;
  hackathons: Hackathon[];
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    teamName: '',
    hackathonSlug: hackathonSlug || '',
    intro: '',
    contactUrl: '',
    isOpen: true,
  });
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
  const [creating, setCreating] = useState(false);

  const toggleRole = (role: string) => {
    const exists = lookingFor.some(lf => lf.role === role);
    if (exists) {
      setLookingFor(prev => prev.filter(lf => lf.role !== role));
    } else {
      if (lookingFor.length >= 5) {
        toast.error('최대 5개 포지션까지 추가할 수 있어요.');
        return;
      }
      setLookingFor(prev => [...prev, { role, skills: [], count: 1 }]);
    }
  };

  const toggleSkillForRole = (roleIndex: number, skill: string) => {
    setLookingFor(prev => prev.map((lf, i) => {
      if (i !== roleIndex) return lf;
      const has = lf.skills.includes(skill);
      return { ...lf, skills: has ? lf.skills.filter(s => s !== skill) : [...lf.skills, skill] };
    }));
  };

  const removeRole = (roleIndex: number) => {
    setLookingFor(prev => prev.filter((_, i) => i !== roleIndex));
  };

  const handleCreate = async () => {
    if (!form.teamName.trim()) {
      toast.error('팀 이름을 입력해주세요.');
      return;
    }
    if (!form.intro.trim()) {
      toast.error('팀 소개를 입력해주세요.');
      return;
    }
    if (!form.hackathonSlug) {
      toast.error('참가할 해커톤을 선택해주세요.');
      return;
    }
    if (lookingFor.length === 0) {
      toast.error('모집 포지션을 1개 이상 선택해주세요.');
      return;
    }
    // Validate hackathon status and registration
    {
      const { hackathons, userProfile, teams } = getStorage();
      const selectedHackathon = hackathons.find(h => h.slug === form.hackathonSlug);
      if (selectedHackathon && selectedHackathon.status !== 'ongoing') {
        toast.error(
          selectedHackathon.status === 'ended'
            ? '이미 종료된 대회에는 팀을 만들 수 없어요.'
            : '대회 시작 후 팀을 만들 수 있어요.'
        );
        return;
      }
      if (selectedHackathon && !userProfile.joinedHackathons.includes(form.hackathonSlug)) {
        toast.error('해커톤 참가 신청 후 팀을 만들 수 있어요.');
        return;
      }
      // 같은 대회에 이미 팀이 있으면 차단
      const alreadyHasTeam = teams.some(
        t => t.hackathonSlug === form.hackathonSlug &&
          t.members.some(m => m.tag === userProfile.tag)
      );
      if (alreadyHasTeam) {
        toast.error('같은 대회에 여러 팀을 만들 수 없어요.');
        return;
      }
    }
    setCreating(true);
    await new Promise(r => setTimeout(r, 600));
    const newTeam = createTeam({
      teamName: form.teamName,
      hackathonSlug: form.hackathonSlug,
      isOpen: form.isOpen,
      lookingFor,
      contactUrl: form.contactUrl,
      intro: form.intro,
    });
    toast.success(`🎉 팀 "${form.teamName}" 생성 완료!`);
    setCreating(false);
    onClose();
    navigate(`/teams/${newTeam.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl rounded-2xl p-6 flex flex-col"
        style={{
          background: '#0f0f1f',
          border: '1px solid rgba(124,58,237,0.3)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="text-white" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            팀 만들기
          </h2>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Team Name */}
          <div>
            <label className="block text-sm text-white mb-1.5" style={{ fontWeight: 600 }}>팀 이름 *</label>
            <input
              type="text"
              value={form.teamName}
              onChange={e => setForm(p => ({ ...p, teamName: e.target.value }))}
              placeholder="예시) 둘은 문제아지만 최강"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>

          {/* Hackathon */}
          <div>
            <label className="block text-sm text-white mb-1.5" style={{ fontWeight: 600 }}>
              연결 해커톤 *
              </label>
                <select
                  value={form.hackathonSlug}
                  onChange={e => setForm(p => ({ ...p, hackathonSlug: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ 
                    background: 'rgba(255,255,255,0.06)', 
                    // 테두리를 항상 intro와 같은 색상으로 고정
                    border: '1px solid rgba(255,255,255,0.1)', 
                    // 글자색을 항상 흰색으로 유지
                    color: form.hackathonSlug ? '#fff' : 'rgba(255,255,255,0.35)'
                  }}
                >
                  <option value="" style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.5)' }}>
                    해커톤을 선택해주세요
                  </option>
                  {hackathons.filter(h => h.status === 'ongoing').map(h => (
                    <option key={h.slug} value={h.slug} style={{ background: '#1a1a2e' }}>
                      {h.title}
                    </option>
                  ))}
                </select>
              </div>

          {/* Intro */}
          <div>
            <label className="block text-sm text-white mb-1.5" style={{ fontWeight: 600 }}>팀 소개 *</label>
            <textarea
              value={form.intro}
              onChange={e => setForm(p => ({ ...p, intro: e.target.value }))}
              placeholder="팀의 목표, 개발할 프로젝트, 팀 분위기 등을 소개해주세요."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm text-white mb-1.5" style={{ fontWeight: 600 }}>연락 링크 (오픈카카오/이메일)</label>
            <input
              type="text"
              value={form.contactUrl}
              onChange={e => setForm(p => ({ ...p, contactUrl: e.target.value }))}
              placeholder="https://open.kakao.com/..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>

          {/* Looking For - Tag-based */}
          <div>
            <label className="block text-sm text-white mb-2" style={{ fontWeight: 600 }}>
              모집 포지션 *
              <span className="ml-2 text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
                클릭으로 추가 (최대 5개)
              </span>
            </label>

            {/* Role Tag Selector */}
            <div className="flex flex-wrap gap-2 mb-3">
              {TECH_CATEGORIES.map(cat => {
                const isActive = lookingFor.some(lf => lf.role === cat);
                const colors = CATEGORY_COLORS[cat as TechCategory];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleRole(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${isActive ? `${colors.bg} ${colors.text}` : ''}`}
                    style={{
                      background: isActive ? undefined : 'rgba(255,255,255,0.06)',
                      border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.1)',
                      color: isActive ? undefined : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {isActive ? '✓ ' : '+ '}{cat}
                  </button>
                );
              })}
            </div>

            {/* Selected Roles + Skills */}
            {lookingFor.length > 0 && (
              <div
                className="space-y-3 overflow-y-auto pr-1"
                style={{ maxHeight: '260px', scrollbarWidth: 'thin' }}
              >
                {lookingFor.map((lf, i) => {
                  const colors = CATEGORY_COLORS[lf.role as TechCategory] || CATEGORY_COLORS.Frontend;
                  const availableSkills = SKILLS_BY_CATEGORY[lf.role as TechCategory] || [];
                  return (
                    <div
                      key={lf.role}
                      className="rounded-xl p-3.5"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs ${colors.bg} ${colors.text}`}
                          style={{ fontWeight: 600 }}
                        >
                          {lf.role}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {lf.skills.length}개 스킬 선택됨
                          </span>
                          <button
                            onClick={() => removeRole(i)}
                            className="p-1 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      {availableSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {availableSkills.map(skill => {
                            const isSkillSelected = lf.skills.includes(skill);
                            return (
                              <button
                                key={skill}
                                onClick={() => toggleSkillForRole(i, skill)}
                                className="px-2 py-1 rounded-lg text-xs transition-all"
                                style={{
                                  background: isSkillSelected ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                                  border: isSkillSelected
                                    ? '1px solid rgba(124,58,237,0.5)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                  color: isSkillSelected ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                                }}
                              >
                                {isSkillSelected ? '✓ ' : ''}{skill}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Open/Close Toggle */}
          <div className="flex items-center gap-3 pb-1">
            <button
              onClick={() => setForm(p => ({ ...p, isOpen: !p.isOpen }))}
              className="w-10 h-6 rounded-full transition-all relative shrink-0"
              style={{ background: form.isOpen ? '#7c3aed' : 'rgba(255,255,255,0.15)' }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: form.isOpen ? '20px' : '4px' }}
              />
            </button>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {form.isOpen ? '공개(누구나 지원 가능)' : '비공개(초대받은 사람만 지원 가능)'}
            </span>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 pt-4">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 rounded-xl text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Plus size={15} />}
            팀 생성하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Team Card ─────────────────────────────────────────────────

function TeamCard({
  team,
  hackathons,
  onApply,
  onCancelApply,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  team: TeamWithScore;
  hackathons: Hackathon[];
  onApply: (t: TeamWithScore) => void;
  onCancelApply: (t: TeamWithScore) => void;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const hackathon = hackathons.find(h => h.slug === team.hackathonSlug);
  const isMyTeam = team.isMine;
  const hasApplied = team.hasApplied;
  const blocked = !isMyTeam && (team.hasTeamInHackathon || team.hasPersonalSubmission);
  const isFinalized = team.isHackathonFinalized || team.hasPersonalSubmission;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl p-5 flex flex-col"
      style={{
        background: isMyTeam ? 'rgba(124,58,237,0.12)' : blocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isMyTeam ? 'rgba(124,58,237,0.4)' : hasApplied ? 'rgba(52,211,153,0.25)' : blocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
        opacity: blocked ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {isMyTeam && (
            <span
              className="text-xs px-2 py-0.5 rounded-full mb-1.5 inline-block"
              style={{
                background: 'rgba(124,58,237,0.3)',
                color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.4)',
              }}
            >
              내 팀
            </span>
          )}
          {hasApplied && !isMyTeam && (
            <span
              className="text-xs px-2 py-0.5 rounded-full mb-1.5 inline-block"
              style={{
                background: 'rgba(52,211,153,0.12)',
                color: '#34d399',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              지원 완료
            </span>
          )}
          <h3 className="text-white text-sm truncate" style={{ fontWeight: 700 }}>{team.teamName}</h3>
          {hackathon && (
            <span className="text-xs mt-0.5 block truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {hackathon.title}
            </span>
          )}
        </div>
        {/* 매칭률 [좌] | 모집중/마감 | ⭐ [우] — 가로 한 줄 */}
        <div className="flex flex-row items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {/* Match score badge — 모집중/마감 왼쪽 */}
          {team.matchScore > 0 && (
            <span
              className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full"
              style={getMatchScoreStyle(team.matchScore)}
            >
              <Zap size={10} />
              매칭률 {team.matchScore}%
            </span>
          )}
          {/* Open/Close badge */}
          <span
            className="px-2.5 py-0.5 rounded-full text-xs"
            style={{
              background: (team.isOpen && !team.isFinalized && !team.isTeamLocked) ? 'rgba(52,211,153,0.15)' : 'rgba(100,116,139,0.15)',
              color: (team.isOpen && !team.isFinalized && !team.isTeamLocked) ? '#34d399' : '#94a3b8',
              border: `1px solid ${(team.isOpen && !team.isFinalized && !team.isTeamLocked) ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.3)'}`,
            }}
          >
            {(team.isOpen && !team.isFinalized && !team.isTeamLocked) ? '모집 중' : '마감'}
          </span>
          {/* Favorite star button — 모집중/마감 오른쪽 */}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(team.id); }}
            className="transition-all hover:scale-110 p-0.5"
            title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Star
              size={15}
              style={{
                fill: isFavorite ? '#fbbf24' : 'none',
                color: isFavorite ? '#fbbf24' : 'rgba(255,255,255,0.25)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Intro */}
      <p 
        className="text-xs mb-3 leading-relaxed flex-1" 
        style={{ 
          color: 'rgba(255,255,255,0.55)',
          display: '-webkit-box',
          WebkitLineClamp: 3, // ✅ 최대 3줄로 설정
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {team.intro}
      </p>

      {/* Looking For Tags - clean label (role only, no "구함") */}
      {team.lookingFor.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {team.lookingFor.map((lf, i) => {
            const colors = CATEGORY_COLORS[lf.role as TechCategory] || CATEGORY_COLORS.Frontend;
            return (
              <span
                key={i}
                className={`px-2.5 py-0.5 rounded-lg text-xs ${colors.bg} ${colors.text}`}
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {lf.role}
              </span>
            );
          })}
        </div>
      )}

{/* Footer */}
      <div
        className="flex flex-row items-center justify-between pt-3 gap-1 flex-nowrap" // ✅ flex-nowrap으로 한 줄 강제 고정
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Members: 최소한의 공간만 차지하도록 설정 */}
        <div className="flex items-center gap-1 text-[10px] sm:text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Users size={11} />
          <span className="whitespace-nowrap">{team.members.length}명</span>
          <div className="flex -space-x-1.5 ml-0.5">
            {team.members.slice(0, 2).map(m => ( // ✅ 공간 확보를 위해 아바타를 2개로 제한
              <span
                key={m.tag}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-[#0f0f1f]"
                style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontWeight: 700 }}
              >
                {m.name[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons: 공간이 부족하면 내부 텍스트가 줄어들도록 min-w-0 설정 */}
        <div className="flex items-center gap-1 min-w-0 justify-end">
          {team.contactUrl && !isMyTeam && (
            <a
              href={team.contactUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] sm:text-xs transition-all whitespace-nowrap shrink-0"
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <ExternalLink size={10} />
              연락
            </a>
          )}

          {isMyTeam ? (
            <Link
              to={`/teams/${team.id}`}
              className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] sm:text-xs whitespace-nowrap shrink-0"
              style={{
                background: 'rgba(124,58,237,0.25)',
                color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <ChevronRight size={10} />
              대시보드
            </Link>
          ) : blocked ? (
            /* ✅ 툴팁과 함께 truncate 적용 - 가장 긴 문구가 여기서 줄어듭니다 */
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span 
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] sm:text-xs cursor-help min-w-0"
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      color: 'rgba(255,255,255,0.35)', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      flex: '1 1 auto' 
                    }}
                  >
                    <Lock size={10} className="shrink-0" />
                    <span className="truncate">
                      {isFinalized ? '최종 제출 완료' : '해당 대회에 이미 팀이 있습니다.'}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[#1a1a2e] border-violet-500/30 text-white text-xs p-2 shadow-xl">
                  {isFinalized 
                    ? '이미 최종 제출(팀 또는 개인)을 완료하여 추가 참가가 불가능합니다.'
                    : '이미 이 해커톤에 소속된 팀이 있어 추가 지원이 불가능합니다.'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : hasApplied ? (
            <button
              onClick={() => onCancelApply(team)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs whitespace-nowrap shrink-0"
              style={{
                background: 'rgba(239,68,68,0.08)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <XCircle size={10} />
              지원 취소
            </button>
          ) : team.isInvited ? (
            /* 초대 수락 버튼 */
            <button
              onClick={() => onApply(team)} // handleApplyRequest will detect isInvited if we update it, or we can use a separate prop
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs text-white whitespace-nowrap shrink-0 transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 2px 10px rgba(124,58,237,0.4)',
              }}
            >
              <UserPlus size={10} />
              초대 수락
            </button>
          ) : team.isOpen ? (
            <button
              onClick={() => onApply(team)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs text-white whitespace-nowrap shrink-0"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
              }}
            >
              <Send size={10} />
              지원하기
            </button>
          ) : (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs whitespace-nowrap shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
            >
              <Lock size={10} />
              마감
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
// ─── Main Page ────────────────────────────────────────────────

export function CampPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hackathonFilter = searchParams.get('hackathon');

  const [teams, setTeams] = useState<TeamWithScore[]>([]);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState<'all' | 'open' | 'closed' | 'favorites'>('all');
  const [filterHackathon, setFilterHackathon] = useState<string>(hackathonFilter || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [applyTarget, setApplyTarget] = useState<TeamWithScore | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TeamWithScore | null>(null);
  const [acceptConfirm, setAcceptConfirm] = useState<{ teamId: string; teamName: string } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('daker_fav_teams') || '[]'); } catch { return []; }
  });

  const loadData = () => {
    const data = getStorage();
    setHackathons(data.hackathons);
    setUserProfile(data.userProfile);

    const appliedIds = getUserApplications();
    const myTeamHackathons = new Set(
      data.teams
        .filter(t => t.hackathonSlug && t.members.some(m => m.tag === data.userProfile.tag))
        .map(t => t.hackathonSlug!)
    );
    const finalizedHackathons = new Set(
      data.teams
        .filter(t => t.hackathonSlug && t.isFinalized && t.members.some(m => m.tag === data.userProfile.tag))
        .map(t => t.hackathonSlug!)
    );

    const scored: TeamWithScore[] = data.teams
      .map(t => ({
        ...t,
        matchScore: calculateMatchScore(data.userProfile, t),
        isMine: t.members.some(m => m.tag === data.userProfile.tag),
        hasApplied: appliedIds.includes(t.id),
        hasTeamInHackathon: !!(t.hackathonSlug && myTeamHackathons.has(t.hackathonSlug) && !t.members.some(m => m.tag === data.userProfile.tag)),
        isHackathonFinalized: !!(t.hackathonSlug && finalizedHackathons.has(t.hackathonSlug)),
        hasPersonalSubmission: !!(t.hackathonSlug && data.userProfile.personalData[t.hackathonSlug]?.personalSubmission),
        hackathonStatus: t.hackathonSlug ? data.hackathons.find(h => h.slug === t.hackathonSlug)?.status || null : null,
        isUserRegisteredForHackathon: t.hackathonSlug ? data.userProfile.joinedHackathons.includes(t.hackathonSlug) : false,
        isInvited: t.invitations.some(inv => inv.tag === data.userProfile.tag && inv.status === 'pending'),
      }))
      .sort((a, b) => {
        const getPriority = (t: TeamWithScore) => {
          // 0: 내 팀 (상단 고정)
          if (t.isMine) return 0;
          
          const isUserFinalized = t.isHackathonFinalized || t.hasPersonalSubmission;
          
          // 사용자가 이미 이 대회 참여를 확정했거나 다른 팀이 있는 경우 하단으로 배치
          // (내 팀이 아닐 때만 해당 hackathonSlug 관련 팀들을 뒤로 보냄)
          if (isUserFinalized || t.hasTeamInHackathon) return 5;

          // 1: 초대 받은 팀 (참가 가능한 상태에서만 상단)
          if (t.isInvited) return 1;
          
          // 2: 지원한 팀 (참가 가능한 상태에서만 상단)
          if (t.hasApplied) return 2;
          
          const isJoinable = !t.hasTeamInHackathon && !t.hasPersonalSubmission && (t.isOpen && !t.isFinalized);
          
          // 3: 지원하기 (매칭률 순)
          if (isJoinable) return 3;
          
          // 6: 마감 / 팀 확정 (팀 자체가 이미 끝난 경우)
          return 6;
        };
        const pa = getPriority(a);
        const pb = getPriority(b);
        if (pa !== pb) return pa - pb;
        return b.matchScore - a.matchScore;
      });

    setTeams(scored);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // URL param이 바뀌면 hackathon 필터 및 모달 열기 동기화
  useEffect(() => {
    if (hackathonFilter) setFilterHackathon(hackathonFilter);
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [hackathonFilter, searchParams]);

  const filtered = teams.filter(t => {
    const matchSearch =
      !search ||
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      t.intro.toLowerCase().includes(search.toLowerCase());
    const matchOpen =
      filterOpen === 'all' || filterOpen === 'favorites' ||
      (filterOpen === 'open' ? t.isOpen : !t.isOpen);
    const matchFav = filterOpen !== 'favorites' || favorites.includes(t.id);
    const matchHackathon = !filterHackathon || t.hackathonSlug === filterHackathon;
    return matchSearch && matchOpen && matchFav && matchHackathon;
  });

  const hackathonName = filterHackathon
    ? hackathons.find(h => h.slug === filterHackathon)?.title
    : null;

  const hasProfile = (userProfile?.techStack?.length || 0) > 0;

  const handleApplyRequest = (team: TeamWithScore) => {
    // If user is invited, show accept confirm instead of apply modal
    if (team.isInvited) {
      setAcceptConfirm({ teamId: team.id, teamName: team.teamName });
      return;
    }
    // Block if hackathon is ended or upcoming
    if (team.hackathonStatus === 'ended') {
      toast.error('이미 종료된 대회의 팀에는 지원할 수 없어요.');
      return;
    }
    if (team.hackathonStatus === 'upcoming') {
      toast.error('대회 시작 후 지원할 수 있어요.');
      return;
    }
    // Block if hackathon is ongoing but user is not registered
    if (team.hackathonSlug && team.hackathonStatus === 'ongoing' && !team.isUserRegisteredForHackathon) {
      toast.error('해커톤 참가 신청 후 팀에 지원할 수 있어요.', {
        action: {
          label: '대회 보러가기',
          onClick: () => window.location.hash = `/hackathons/${team.hackathonSlug}`,
        },
      });
      return;
    }
    setApplyTarget(team);
  };

  const handleAcceptInvitation = () => {
    if (!acceptConfirm) return;
    const result = acceptInvitation(acceptConfirm.teamId);
    
    if (result === 'ok') {
      toast.success(`🎉 "${acceptConfirm.teamName}" 팀의 초대를 수락했습니다!`);
      setAcceptConfirm(null);
      loadData(); // Refresh list to update status
      // Redirect to the team dashboard after a short delay
      setTimeout(() => {
        navigate(`/teams/${acceptConfirm.teamId}`);
      }, 1000);
    } else if (result === 'already_finalized') {
      setAcceptConfirm(null);
      toast.error('이미 해당 대회의 최종 제출을 완료하여 다른 팀에 합류할 수 없습니다.');
    } else if (result === 'already_in_team') {
      setAcceptConfirm(null);
      toast.error('이미 해당 대회의 다른 팀에 소속되어 있어 초대를 수락할 수 없습니다.');
    } else {
      setAcceptConfirm(null);
      toast.error('초대를 수락하는 중 오류가 발생했습니다.');
    }
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget) return;
    cancelApplication(cancelTarget.id);
    toast.success(`지원이 취소되었습니다.`);
    setCancelTarget(null);
  };

  const handleToggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('daker_fav_teams', JSON.stringify(newFavorites));
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} className="text-violet-400" />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>팀 모집 캠프</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1
                className="text-3xl text-white mb-1"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}
              >
                팀 찾기
                {hackathonName && (
                  <span className="text-violet-400 text-xl ml-2">· {hackathonName}</span>
                )}
              </h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {hasProfile
                  ? '지능형 매칭 알고리즘이 당신에게 꼭 맞는 팀을 추천해드려요.'
                  : '프로필에 기술 스택을 등록하면 지능형 매칭률을 확인할 수 있어요!'}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white shrink-0 transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              }}
            >
              <Plus size={15} />
              팀 만들기
            </button>
          </div>
        </motion.div>

        {/* Match Score Legend */}
        {hasProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-5 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>매칭률:</span>
            {[
              { label: '80%+ 고일치', ...getMatchScoreStyle(80) },
              { label: '50~79% 중일치', ...getMatchScoreStyle(60) },
              { label: '~49% 저일치', ...getMatchScoreStyle(30) },
            ].map(item => (
              <span
                key={item.label}
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full"
                style={{ background: item.background, color: item.color, border: item.border }}
              >
                <Zap size={9} />
                {item.label}
              </span>
            ))}
          </motion.div>
        )}

        {/* AI Profile Hint */}
        {!hasProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <Zap size={16} className="text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-white" style={{ fontWeight: 600 }}>지능형 매칭을 활성화하세요</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <Link to="/profile" className="text-violet-400 underline">프로필</Link>에서 기술 스택을 등록하면
                팀 목록이 최적화 순서로 정렬됩니다. 직무 유사도 + 스택 커버리지 방식으로 0~100% 매칭률이 계산돼요.
              </p>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Row 1: Search + Hackathon dropdown */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              />
              <input
                type="text"
                placeholder="팀 이름 또는 소개로 검색..."
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
            {/* Hackathon filter dropdown — 진행 중인 대회만 */}
            {hackathons.some(h => h.status === 'ongoing') && (
              <select
                value={filterHackathon}
                onChange={e => setFilterHackathon(e.target.value)}
                className="sm:w-64 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: filterHackathon ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${filterHackathon ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  color: filterHackathon ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                }}
              >
                <option value="" style={{ background: '#1a1a2e', color: '#fff' }}>전체 대회</option>
                {hackathons.filter(h => h.status === 'ongoing').map(h => (
                  <option key={h.slug} value={h.slug} style={{ background: '#1a1a2e', color: '#fff' }}>
                    {h.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Row 2: Status + Favorites filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'open', 'closed', 'favorites'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterOpen(v)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: filterOpen === v ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${filterOpen === v ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: filterOpen === v ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                }}
              >
                {v === 'favorites' && (
                  <Star
                    size={12}
                    style={{
                      fill: filterOpen === 'favorites' ? '#fbbf24' : 'none',
                      color: filterOpen === 'favorites' ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                )}
                {v === 'all' ? '전체' : v === 'open' ? '모집 중' : v === 'closed' ? '마감' : '즐겨찾기'}
                {v === 'favorites' && favorites.length > 0 && (
                  <span
                    className="ml-0.5 px-1.5 py-0.5 rounded-full"
                    style={{
                      background: filterOpen === 'favorites' ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.1)',
                      color: filterOpen === 'favorites' ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                      fontSize: '10px',
                    }}
                  >
                    {favorites.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 mb-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span>{filtered.length}개 팀</span>
            <span>·</span>
            <span>{filtered.filter(t => t.isOpen).length}개 모집 중</span>
            {hasProfile && (
              <>
                <span>·</span>
                <span>{filtered.filter(t => t.matchScore >= 50).length}개 50% 이상 매칭</span>
              </>
            )}
          </div>
        )}

        {/* Team Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg" style={{ fontWeight: 600 }}>팀이 없어요</p>
            <p className="text-sm mt-2">첫 번째 팀을 만들어 보세요!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-5 px-5 py-2.5 rounded-xl text-sm text-white"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              + 팀 만들기
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((team, i) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  hackathons={hackathons}
                  onApply={t => handleApplyRequest(t)}
                  onCancelApply={t => setCancelTarget(t)}
                  index={i}
                  isFavorite={favorites.includes(team.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTeamModal
            key="create-modal"
            onClose={() => setShowCreateModal(false)}
            hackathonSlug={hackathonFilter}
            hackathons={hackathons}
          />
        )}
        {applyTarget && (
          <ApplicationModal
            key="apply-modal"
            team={applyTarget}
            onClose={() => setApplyTarget(null)}
          />
        )}
        {cancelTarget && (
          <ConfirmModal
            key="cancel-modal"
            title="지원 취소"
            message={`"${cancelTarget.teamName}" 팀에 대한 지원을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            confirmLabel="지원 취소하기"
            onConfirm={handleCancelConfirm}
            onCancel={() => setCancelTarget(null)}
            danger
            zIndex={55}
          />
        )}
        {acceptConfirm && (
          <ConfirmModal
            key="accept-invitation-modal"
            title="초대 수락 확인"
            message={`"${acceptConfirm.teamName}" 팀의 초대를 수락하시겠습니까?\n수락 시 해당 팀의 멤버로 등록됩니다.`}
            confirmLabel="수락하기"
            onConfirm={handleAcceptInvitation}
            onCancel={() => setAcceptConfirm(null)}
            variant="info"
            zIndex={70}
          />
        )}
      </AnimatePresence>
    </>
  );
}