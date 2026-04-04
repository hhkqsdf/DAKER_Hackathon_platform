import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, CheckCircle, Circle, Plus, Trash2,
  Target, BookOpen, ChevronRight, ChevronLeft, X, Edit3, Save,
} from 'lucide-react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getStorage, Hackathon, updatePersonalData, addPersonalTodo,
  togglePersonalTodo, deletePersonalTodo, getUserTeamForHackathon,
  addPersonalMemo, deletePersonalMemo, updatePersonalMemo, PersonalMemo,
} from '../../lib/storage';
import { PHASE_LABELS } from '../../lib/constants';

// ─── Personal Memos (multi-memo) ──────────────────────────────
function PersonalMemoSection({
  memos,
  slug,
}: {
  memos: PersonalMemo[];
  slug: string;
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 200));
    addPersonalMemo(slug, input.trim());
    setInput('');
    setSending(false);
  };

  const startEdit = (memo: PersonalMemo) => {
    setEditingId(memo.id);
    setEditingText(memo.content);
  };

  const confirmEdit = (memoId: string) => {
    if (!editingText.trim()) return;
    updatePersonalMemo(slug, memoId, editingText.trim());
    setEditingId(null);
    setEditingText('');
    toast.success('메모를 수정했어요.');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const sorted = [...memos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h3 className="text-white mb-4 flex items-center gap-2" style={{ fontWeight: 700 }}>
        <BookOpen size={15} className="text-violet-400" />
        개인 메모
      </h3>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="메모 추가..."
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
        />
        <button type="submit" disabled={sending || !input.trim()}
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            background: input.trim() ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.07)',
            color: input.trim() ? '#a78bfa' : 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
          <Send size={14} />
        </button>
      </form>

      {/* Memo List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence>
          {sorted.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
              아이디어나 기술 메모를 자유롭게 기록해보세요.
            </p>
          ) : sorted.map(memo => {
            const isEditing = editingId === memo.id;
            return (
              <motion.div
                key={memo.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="group flex gap-2"
              >
                <div className="flex-1 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(124,58,237,0.08)', border: `1px solid ${isEditing ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.15)'}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(memo.createdAt).toLocaleString('ko-KR', {
                        month: 'numeric', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => confirmEdit(memo.id)}
                            style={{ color: 'rgba(52,211,153,0.8)' }}
                            title="저장"
                          >
                            <Save size={11} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{ color: 'rgba(255,255,255,0.4)' }}
                            title="취소"
                          >
                            <X size={11} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(memo)}
                            style={{ color: 'rgba(124,58,237,0.7)' }}
                            title="수정"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            onClick={() => { deletePersonalMemo(slug, memo.id); toast.success('메모를 삭제했어요.'); }}
                            style={{ color: 'rgba(239,68,68,0.5)' }}
                            title="삭제"
                          >
                            <X size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editingText}
                      onChange={e => setEditingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit(memo.id); }
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                      rows={3}
                      className="w-full text-sm outline-none resize-none rounded-lg px-2 py-1"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(124,58,237,0.3)', color: '#fff', lineHeight: 1.5 }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>
                      {memo.content}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function PersonalDashboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean; createdAt: string }[]>([]);
  const [phase, setPhase] = useState(0);
  const [memos, setMemos] = useState<PersonalMemo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const load = () => {
      if (!slug) return;
      const { hackathons, userProfile } = getStorage();
      const found = hackathons.find(h => h.slug === slug);
      setHackathon(found || null);

      const pd = userProfile.personalData[slug];
      if (pd) {
        setTodos(pd.todos || []);
        setPhase(pd.phase || 0);
        setMemos(pd.memos || []);
      }

      const team = getUserTeamForHackathon(slug);
      if (team) navigate(`/teams/${team.id}`, { replace: true });
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [slug, navigate]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !newTodo.trim()) return;
    addPersonalTodo(slug, newTodo.trim());
    setNewTodo('');
    toast.success('할 일이 추가됐어요!');
  };

  const handleSetPhase = (p: number) => {
    if (!slug || p < 0 || p >= PHASE_LABELS.length) return;
    updatePersonalData(slug, { phase: p });
    toast.success(`${PHASE_LABELS[p].icon} ${PHASE_LABELS[p].label} 단계로 이동했어요!`);
  };

  const completed = todos.filter(t => t.completed).length;
  const progress = todos.length > 0 ? Math.round((completed / todos.length) * 100) : 0;
  const maxPhase = PHASE_LABELS.length - 1;

  if (!hackathon) {
    return (
      <div className="flex items-center justify-center min-h-96" style={{ color: 'rgba(255,255,255,0.3)' }}>
        <p>해커톤 정보를 찾을 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button onClick={() => navigate(`/hackathons/${slug}`)}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
        <ArrowLeft size={15} />해커톤 페이지
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            Free Agent
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{hackathon.title}</span>
        </div>
        <h1 className="text-2xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          개인 대시보드
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>나만의 페이스로 해커톤을 준비하세요.</p>
      </div>

      {/* ── Compact Roadmap ── */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white" style={{ fontWeight: 700 }}>단계별 로드맵</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleSetPhase(phase - 1)} disabled={phase === 0}
              className="p-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: phase === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: phase === 0 ? 'not-allowed' : 'pointer' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', minWidth: '52px', textAlign: 'center' }}>
              {phase + 1}/{PHASE_LABELS.length}
            </span>
            <button onClick={() => handleSetPhase(phase + 1)} disabled={phase === maxPhase}
              className="p-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', color: phase === maxPhase ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: phase === maxPhase ? 'not-allowed' : 'pointer' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar segments */}
        <div className="flex items-center gap-1 mb-3">
          {PHASE_LABELS.map((pl, i) => (
            <button key={pl.phase} onClick={() => handleSetPhase(i)}
              className="flex-1 h-1.5 rounded-full transition-all hover:opacity-80"
              title={pl.label}
              style={{
                background: i < phase ? '#34d399' : i === phase ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                boxShadow: i === phase ? '0 0 6px rgba(124,58,237,0.6)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Current phase + quick jumps */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{PHASE_LABELS[phase].icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white" style={{ fontWeight: 700 }}>{PHASE_LABELS[phase].label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa' }}>현재</span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{PHASE_LABELS[phase].desc}</p>
          </div>
          <div className="flex gap-1">
            {PHASE_LABELS.map((pl, i) => (
              <button key={pl.phase} onClick={() => handleSetPhase(i)} title={pl.label}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110"
                style={{
                  background: i < phase ? 'rgba(52,211,153,0.2)' : i === phase ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i < phase ? 'rgba(52,211,153,0.3)' : i === phase ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {i < phase ? '✓' : pl.icon}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Todo List */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white flex items-center gap-2" style={{ fontWeight: 700 }}>
                  <Target size={16} className="text-violet-400" />할 일 목록
                </h2>
                {todos.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {completed}/{todos.length} 완료 ({progress}%)
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {todos.length > 0 && (
              <div className="h-1.5 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #34d399)' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}

            {/* Add Todo */}
            <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
              <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)}
                placeholder="새 할 일 추가..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
              />
              <button type="submit"
                className="px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)' }}>
                <Plus size={16} />
              </button>
            </form>

            {/* Todo Items */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              <AnimatePresence>
                {todos.length === 0 ? (
                  <div className="text-center py-10" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    <Target size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">할 일을 추가해 관리해 보세요!</p>
                  </div>
                ) : todos.map(todo => (
                  <motion.div key={todo.id}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl group"
                    style={{ background: todo.completed ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => { if (slug) togglePersonalTodo(slug, todo.id); }}>
                      {todo.completed ? (
                        <CheckCircle size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      )}
                    </button>
                    <span className="flex-1 text-sm"
                      style={{ color: todo.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.text}
                    </span>
                    <button onClick={() => { if (slug) deletePersonalTodo(slug, todo.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'rgba(239,68,68,0.6)' }}>
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right: Memos + Quick Links */}
        <div className="space-y-5">
          {/* Personal Memos */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {slug && <PersonalMemoSection memos={memos} slug={slug} />}
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 space-y-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>퀵 링크</h3>
            <Link to={`/hackathons/${slug}`}
              className="flex items-center justify-between p-3 rounded-xl transition-all text-sm"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa' }}>
              프로젝트 제출<ChevronRight size={14} />
            </Link>
            <Link to={`/camp?hackathon=${slug}`}
              className="flex items-center justify-between p-3 rounded-xl transition-all text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
              팀 찾기<ChevronRight size={14} />
            </Link>
            <Link to={`/hackathons/${slug}`}
              className="flex items-center justify-between p-3 rounded-xl transition-all text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }}>
              대회 정보<ChevronRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}