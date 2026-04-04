// ============================================================
// DAKER — XP & Tier System
// ============================================================

import { getStorage } from './storage';

// ─── Tier Definitions ─────────────────────────────────────────

export interface TierInfo {
  id: string;
  name: string;
  xpMin: number;
  xpMax: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
}

export const TIERS: TierInfo[] = [
  {
    id: 'script',
    name: 'Script',
    xpMin: 0,
    xpMax: 200,
    color: '#94a3b8',
    bgColor: 'rgba(148,163,184,0.12)',
    borderColor: 'rgba(148,163,184,0.3)',
    glowColor: 'rgba(148,163,184,0.25)',
    description: '여정의 시작. 첫 코드를 쓴 자들.',
  },
  {
    id: 'compiler',
    name: 'Compiler',
    xpMin: 201,
    xpMax: 1200,
    color: '#34d399',
    bgColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.3)',
    glowColor: 'rgba(52,211,153,0.25)',
    description: '아이디어를 실행으로 번역하는 자.',
  },
  {
    id: 'debugger',
    name: 'Debugger',
    xpMin: 1201,
    xpMax: 4000,
    color: '#60a5fa',
    bgColor: 'rgba(96,165,250,0.12)',
    borderColor: 'rgba(96,165,250,0.3)',
    glowColor: 'rgba(96,165,250,0.25)',
    description: '문제의 근원을 파고드는 집요한 탐색자.',
  },
  {
    id: 'architect',
    name: 'Architect',
    xpMin: 4001,
    xpMax: 10000,
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.3)',
    glowColor: 'rgba(167,139,250,0.25)',
    description: '시스템 전체를 설계하는 구조의 마스터.',
  },
  {
    id: 'kernel',
    name: 'Kernel',
    xpMin: 10001,
    xpMax: null,
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.12)',
    borderColor: 'rgba(251,191,36,0.35)',
    glowColor: 'rgba(251,191,36,0.35)',
    description: '모든 것의 핵심. 전설의 영역.',
  },
];

export function getTierFromXP(xp: number): TierInfo {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].xpMin) return TIERS[i];
  }
  return TIERS[0];
}

export function getNextTier(tier: TierInfo): TierInfo | null {
  const idx = TIERS.findIndex(t => t.id === tier.id);
  return TIERS[idx + 1] ?? null;
}

// ─── XP Breakdown ─────────────────────────────────────────────

export interface XPBreakdown {
  total: number;
  fromHackathons: number;
  sincereMsg: number;
  matchKing: number;
  lateCancelPenalty: number;
}

// ─── Late Cancel Storage ──────────────────────────────────────

const LATE_CANCEL_KEY = 'daker_late_cancels';

export function getLateCancels(): Record<string, number> {
  try {
    const str = localStorage.getItem(LATE_CANCEL_KEY);
    return str ? JSON.parse(str) : {};
  } catch {
    return {};
  }
}

export function addLateCancel(tag: string): void {
  const cancels = getLateCancels();
  cancels[tag] = (cancels[tag] || 0) + 1;
  localStorage.setItem(LATE_CANCEL_KEY, JSON.stringify(cancels));
}

// ─── XP Calculation ───────────────────────────────────────────

/**
 * 특정 유저 태그의 XP를 계산합니다.
 * - fromHackathons: P_base × W_rank (리더보드 기반)
 * - sincereMsg: 100자 이상 지원 메세지당 +20 XP
 * - matchKing: 수락 후 완주 시 +50 XP
 * - lateCancelPenalty: 수락 상태에서 취소 시 -100 XP
 */
export function calculateXP(tag: string): XPBreakdown {
  const { teams, hackathons, leaderboards } = getStorage();

  let fromHackathons = 0;
  let sincereMsg = 0;
  let matchKing = 0;

  // 1. 해커톤 성과 XP (리더보드 기반)
  const myEntries = leaderboards.filter(l => l.memberTags.includes(tag));
  for (const entry of myEntries) {
    const hackathon = hackathons.find(h => h.slug === entry.hackathonSlug);
    if (!hackathon) continue;

    // P_base: 기간 기반
    const startMs = new Date(hackathon.startDate).getTime();
    const endMs = new Date(hackathon.endDate).getTime();
    const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
    const P_base = days < 14 ? 100 : days <= 28 ? 250 : 500;

    // W_rank: 순위 가중치
    const W_rank =
      entry.rank === 1 ? 5 :
      entry.rank === 2 ? 3 :
      entry.rank === 3 ? 2 : 1; // 완주 포함

    fromHackathons += P_base * W_rank;
  }

  // 2. C_bonus: Sincere Msg (+20 XP per qualifying message)
  for (const team of teams) {
    const applicant = team.applicants.find(a => a.tag === tag);
    if (applicant && applicant.message && applicant.message.length >= 100) {
      sincereMsg += 20;
    }
  }

  // 3. C_bonus: Match King (+50 XP per accepted + completed)
  for (const team of teams) {
    const applicant = team.applicants.find(a => a.tag === tag && a.status === 'accepted');
    if (applicant) {
      const hasEntry = leaderboards.some(l => l.teamId === team.id);
      if (hasEntry) matchKing += 50;
    }
  }

  // 4. Late Cancel penalty
  const cancels = getLateCancels();
  const lateCancelPenalty = (cancels[tag] || 0) * 100;

  const total = Math.max(0, fromHackathons + sincereMsg + matchKing - lateCancelPenalty);

  return { total, fromHackathons, sincereMsg, matchKing, lateCancelPenalty };
}

// ─── Award Entry ──────────────────────────────────────────────

export interface AwardEntry {
  hackathonTitle: string;
  hackathonSlug: string;
  rank: number;
  teamName: string;
  score: number;
}

export function getUserAwards(tag: string): AwardEntry[] {
  const { leaderboards, hackathons } = getStorage();
  return leaderboards
    .filter(l => l.memberTags.includes(tag) && l.rank >= 1 && l.rank <= 3)
    .map(l => {
      const h = hackathons.find(h => h.slug === l.hackathonSlug);
      return {
        hackathonTitle: h?.title ?? l.hackathonSlug,
        hackathonSlug: l.hackathonSlug,
        rank: l.rank,
        teamName: l.teamName,
        score: l.score,
      };
    })
    .sort((a, b) => a.rank - b.rank);
}

export function getUserTotalHackathonCount(tag: string): number {
  const { leaderboards } = getStorage();
  const slugs = new Set(
    leaderboards.filter(l => l.memberTags.includes(tag)).map(l => l.hackathonSlug)
  );
  return slugs.size;
}

export const RANK_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: '우승', emoji: '🥇', color: '#fbbf24' },
  2: { label: '준우승', emoji: '🥈', color: '#94a3b8' },
  3: { label: '입상', emoji: '🥉', color: '#d97706' },
};