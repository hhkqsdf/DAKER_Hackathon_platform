import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, Users, MessageSquare, CheckCircle, XCircle,
  Edit3, Save, X, Crown, Settings, Send,
  ExternalLink, AlertCircle, LogOut, Zap,
  UserPlus, Lock, ShieldCheck, PenLine, Plus, Trash2,
  ChevronDown, ChevronUp, Clock, Mail, ArrowRightLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getStorage, Team, Hackathon, UserProfile, Applicant, MemberTodo,
  addQuickMemo, deleteQuickMemo, manageApplicant, updateTeam, leaveTeam, transferMaster,
  sendInvitation, cancelInvitation, lockTeam, unlockTeam,
  addMemberTodo, updateMemberTodo, deleteMemberTodo,
} from '../../lib/storage';
import { CATEGORY_COLORS, TECH_CATEGORIES } from '../../lib/constants';
import type { TechCategory } from '../../lib/constants';
import { calculateXP, getTierFromXP, getUserAwards, getUserTotalHackathonCount, RANK_LABELS } from '../../lib/tier';
import { TierBadge } from '../components/TierIcon';

// ─── Todo Status Config ───────────────────────────────────────
const TODO_STATUS = {
  todo: { label: '예정', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' },
  inprogress: { label: '진행 중', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  done: { label: '완료', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
};

// ─── Quick Memo ───────────────────────────────────────────────
function MemoSection({ team, userProfile }: { team: Team; userProfile: UserProfile }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 300));
    addQuickMemo(team.id, content.trim());
    setContent('');
    setSending(false);
  };

  const sorted = [...team.quickMemos].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-white mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
        <MessageSquare size={15} className="text-violet-400" />퀵 메모
      </h3>
      <form onSubmit={handleSend} className="flex gap-2 mb-4">
        <input type="text" value={content} onChange={e => setContent(e.target.value)}
          placeholder="팀에게 메모 남기기..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
        />
        <button type="submit" disabled={sending || !content.trim()} className="px-3 py-2 rounded-xl text-sm"
          style={{ background: content.trim() ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)', color: content.trim() ? '#a78bfa' : 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Send size={15} />
        </button>
      </form>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>첫 메모를 남겨보세요!</p>
        ) : sorted.map(memo => {
          const isMe = memo.authorTag === userProfile.tag;
          return (
            <div key={memo.id} className="flex gap-2 group">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                style={{ background: isMe ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.1)', color: isMe ? '#a78bfa' : 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                {memo.authorName[0]}
              </div>
              <div className="flex-1 rounded-xl px-3 py-2"
                style={{ background: isMe ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isMe ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs" style={{ color: isMe ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{isMe ? '나' : memo.authorName}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {new Date(memo.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <button onClick={() => deleteQuickMemo(team.id, memo.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(239,68,68,0.5)' }}>
                        <X size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{memo.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Member Tasks (Todo Board) ────────────────────────────────
function MemberTasks({ team, userProfile }: { team: Team; userProfile: UserProfile }) {
  const [newTexts, setNewTexts] = useState<Record<string, string>>({});
  const [editingTodo, setEditingTodo] = useState<{ tag: string; id: string; text: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(userProfile.tag);

  const handleAdd = (memberTag: string) => {
    const text = newTexts[memberTag]?.trim();
    if (!text) return;
    addMemberTodo(team.id, memberTag, text);
    setNewTexts(p => ({ ...p, [memberTag]: '' }));
    toast.success('할 일이 추가됐어요!');
  };

  const cycleStatus = (memberTag: string, todoId: string, current: MemberTodo['status']) => {
    const next: Record<MemberTodo['status'], MemberTodo['status']> = { todo: 'inprogress', inprogress: 'done', done: 'todo' };
    updateMemberTodo(team.id, memberTag, todoId, { status: next[current] });
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="text-white mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
        <Users size={15} className="text-violet-400" />멤버 작업 현황
      </h3>
      <div className="space-y-3">
        {team.members.map(member => {
          const isMe = member.tag === userProfile.tag;
          const isMaster = member.tag === team.master;
          const todos = member.todos || [];
          const isExpanded = expanded === member.tag;
          const doneCount = todos.filter(t => t.status === 'done').length;

          return (
            <div key={member.tag} className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${isMe ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`, background: isMe ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)' }}>
              {/* Member Header */}
              <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => setExpanded(isExpanded ? null : member.tag)}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                  style={{ background: isMe ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.1)', color: isMe ? '#a78bfa' : 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white truncate" style={{ fontWeight: 600 }}>{member.name}</span>
                    {isMaster && <Crown size={11} className="text-yellow-400 shrink-0" />}
                    <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{member.tag}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{member.role}</span>
                    {todos.length > 0 && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        · {doneCount}/{todos.length} 완료
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {todos.length > 0 && (
                    <div className="flex gap-1">
                      {(['todo', 'inprogress', 'done'] as MemberTodo['status'][]).map(s => {
                        const count = todos.filter(t => t.status === s).length;
                        if (count === 0) return null;
                        return (
                          <span key={s} className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: TODO_STATUS[s].bg, color: TODO_STATUS[s].color }}>
                            {count}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {isExpanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                </div>
              </button>

              {/* Expanded: Todo List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      {/* My add input */}
                      {isMe && (
                        <div className="flex gap-2 pt-3">
                          <input
                            type="text"
                            value={newTexts[member.tag] || ''}
                            onChange={e => setNewTexts(p => ({ ...p, [member.tag]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(member.tag); }}
                            placeholder="할 일 추가..."
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                          />
                          <button onClick={() => handleAdd(member.tag)}
                            className="px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                            <Plus size={12} />
                          </button>
                        </div>
                      )}

                      {todos.length === 0 && (
                        <p className="text-xs text-center py-3 pt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {isMe ? '할 일을 추가해보세요!' : '등록된 할 일이 없어요.'}
                        </p>
                      )}

                      <AnimatePresence>
                        {todos.map(todo => {
                          const st = TODO_STATUS[todo.status];
                          const isEditing = editingTodo?.tag === member.tag && editingTodo?.id === todo.id;

                          return (
                            <motion.div key={todo.id}
                              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                              className="flex items-center gap-2 group rounded-lg px-2 py-1.5"
                              style={{ background: 'rgba(255,255,255,0.03)' }}>
                              {/* Status — 클릭으로 순환 */}
                              {isMe ? (
                                <button
                                  onClick={() => cycleStatus(member.tag, todo.id, todo.status)}
                                  className="shrink-0 px-1.5 py-0.5 rounded-md text-xs transition-all hover:opacity-80 active:scale-95"
                                  title="클릭해서 상태 변경"
                                  style={{
                                    background: TODO_STATUS[todo.status].bg,
                                    color: TODO_STATUS[todo.status].color,
                                    border: `1px solid ${TODO_STATUS[todo.status].border}`,
                                    minWidth: '52px',
                                  }}
                                >
                                  {TODO_STATUS[todo.status].label}
                                </button>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md text-xs shrink-0"
                                  style={{ background: TODO_STATUS[todo.status].bg, color: TODO_STATUS[todo.status].color, border: `1px solid ${TODO_STATUS[todo.status].border}` }}>
                                  {TODO_STATUS[todo.status].label}
                                </span>
                              )}

                              {/* Text / edit */}
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingTodo.text}
                                  onChange={e => setEditingTodo(p => p ? { ...p, text: e.target.value } : p)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      updateMemberTodo(team.id, member.tag, todo.id, { text: editingTodo!.text });
                                      setEditingTodo(null);
                                    }
                                    if (e.key === 'Escape') setEditingTodo(null);
                                  }}
                                  className="flex-1 px-2 py-0.5 rounded-lg text-xs outline-none"
                                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(124,58,237,0.4)', color: '#fff' }}
                                  autoFocus
                                />
                              ) : (
                                <span className="flex-1 text-xs" style={{ color: todo.status === 'done' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)', textDecoration: todo.status === 'done' ? 'line-through' : 'none' }}>
                                  {todo.text}
                                </span>
                              )}

                              {/* My controls */}
                              {isMe && !isEditing && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingTodo({ tag: member.tag, id: todo.id, text: todo.text })}
                                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    <Edit3 size={11} />
                                  </button>
                                  <button onClick={() => deleteMemberTodo(team.id, member.tag, todo.id)}
                                    style={{ color: 'rgba(239,68,68,0.5)' }}>
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Applicant Detail Modal ───────────────────────────────────
function ApplicantDetailModal({ app, isLocked, teamId, onClose }: {
  app: Applicant; isLocked: boolean; teamId: string; onClose: () => void;
}) {
  const handleAction = (action: 'accept' | 'reject') => {
    if (isLocked) { toast.error('팀 확정 상태입니다. 팀 수정 버튼을 눌러주세요.'); return; }
    manageApplicant(teamId, app.tag, action);
    toast.success(action === 'accept' ? '✅ 팀원이 합류했어요!' : '❌ 지원이 거절됐어요.');
    onClose();
  };

  // 지원자 티어/수상/참가 정보 계산
  const appXP = calculateXP(app.tag);
  const appTier = getTierFromXP(appXP.total);
  const appAwards = getUserAwards(app.tag);
  const appHackathonCount = getUserTotalHackathonCount(app.tag);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 10 }}
        className="w-full max-w-md rounded-2xl p-6 overflow-y-auto"
        style={{ background: '#0d0d1f', border: '1px solid rgba(124,58,237,0.3)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white" style={{ fontWeight: 700 }}>지원자 상세 정보</h3>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 mb-5 p-4 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontWeight: 700 }}>
            {app.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white" style={{ fontWeight: 700 }}>{app.name}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{app.tag}</span>
            </div>
            {app.selectedRole && (
              <span className="text-xs px-2 py-0.5 rounded-lg mt-1 inline-block"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>
                {app.selectedRole} 지원
              </span>
            )}
          </div>
        </div>

        {/* 지원자 신뢰도 스탯 — 티어 / 수상 / 참가 횟수 */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl gap-1"
            style={{ background: appTier.bgColor, border: `1px solid ${appTier.borderColor}` }}>
            <TierBadge
              tierId={appTier.id}
              tierName={appTier.name}
              color={appTier.color}
              bgColor="transparent"
              borderColor="transparent"
              size="sm"
            />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>티어</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl gap-1"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-base">{appAwards.length > 0 ? (appAwards[0].rank === 1 ? '🥇' : appAwards[0].rank === 2 ? '🥈' : '🥉') : '—'}</span>
            <span className="text-xs" style={{ color: '#fbbf24', fontWeight: 700 }}>{appAwards.length}건</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>수상</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl gap-1"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <span className="text-sm" style={{ color: '#60a5fa', fontWeight: 800 }}>{appHackathonCount}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>대회 참가</span>
          </div>
        </div>

        {/* 수상 내역 목록 */}
        {appAwards.length > 0 && (
          <div className="mb-4 p-3 rounded-xl space-y-1.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>수상 내역</p>
            {appAwards.map((award, i) => {
              const rl = RANK_LABELS[award.rank];
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{rl.emoji}</span>
                  <span style={{ color: rl.color, fontWeight: 600 }}>{rl.label}</span>
                  <span className="truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{award.hackathonTitle}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tech Stack — 포지션별 그룹 표시 */}
        {app.techStack.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>기술 스택</p>
            <div className="space-y-2.5">
              {app.techStack.map(ts => {
                const colors = CATEGORY_COLORS[ts.category as TechCategory] || CATEGORY_COLORS.Frontend;
                return (
                  <div key={ts.category} className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {/* 포지션 헤더 */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs ${colors.bg} ${colors.text}`}
                        style={{ fontWeight: 700, border: `1px solid rgba(255,255,255,0.08)` }}>
                        {ts.category}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {ts.skills.length > 0 ? `${ts.skills.length}개 스킬` : '스킬 미등록'}
                      </span>
                    </div>
                    {/* 스킬 태그 */}
                    {ts.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {ts.skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 rounded-md text-xs"
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message */}
        {app.message && (
          <div className="mb-5">
            <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>팀장에게 메시지</p>
            <p className="text-sm p-3 rounded-xl leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              "{app.message}"
            </p>
          </div>
        )}

        {/* Status indicator */}
        {app.status !== 'pending' && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: app.status === 'accepted' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${app.status === 'accepted' ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.2)'}`,
            }}>
            {app.status === 'accepted' ? <CheckCircle size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
            <span className="text-xs" style={{ color: app.status === 'accepted' ? '#34d399' : '#f87171' }}>
              {app.status === 'accepted' ? '이미 수락된 지원입니다.' : '이미 거절된 지원입니다.'}
            </span>
          </div>
        )}

        {/* Actions */}
        {app.status === 'pending' && (
          <div className="flex gap-3">
            <button onClick={() => handleAction('reject')}
              disabled={isLocked}
              className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', opacity: isLocked ? 0.5 : 1 }}>
              <XCircle size={14} /> 거절
            </button>
            <button onClick={() => handleAction('accept')}
              disabled={isLocked}
              className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)', opacity: isLocked ? 0.5 : 1 }}>
              <CheckCircle size={14} /> 수락
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────
function InviteModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const [tagInput, setTagInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    const raw = tagInput.trim();
    const tag = raw.startsWith('#') ? raw : `#${raw}`;
    if (tag === '#') { toast.error('유저 태그를 입력해주세요.'); return; }
    if (team.lookingFor.length > 0 && !selectedRole) {
      toast.error('초대 포지션을 선택해주세요.');
      return;
    }

    setSending(true);
    await new Promise(r => setTimeout(r, 400));
    const result = sendInvitation(team.id, tag, selectedRole || undefined);
    setSending(false);

    if (result === 'already_member') { toast.error('이미 팀에 있는 멤버예요.'); return; }
    if (result === 'already_invited') { toast.error('이미 초대한 사용자예요.'); return; }
    if (result === 'self') { toast.error('본인은 초대할 수 없어요.'); return; }
    if (result === 'not_found') { toast.error('존재하지 않는 유저 태그입니다.'); return; }
    if (result === 'not_registered') { toast.error('해당 대회에 참가 신청을 하지 않은 유저입니다.'); return; }
    if (result === 'already_applicant') { toast.error('이미 나의 팀에 지원해서 대기 중인 지원자입니다.'); return; }
    if (result === 'already_in_team') { toast.error('이미 이 대회의 다른 팀에 소속된 유저입니다.'); return; }

    toast.success(`📩 ${tag}에게 초대를 보냈어요!`);
    setTagInput('');
    setSelectedRole('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#0d0d1f', border: '1px solid rgba(99,102,241,0.35)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-400" />
            <h3 className="text-white" style={{ fontWeight: 700 }}>팀원 초대</h3>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
        </div>

        {/* Tag input */}
        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>유저 태그 *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>#</span>
            <input type="text" value={tagInput}
              onChange={e => { let v = e.target.value; if (v.startsWith('#')) v = v.slice(1); setTagInput(v); }}
              onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
              placeholder="1234"
              className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            />
          </div>
        </div>

        {/* Position selection */}
        {team.lookingFor.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs mb-2" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              초대 포지션 *
            </label>
            <div className="flex flex-wrap gap-2">
              {team.lookingFor.map(lf => {
                const colors = CATEGORY_COLORS[lf.role as TechCategory] || CATEGORY_COLORS.Frontend;
                const isSelected = selectedRole === lf.role;
                return (
                  <button key={lf.role} onClick={() => setSelectedRole(isSelected ? '' : lf.role)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${isSelected ? `${colors.bg} ${colors.text}` : ''}`}
                    style={{
                      background: isSelected ? undefined : 'rgba(255,255,255,0.06)',
                      border: isSelected ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.1)',
                      color: isSelected ? undefined : 'rgba(255,255,255,0.55)',
                    }}>
                    {isSelected ? '✓ ' : ''}{lf.role}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={handleInvite} disabled={sending || !tagInput.trim()}
          className="w-full py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
          style={{ background: tagInput.trim() ? 'linear-gradient(135deg, #4f46e5, #4338ca)' : 'rgba(255,255,255,0.08)', opacity: sending ? 0.7 : 1 }}>
          {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail size={14} />}
          초대 보내기
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Sidebar: Applicants + Invites ────────────────────────────
function SidebarPanels({ team, isMaster, isLocked, onViewDetail }: {
  team: Team; isMaster: boolean; isLocked: boolean;
  onViewDetail: (app: Applicant) => void;
}) {
  const pendingApps = team.applicants.filter(a => a.status === 'pending');
  const pendingInvites = team.invitations.filter(i => i.status === 'pending');

  return (
    <>
      {/* Pending Applicants (팀장만) */}
      {isMaster && pendingApps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <h4 className="text-white text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 700 }}>
            <Zap size={13} className="text-yellow-400" />
            대기 중인 지원
            <span className="px-1.5 py-0.5 rounded-full text-xs animate-pulse"
              style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
              {pendingApps.length}
            </span>
          </h4>
          <div className="space-y-2">
            {pendingApps.map(app => (
              <div key={app.tag} className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontWeight: 700 }}>
                    {app.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-white truncate block" style={{ fontWeight: 600 }}>{app.name}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{app.tag}</span>
                  </div>
                </div>
                {app.selectedRole && (
                  <span className="text-xs px-1.5 py-0.5 rounded mb-2 inline-block"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                    {app.selectedRole}
                  </span>
                )}
                <button onClick={() => onViewDetail(app)}
                  className="w-full py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                  자세히 보기
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pending Invites */}
      {isMaster && pendingInvites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl p-4"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h4 className="text-white text-sm mb-3 flex items-center gap-2" style={{ fontWeight: 700 }}>
            <Clock size={13} className="text-indigo-400" />
            응답 대기 중인 초대
            <span className="px-1.5 py-0.5 rounded-full text-xs"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
              {pendingInvites.length}
            </span>
          </h4>
          <div className="space-y-2">
            {pendingInvites.map(inv => (
              <div key={inv.tag} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Mail size={12} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-white" style={{ fontWeight: 600 }}>
                      {inv.name === '알 수 없는 사용자' ? inv.tag : inv.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md shrink-0"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 600 }}>
                      {inv.tag}
                    </span>
                  </div>
                  {inv.selectedRole && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{inv.selectedRole}</span>
                  )}
                </div>
                {!isLocked && (
                  <button onClick={() => { cancelInvitation(team.id, inv.tag); toast.success('초대가 취소됐어요.'); }}
                    className="p-1 rounded-lg transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function TeamDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingTeamInfo, setEditingTeamInfo] = useState(false);
  const [teamDraft, setTeamDraft] = useState<Partial<Team>>({});
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferConfirmTarget, setTransferConfirmTarget] = useState<string | null>(null);
  const [detailApp, setDetailApp] = useState<Applicant | null>(null);

  useEffect(() => {
    const load = () => {
      if (!id) return;
      const data = getStorage();
      const found = data.teams.find(t => t.id === id);
      setTeam(found || null);
      setUserProfile(data.userProfile);
      if (found?.hackathonSlug) {
        setHackathon(data.hackathons.find(h => h.slug === found.hackathonSlug) || null);
      }
      if (found && !found.members.some(m => m.tag === data.userProfile.tag)) {
        toast.error('팀을 떠났습니다.');
        navigate('/camp');
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [id, navigate]);

  if (!team || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-96" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <div className="text-center"><AlertCircle size={32} className="mx-auto mb-3" /><p>팀을 찾을 수 없어요.</p></div>
      </div>
    );
  }

  const isMaster = team.master === userProfile.tag;
  const isLocked = (team.isTeamLocked ?? false) || !!team.submission;
  const pendingApps = team.applicants.filter(a => a.status === 'pending').length;
  const pendingInvites = team.invitations.filter(i => i.status === 'pending').length;

  const startEditTeam = () => {
    setTeamDraft({ teamName: team.teamName, intro: team.intro, contactUrl: team.contactUrl, isOpen: team.isOpen });
    setEditingTeamInfo(true);
  };
  const saveTeamInfo = () => {
    updateTeam(team.id, teamDraft);
    toast.success('팀 정보가 업데이트됐어요!');
    setEditingTeamInfo(false);
  };
  const handleLeave = () => {
    if (isMaster && team.members.length > 1) {
      toast.error('팀장은 팀을 떠날 수 없습니다. 다른 팀원에게 팀장 권한을 위임하시기 바랍니다.');
      setShowLeaveConfirm(false);
      return;
    }
    leaveTeam(team.id);
    toast.success('팀을 떠났어요.');
    navigate('/camp');
  };
  const handleTransferMaster = (newTag: string) => {
    transferMaster(team.id, newTag);
    setShowTransferModal(false);
    toast.success('👑 팀장 권한이 위임됐어요!');
  };
  const handleLockTeam = () => { lockTeam(team.id); setShowLockConfirm(false); toast.success('🔒 팀이 확정됐어요!'); };
  const handleUnlockTeam = () => { unlockTeam(team.id); toast.success('🔓 팀 수정 모드로 전환됐어요.'); };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate(hackathon ? `/hackathons/${hackathon.slug}` : '/camp')}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
          <ArrowLeft size={15} />{hackathon ? hackathon.title : '팀 목록'}
        </button>

        {/* Header */}
        <div className="rounded-3xl p-6 mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                  Team Dashboard
                </span>
                {isMaster && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                    <Crown size={10} />팀장
                  </span>
                )}
                {isLocked && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }}>
                    <Lock size={10} />팀 확정됨
                  </span>
                )}
                {pendingApps > 0 && !isLocked && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full animate-pulse"
                    style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                    지원자 {pendingApps}명
                  </span>
                )}
                {pendingInvites > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                    초대 {pendingInvites}건
                  </span>
                )}
              </div>

              {editingTeamInfo ? (
                <input type="text" value={teamDraft.teamName || ''}
                  onChange={e => setTeamDraft(p => ({ ...p, teamName: e.target.value }))}
                  className="text-2xl bg-transparent outline-none border-b pb-1 mb-2"
                  style={{ color: '#fff', borderColor: 'rgba(124,58,237,0.5)', fontFamily: 'var(--font-display)', fontWeight: 800 }}
                />
              ) : (
                <h1 className="text-2xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                  {team.teamName}
                </h1>
              )}

              {hackathon && (
                <Link to={`/hackathons/${hackathon.slug}`} className="text-sm flex items-center gap-1"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {hackathon.title}<ExternalLink size={11} />
                </Link>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
              {editingTeamInfo ? (
                <>
                  <button onClick={() => setEditingTeamInfo(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                    <X size={14} /> 취소
                  </button>
                  <button onClick={saveTeamInfo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white"
                    style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)' }}>
                    <Save size={14} /> 저장
                  </button>
                </>
              ) : (
                <>
                  {isMaster && !isLocked && (
                    <button onClick={startEditTeam}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                      <Settings size={14} />설정
                    </button>
                  )}
                  {/* 팀원 초대 — 팀 확정과 팀 떠나기 사이 */}
                  {isMaster && (
                    isLocked ? (
                      team.isFinalized || !!team.submission ? (
                        <button
                          disabled
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', cursor: 'not-allowed', opacity: 0.7 }}>
                          <ShieldCheck size={14} />제출 완료
                        </button>
                      ) : (
                        <button onClick={handleUnlockTeam}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                          style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}>
                          <PenLine size={14} />팀 수정
                        </button>
                      )
                    ) : (
                      <button onClick={() => setShowLockConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 2px 10px rgba(124,58,237,0.4)' }}>
                        <ShieldCheck size={14} />팀 확정
                      </button>
                    )
                  )}
                  {/* 팀장 위임 — 팀장이고 팀원 2명 이상, 팀 확정 전, 최종 제출 전일 때 */}
                  {isMaster && team.members.length > 1 && !isLocked && !team.isFinalized && (
                    <button onClick={() => setShowTransferModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                      style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                      <ArrowRightLeft size={14} />팀장 위임
                    </button>
                  )}
                  {/* 팀원 초대 — 팀 확정 전에만 표시 */}
                  {isMaster && !isLocked && (
                    <button onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all hover:-translate-y-0.5"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
                      <UserPlus size={14} />팀원 초대
                    </button>
                  )}
                  {!isLocked && (
                    <button onClick={() => setShowLeaveConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                      <LogOut size={14} />팀 떠나기
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: '팀원', value: `${team.members.length}명`, sub: team.hackathonSlug ? '참가 중' : '' },
              { label: '상태', value: isLocked ? '확정됨' : team.isOpen ? '모집중' : '마감', sub: team.lookingFor.map(l => l.role).join(', ') || '-' },
              { label: '제출', value: team.isFinalized ? '완료' : '미제출', sub: team.submission ? new Date(team.submission.submittedAt).toLocaleDateString('ko-KR') : '' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-white text-sm" style={{ fontWeight: 700 }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                {sub && <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-5">
            <MemoSection team={team} userProfile={userProfile} />
            <MemberTasks team={team} userProfile={userProfile} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Dynamic: applicants + invites */}
            <SidebarPanels team={team} isMaster={isMaster} isLocked={isLocked} onViewDetail={setDetailApp} />

            {/* Team Info */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>팀 소개</h3>
              {editingTeamInfo ? (
                <>
                  <textarea value={teamDraft.intro || ''}
                    onChange={e => setTeamDraft(p => ({ ...p, intro: e.target.value }))}
                    rows={4} className="w-full text-xs outline-none resize-none rounded-xl p-3 mb-3"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                  />
                  {/* Recruitment toggle */}
                  <button onClick={() => setTeamDraft(p => ({ ...p, isOpen: !p.isOpen }))}
                    className="flex items-center gap-3 w-full">
                    <div className="w-10 h-6 rounded-full transition-all relative shrink-0"
                      style={{ background: teamDraft.isOpen ? '#7c3aed' : 'rgba(255,255,255,0.15)' }}>
                      <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: teamDraft.isOpen ? '20px' : '4px' }} />
                    </div>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {teamDraft.isOpen ? '모집 중' : '모집 마감'}
                    </span>
                  </button>
                </>
              ) : (
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{team.intro}</p>
              )}
            </div>

            {/* Looking For */}
            {team.lookingFor.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>모집 포지션</h3>
                <div className="space-y-2">
                  {team.lookingFor.map((lf, i) => {
                    const colors = CATEGORY_COLORS[lf.role as TechCategory] || CATEGORY_COLORS.Frontend;
                    return (
                      <div key={i}>
                        <span className={`px-2.5 py-1 rounded-lg text-xs mb-1.5 inline-block ${colors.bg} ${colors.text}`} style={{ fontWeight: 600 }}>{lf.role}</span>
                        {lf.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lf.skills.map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded text-xs"
                                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            {(team.contactUrl || editingTeamInfo) && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>연락처</h3>
                {editingTeamInfo ? (
                  <input type="text" value={teamDraft.contactUrl || ''}
                    onChange={e => setTeamDraft(p => ({ ...p, contactUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                  />
                ) : (
                  <a href={team.contactUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-xs" style={{ color: '#a78bfa' }}>
                    <ExternalLink size={13} />
                    {team.contactUrl.length > 40 ? team.contactUrl.slice(0, 40) + '...' : team.contactUrl}
                  </a>
                )}
              </div>
            )}

            {/* Submit CTA */}
            {hackathon && !team.isFinalized && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}>
                <h3 className="text-white text-sm mb-2" style={{ fontWeight: 700 }}>프로젝트 제출</h3>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{hackathon.endDate}까지 제출해야 해요.</p>
                <Link to={`/hackathons/${hackathon.slug}`}
                  className="block w-full py-2 rounded-xl text-sm text-center text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                  제출하러 가기
                </Link>
              </div>
            )}

            {team.isFinalized && team.submission && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>제출 완료</h3>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {new Date(team.submission.submittedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowLeaveConfirm(false); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: '#0f0f1f', border: '1px solid rgba(239,68,68,0.3)' }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-white mb-2" style={{ fontWeight: 700 }}>팀 떠나기</h3>
              {isMaster && team.members.length > 1 ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                    <Crown size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>팀장은 팀을 떠날 수 없습니다.</span><br />
                      다른 팀원에게 팀장 권한을 위임하시기 바랍니다.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>취소</button>
                    <button
                      onClick={() => { setShowLeaveConfirm(false); setShowTransferModal(true); }}
                      className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
                      <ArrowRightLeft size={14} />팀장 위임하기
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {isMaster && team.members.length === 1 ? '팀원이 없으므로 팀이 삭제됩니다. 정말 떠나시겠어요?' : '팀을 떠나면 다시 합류하려면 재신청이 필요합니다.'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>취소</button>
                    <button onClick={handleLeave} className="flex-1 py-2.5 rounded-xl text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>떠나기</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {showTransferModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowTransferModal(false); setTransferConfirmTarget(null); } }}>
            <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 12 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: '#0d0d1f', border: '1px solid rgba(251,191,36,0.3)' }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.3), rgba(217,119,6,0.2))', border: '1px solid rgba(251,191,36,0.3)' }}>
                      <Crown size={16} className="text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 700 }}>팀장 권한 위임</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>위임할 팀원을 선택해주세요</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowTransferModal(false); setTransferConfirmTarget(null); }} style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              {transferConfirmTarget ? (
                <div className="px-6 py-8 text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
                    <Crown size={20} className="text-yellow-400" />
                  </div>
                  <p className="text-white text-sm mb-6 leading-relaxed">
                    해당 팀원에게 <span className="text-yellow-400 font-bold">팀장 권한을 위임</span>합니다.<br />
                    정말 진행하시겠습니까? (되돌릴 수 없습니다)
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setTransferConfirmTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm transition-all" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>취소</button>
                    <button onClick={() => { handleTransferMaster(transferConfirmTarget); setTransferConfirmTarget(null); }} className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-95" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}>
                      <Crown size={14} />위임하기
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Member List */}
                  <div className="px-6 py-4 space-y-2">
                    {team.members
                      .filter(m => m.tag !== userProfile.tag)
                      .map(member => (
                        <button
                          key={member.tag}
                          onClick={() => setTransferConfirmTarget(member.tag)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all group"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.1)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.35)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                          }}
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0"
                            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: '15px' }}>
                            {member.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white" style={{ fontWeight: 600 }}>{member.name}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{member.tag} · {member.role}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
                            <Crown size={11} />
                            위임
                          </div>
                        </button>
                      ))}
                  </div>
                  {/* Warning */}
                  <div className="px-6 pb-5">
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <p className="text-xs" style={{ color: 'rgba(248,113,113,0.9)', lineHeight: 1.6 }}>
                        ⚠️ 팀장 위임 후에는 되돌릴 수 없습니다. 신중하게 선택해주세요.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {showLockConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowLockConfirm(false); }}>
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ background: '#0d0d1f', border: '1px solid rgba(124,58,237,0.35)' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <h3 className="text-white" style={{ fontWeight: 700 }}>팀 구성 확정</h3>
              </div>
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                확정하면 <span style={{ color: '#f87171' }}>신규 지원 접수와 초대 발송이 중단</span>됩니다.
              </p>
              <div className="mb-5 px-3 py-2.5 rounded-xl space-y-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>팀 수정 버튼</span>으로 언제든 되돌릴 수 있어요.
                </p>
                <p className="text-xs" style={{ color: 'rgba(248,113,113,0.85)', fontWeight: 500 }}>
                  최종 제출을 완료하면 팀 수정이 불가능합니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLockConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>취소</button>
                <button onClick={handleLockTeam}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
                  <ShieldCheck size={14} />확정하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showInviteModal && (
          <InviteModal team={team} onClose={() => setShowInviteModal(false)} />
        )}

        {detailApp && (
          <ApplicantDetailModal
            app={detailApp}
            isLocked={isLocked}
            teamId={team.id}
            onClose={() => setDetailApp(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}