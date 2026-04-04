// ============================================================
// DAKER - Single Source of Truth (SSOT)
// All data operations go through this module
// ============================================================

import { getRoleProximityScore } from './constants';

// ─── Interfaces ──────────────────────────────────────────────

export interface UserProfile {
  name: string;
  tag: string;
  bio: string;
  techStack: TechStack[];
  joinedHackathons: string[];
  personalData: Record<string, PersonalHackathonData>;
}

export interface PersonalHackathonData {
  todos: Todo[];
  phase: number;
  notes: string;
  memos?: PersonalMemo[];
  personalSubmission?: Submission;
}

export interface PersonalMemo {
  id: string;
  content: string;
  createdAt: string;
}

export interface TechStack {
  category: string;
  skills: string[];
}

export interface Hackathon {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  status: 'ongoing' | 'upcoming' | 'ended';
  tags: string[];
  startDate: string;
  endDate: string;
  totalPrize: string;
  prizeDetails: PrizeDetail[];
  maxTeamSize: number;
  participantCount: number;
  evaluationCriteria: EvaluationCriteria[];
  schedule: ScheduleItem[];
  guidelines: string[];
  submissionRequirements: string[];
  organizer: string;
  scoringType: 'evaluation' | 'voting';
}

export interface PrizeDetail {
  rank: string;
  amount: string;
  description?: string;
}

export interface EvaluationCriteria {
  name: string;
  weight: number;
  description: string;
}

export interface ScheduleItem {
  date: string;
  title: string;
  description: string;
  milestone?: boolean;
}

export interface Team {
  id: string;
  teamName: string;
  hackathonSlug: string | null;
  members: TeamMember[];
  master: string;
  isOpen: boolean;
  lookingFor: LookingFor[];
  contactUrl: string;
  intro: string;
  quickMemos: QuickMemo[];
  isFinalized: boolean;
  isTeamLocked: boolean;
  applicants: Applicant[];
  invitations: Invitation[];
  todos: Todo[];
  submission?: Submission;
  finalRank?: number;
  finalScore?: number;
  createdAt: string;
}

export interface TeamMember {
  tag: string;
  name: string;
  role: string;
  joinedAt: string;
  currentTask: string;
  todos?: MemberTodo[];
  skills?: string[];   // 포지션별 서브 기술 스택
  bio?: string;        // 한 줄 소개
}

export interface LookingFor {
  role: string;
  skills: string[];
  count: number;
}

export interface QuickMemo {
  id: string;
  authorTag: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Applicant {
  tag: string;
  name: string;
  message: string;
  selectedRole: string;
  techStack: TechStack[];
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Invitation {
  tag: string;
  name: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  selectedRole?: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface MemberTodo {
  id: string;
  text: string;
  status: 'todo' | 'inprogress' | 'done';
  createdAt: string;
}

export interface Submission {
  notes: string;
  fileUrl?: string;
  attachedFiles?: AttachedFile[];
  submittedAt: string;
  score?: number;
}

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface LeaderboardEntry {
  id: string;
  teamId: string;
  teamName: string;
  hackathonSlug: string;
  rank: number;
  score: number;
  memberTags: string[];
  memberNames: string[];
}

export interface StorageData {
  userProfile: UserProfile;
  hackathons: Hackathon[];
  teams: Team[];
  leaderboards: LeaderboardEntry[];
}

// ─── Storage Keys ─────────────────────────────────────────────

const KEYS = {
  USER: 'daker_user',
  HACKATHONS: 'daker_hackathons',
  TEAMS: 'daker_teams',
  LEADERBOARDS: 'daker_leaderboards',
  INIT: 'daker_initialized_v5', // bumped to v5
};

// ─── Initial Hackathons (4 ongoing · 1 upcoming · 5 ended) ────

const INITIAL_HACKATHONS: Hackathon[] = [
  // ── 진행 중 (4) ──────────────────────────────────────────
  {
    slug: 'ai-innovation-2026',
    title: 'AI Innovation Challenge 2026',
    description: '차세대 AI 애플리케이션을 만들어 현실의 문제를 해결하세요.',
    longDescription: `AI Innovation Challenge 2026은 국내 최대 규모의 AI 해커톤입니다. LLM, 컴퓨터 비전, 자연어 처리 등 다양한 AI 기술을 활용해 현실의 문제를 창의적으로 해결하는 팀을 찾습니다.\n\n참가자들은 48시간 동안 팀을 구성하고 프로토타입을 완성하며, 업계 전문가들로 구성된 심사위원단의 평가를 받게 됩니다. 최우수팀에게는 실제 투자 연결 기회도 제공됩니다.`,
    status: 'ongoing',
    tags: ['AI', 'LLM', 'ML', 'Computer Vision'],
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    totalPrize: '₩10,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩5,000,000', description: '상금 + 멘토링 패키지 + 투자사 미팅' },
      { rank: '🥈 2위', amount: '₩3,000,000', description: '상금 + 클라우드 크레딧' },
      { rank: '🥉 3위', amount: '₩2,000,000', description: '상금 + 교육 바우처' },
    ],
    maxTeamSize: 4,
    participantCount: 342,
    evaluationCriteria: [
      { name: '기술 혁신성', weight: 35, description: 'AI 기술의 창의적 활용 및 기술적 완성도' },
      { name: '비즈니스 임팩트', weight: 30, description: '실제 문제 해결 가능성 및 시장성' },
      { name: '완성도', weight: 20, description: '프로토타입의 작동 여부 및 UX 완성도' },
      { name: '발표력', weight: 15, description: '아이디어 전달력 및 Q&A 응답 능력' },
    ],
    schedule: [
      { date: '2026-03-01', title: '참가 신청 오픈', description: '공식 참가 신청 접수 시작', milestone: true },
      { date: '2026-03-15', title: '팀 빌딩 세션', description: '온라인 팀 매칭 이벤트 및 네트워킹' },
      { date: '2026-04-01', title: '해커톤 시작 🚀', description: '48시간 코딩 마라톤 시작', milestone: true },
      { date: '2026-04-15', title: '중간 체크포인트', description: '멘토 세션 및 중간 발표' },
      { date: '2026-04-28', title: '최종 제출 마감', description: '프로젝트 제출 마감 (23:59)', milestone: true },
      { date: '2026-04-30', title: '시상식', description: '최종 발표 및 시상식', milestone: true },
    ],
    guidelines: [
      '팀은 최소 2인, 최대 4인으로 구성되어야 합니다.',
      '제출물은 반드시 해커톤 기간 내에 개발된 코드여야 합니다.',
      '오픈소스 라이브러리 사용은 허용되나, 기존 상용 프로젝트의 재활용은 금지됩니다.',
      '모든 팀원이 최소 1회 이상 커밋 이력을 보유해야 합니다.',
      '제출 시 GitHub 링크와 데모 영상(3분 이내)을 포함해야 합니다.',
      '외부 API 사용 시 무료 티어 또는 오픈소스 대안을 우선 고려해 주세요.',
    ],
    submissionRequirements: [
      'GitHub 리포지토리 링크 (퍼블릭)',
      '3분 이내 데모 영상 링크',
      '서비스 소개서 (PDF, 최대 10장)',
      '팀 소개 및 역할 분담',
    ],
    organizer: 'DAKER Labs',
    scoringType: 'evaluation',
  },
  {
    slug: 'mobile-ux-2026',
    title: 'Mobile UX Grand Prix 2026',
    description: '사용자를 매료시키는 모바일 경험을 설계하고 구현하세요.',
    longDescription: `Mobile UX Grand Prix는 모바일 앱의 사용성과 디자인을 주제로 하는 해커톤입니다. React Native, Flutter, 혹은 네이티브로 만든 모바일 앱이라면 모두 참가 가능합니다.`,
    status: 'ongoing',
    tags: ['Mobile', 'UX', 'Design', 'React Native', 'Flutter'],
    startDate: '2026-03-10',
    endDate: '2026-04-20',
    totalPrize: '₩5,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩2,500,000' },
      { rank: '🥈 2위', amount: '₩1,500,000' },
      { rank: '🥉 3위', amount: '₩1,000,000' },
    ],
    maxTeamSize: 3,
    participantCount: 156,
    evaluationCriteria: [
      { name: 'UX 완성도', weight: 40, description: '직관성, 접근성, 사용 편의성' },
      { name: '비주얼 디자인', weight: 30, description: '심미성 및 브랜드 일관성' },
      { name: '기술 구현', weight: 20, description: '성능 및 코드 품질' },
      { name: '발표', weight: 10, description: '디자인 의사결정 설명 능력' },
    ],
    schedule: [
      { date: '2026-03-10', title: '해커톤 시작', description: '참가 신청 오픈', milestone: true },
      { date: '2026-04-05', title: '디자인 제출', description: '와이어프레임 및 목업 제출' },
      { date: '2026-04-18', title: '최종 제출', description: '완성된 앱 제출 마감', milestone: true },
      { date: '2026-04-20', title: '시상식', description: '결과 발표', milestone: true },
    ],
    guidelines: [
      '모바일 앱(iOS/Android)이어야 합니다.',
      '실제 디바이스 또는 시뮬레이터 데모가 필수입니다.',
    ],
    submissionRequirements: ['앱 APK/IPA 또는 TestFlight 링크', '디자인 원본 파일 (Figma)', '시연 영상'],
    organizer: 'UX Korea Community',
    scoringType: 'voting',
  },
  {
    slug: 'devops-cloud-2026',
    title: 'DevOps & Cloud Summit Hackathon 2026',
    description: '클라우드 네이티브 인프라와 자동화 파이프라인으로 개발 생산성의 한계를 뛰어넘으세요.',
    longDescription: `DevOps & Cloud Summit Hackathon은 클라우드 인프라, CI/CD 자동화, 컨테이너 오케스트레이션 등 DevOps 전반을 아우르는 기술 경연입니다.\n\nKubernetes, Terraform, GitHub Actions 등 최신 DevOps 도구를 활용해 개발 사이클을 혁신하는 솔루션을 만들어 주세요.`,
    status: 'ongoing',
    tags: ['DevOps', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'],
    startDate: '2026-02-15',
    endDate: '2026-05-15',
    totalPrize: '₩7,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩3,500,000', description: '상금 + AWS 크레딧 $5,000' },
      { rank: '🥈 2위', amount: '₩2,000,000', description: '상금 + GCP 크레딧 $2,000' },
      { rank: '🥉 3위', amount: '₩1,500,000', description: '상금 + 멘토링 세션' },
    ],
    maxTeamSize: 4,
    participantCount: 198,
    evaluationCriteria: [
      { name: '인프라 설계', weight: 35, description: '확장성·가용성·보안성을 고려한 아키텍처' },
      { name: '자동화 완성도', weight: 30, description: 'CI/CD 파이프라인 구현 수준' },
      { name: '비용 효율성', weight: 20, description: '클라우드 비용 최적화 전략' },
      { name: '발표', weight: 15, description: '기술 설명 및 장애 시나리오 대응' },
    ],
    schedule: [
      { date: '2026-02-15', title: '접수 오픈', description: '팀 구성 및 참가 신청', milestone: true },
      { date: '2026-03-01', title: '킥오프 세션', description: '과제 발표 및 AWS 워크숍' },
      { date: '2026-04-15', title: '중간 발표', description: '아키텍처 리뷰 세션' },
      { date: '2026-05-10', title: '최종 제출', description: '인프라 코드 및 문서 제출', milestone: true },
      { date: '2026-05-15', title: '시상식', description: '최종 발표 및 시상', milestone: true },
    ],
    guidelines: [
      'IaC(Terraform/CDK 등)를 사용한 인프라 구성이 필수입니다.',
      'GitHub 리포지토리에 인프라 코드 전체가 포함되어야 합니다.',
      '실제 클라우드 환경(Free Tier 이상)에서 동작해야 합니다.',
    ],
    submissionRequirements: ['GitHub 리포지토리 (IaC 코드 포함)', '아키텍처 다이어그램', '5분 이내 데모 영상', '비용 분석 보고서'],
    organizer: 'Cloud Native Korea',
    scoringType: 'evaluation',
  },
  {
    slug: 'health-tech-2026',
    title: 'HealthTech Innovation Sprint 2026',
    description: '디지털 헬스케어 기술로 더 건강한 삶을 설계하세요. 예방, 진단, 관리의 패러다임을 바꿉니다.',
    longDescription: `HealthTech Innovation Sprint는 의료·건강 분야의 디지털 전환을 이끌 혁신적인 솔루션을 발굴하는 해커톤입니다.\n\n웨어러블 데이터 분석, AI 진단 보조, 원격 의료, 정신 건강 관리 등 다양한 헬스케어 주제에 도전해 주세요.`,
    status: 'ongoing',
    tags: ['HealthTech', 'AI', 'Wearable', 'Data', 'Healthcare'],
    startDate: '2026-03-20',
    endDate: '2026-05-31',
    totalPrize: '₩8,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩4,000,000', description: '상금 + 병원 PoC 연계 기회' },
      { rank: '🥈 2위', amount: '₩2,500,000', description: '상금 + 헬스케어 멘토링' },
      { rank: '🥉 3위', amount: '₩1,500,000', description: '상금 + 교육 바우처' },
    ],
    maxTeamSize: 4,
    participantCount: 224,
    evaluationCriteria: [
      { name: '임상 유효성', weight: 35, description: '의료·건강 문제 해결의 실질적 효과' },
      { name: '기술 완성도', weight: 30, description: '구현 품질 및 데이터 활용 수준' },
      { name: '사용성', weight: 20, description: '환자·의료진 관점의 UX' },
      { name: '발표', weight: 15, description: '임팩트 및 비전 전달력' },
    ],
    schedule: [
      { date: '2026-03-20', title: '참가 접수 오픈', description: '해커톤 공식 시작', milestone: true },
      { date: '2026-04-05', title: '도메인 워크숍', description: '의료 데이터 활용 가이드 세션' },
      { date: '2026-05-10', title: '중간 제출', description: '프로토타입 데모 제출' },
      { date: '2026-05-28', title: '최종 제출 마감', description: '최종 프로젝트 제출', milestone: true },
      { date: '2026-05-31', title: '시상식', description: '발표 및 시상', milestone: true },
    ],
    guidelines: [
      '의료 데이터 사용 시 반드시 비식별화된 공공 데이터를 활용해야 합니다.',
      '실제 환자 데이터 사용은 금지됩니다.',
      '헬스케어 관련 규제 준수 여부를 문서로 증명해야 합니다.',
    ],
    submissionRequirements: ['GitHub 링크', '서비스 데모 영상 (5분)', '임상 효과 보고서', '개인정보 처리 방침'],
    organizer: 'Digital Health Korea',
    scoringType: 'evaluation',
  },

  // ── 예정 (1) ──────────────────────────────────────────────
  {
    slug: 'web3-builders-2026',
    title: 'Web3 Builders Hackathon',
    description: '블록체인 기반의 탈중앙화 애플리케이션으로 Web3 생태계를 혁신하세요.',
    longDescription: `Web3 Builders Hackathon은 블록체인과 탈중앙화 기술에 열정을 가진 개발자들을 위한 무대입니다. DeFi, NFT, DAO 등 다양한 Web3 영역에서 실제 문제를 해결하는 프로젝트를 개발해 주세요.`,
    status: 'upcoming',
    tags: ['Web3', 'Blockchain', 'DeFi', 'Solidity'],
    startDate: '2026-05-15',
    endDate: '2026-06-30',
    totalPrize: '₩15,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩8,000,000', description: '상금 + 인큐베이팅 프로그램' },
      { rank: '🥈 2위', amount: '₩4,000,000', description: '상금 + 기술 멘토링' },
      { rank: '🥉 3위', amount: '₩3,000,000', description: '상금' },
    ],
    maxTeamSize: 5,
    participantCount: 0,
    evaluationCriteria: [
      { name: '기술 구현', weight: 40, description: '스마트 컨트랙트 보안 및 기술 완성도' },
      { name: '아이디어 독창성', weight: 30, description: 'Web3 생태계에서의 새로운 가치 창출' },
      { name: '사용성', weight: 20, description: 'UX/UI 및 온보딩 경험' },
      { name: '발표', weight: 10, description: '프로젝트 발표 및 비전 공유' },
    ],
    schedule: [
      { date: '2026-04-15', title: '사전 신청 오픈', description: '얼리버드 신청 접수', milestone: true },
      { date: '2026-05-15', title: '해커톤 시작', description: '킥오프 세션 및 팀 빌딩', milestone: true },
      { date: '2026-06-01', title: '중간 제출', description: '프로토타입 데모 제출' },
      { date: '2026-06-28', title: '최종 제출', description: '최종 프로젝트 제출 마감', milestone: true },
      { date: '2026-06-30', title: '시상식', description: '결과 발표 및 시상', milestone: true },
    ],
    guidelines: [
      '이더리움, 솔라나, 폴리곤 등 주요 체인 기반 프로젝트만 허용됩니다.',
      '스마트 컨트랙트 감사 도구 사용을 권장합니다.',
      '테스트넷 배포로도 충분합니다.',
    ],
    submissionRequirements: [
      'GitHub 리포지토리 링크',
      '스마트 컨트랙트 주소 (테스트넷)',
      '데모 영상 (5분 이내)',
      '기술 문서 (아키텍처 다이어그램 포함)',
    ],
    organizer: 'Web3 Korea Foundation',
    scoringType: 'evaluation',
  },

  // ── 종료 (5) — 연도·월 분산 ──────────────────────────────
  {
    slug: 'climate-tech-2025',
    title: 'Climate Tech Sprint 2025',
    description: '기후 위기 대응을 위한 기술 솔루션을 만들어 지구를 구하세요.',
    longDescription: `Climate Tech Sprint는 환경 문제 해결에 초점을 맞춘 해커톤입니다. IoT 센서 데이터 분석, 탄소 발자국 추적, 재생에너지 최적화 등 다양한 영역에서 프로젝트를 개발할 수 있습니다.`,
    status: 'ended',
    tags: ['Climate', 'IoT', 'Sustainability', 'Data'],
    startDate: '2025-10-01',
    endDate: '2025-12-15',
    totalPrize: '₩8,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩4,000,000' },
      { rank: '🥈 2위', amount: '₩2,500,000' },
      { rank: '🥉 3위', amount: '₩1,500,000' },
    ],
    maxTeamSize: 4,
    participantCount: 218,
    evaluationCriteria: [
      { name: '환경 임팩트', weight: 40, description: '실질적인 탄소 감축 또는 환경 개선 효과' },
      { name: '기술 완성도', weight: 30, description: '구현 품질 및 확장성' },
      { name: '비즈니스 모델', weight: 20, description: '지속 가능한 사업 모델' },
      { name: '발표', weight: 10, description: '발표 품질' },
    ],
    schedule: [
      { date: '2025-10-01', title: '해커톤 시작', description: '참가 등록 오픈', milestone: true },
      { date: '2025-11-15', title: '개발 시작', description: '본격 개발 착수', milestone: true },
      { date: '2025-12-10', title: '최종 제출', description: '프로젝트 제출 마감', milestone: true },
      { date: '2025-12-15', title: '시상식', description: '결과 발표', milestone: true },
    ],
    guidelines: ['환경 관련 주제만 허용됩니다.', '데이터 출처를 명확히 밝혀야 합니다.'],
    submissionRequirements: ['GitHub 링크', '데모 영상', '환경 임팩트 보고서'],
    organizer: 'Green Future Foundation',
    scoringType: 'evaluation',
  },
  {
    slug: 'fintech-2025',
    title: 'Fintech Disruptors 2025',
    description: '금융의 미래를 코딩하세요. 간편결제부터 투자 자동화까지.',
    longDescription: `Fintech Disruptors는 금융 기술 혁신에 도전하는 개발자를 위한 해커톤입니다. 개방형 API를 활용해 새로운 금융 서비스를 만들어 보세요.`,
    status: 'ended',
    tags: ['Fintech', 'API', 'Finance', 'Data'],
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    totalPrize: '₩12,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩6,000,000' },
      { rank: '🥈 2위', amount: '₩4,000,000' },
      { rank: '🥉 3위', amount: '₩2,000,000' },
    ],
    maxTeamSize: 4,
    participantCount: 289,
    evaluationCriteria: [
      { name: '혁신성', weight: 35, description: '기존 금융 서비스 대비 차별점' },
      { name: '기술 완성도', weight: 35, description: '보안성 및 구현 품질' },
      { name: '시장성', weight: 20, description: '실제 서비스 가능성' },
      { name: '발표', weight: 10, description: '발표 품질' },
    ],
    schedule: [],
    guidelines: ['금융 규제 준수 필수', '개인정보 처리 방침 명시 필요'],
    submissionRequirements: ['GitHub 링크', '서비스 데모', '보안 검토 보고서'],
    organizer: 'FinTech Korea',
    scoringType: 'evaluation',
  },
  {
    slug: 'healthcare-ai-2025',
    title: 'Healthcare AI Challenge 2025',
    description: 'AI로 의료 접근성을 높이고, 더 정확한 진단과 예방 솔루션을 만드세요.',
    longDescription: `Healthcare AI Challenge는 의료·건강 데이터를 활용한 AI 솔루션을 경쟁하는 해커톤입니다. 진단 보조, 예측 모델, 웨어러블 데이터 분석 등 다양한 헬스케어 AI 챌린지에 참여하세요.`,
    status: 'ended',
    tags: ['AI', 'Healthcare', 'ML', 'Data', 'NLP'],
    startDate: '2025-06-01',
    endDate: '2025-08-31',
    totalPrize: '₩9,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩5,000,000', description: '상금 + 병원 PoC 기회' },
      { rank: '🥈 2위', amount: '₩2,500,000' },
      { rank: '🥉 3위', amount: '₩1,500,000' },
    ],
    maxTeamSize: 4,
    participantCount: 176,
    evaluationCriteria: [
      { name: '임상 정확도', weight: 40, description: 'AI 모델의 예측/진단 정확도' },
      { name: '기술 완성도', weight: 30, description: '코드 품질 및 재현성' },
      { name: '비즈니스 가능성', weight: 20, description: '실제 병원 도입 가능성' },
      { name: '발표', weight: 10, description: '결과 발표 및 Q&A' },
    ],
    schedule: [
      { date: '2025-06-01', title: '접수 오픈', description: '팀 빌딩 및 참가 신청', milestone: true },
      { date: '2025-07-01', title: '개발 시작', description: '데이터셋 배포 및 개발 착수', milestone: true },
      { date: '2025-08-25', title: '최종 제출', description: '모델 및 보고서 제출', milestone: true },
      { date: '2025-08-31', title: '시상식', description: '결과 발표', milestone: true },
    ],
    guidelines: ['비식별화된 공공 의료 데이터만 사용 가능합니다.', '모델 학습 코드와 가중치를 함께 제출해야 합니다.'],
    submissionRequirements: ['GitHub 링크 (모델 포함)', '임상 효과 보고서 (PDF)', '시연 영상 (3분)'],
    organizer: 'K-Digital Medical Consortium',
    scoringType: 'evaluation',
  },
  {
    slug: 'iot-smart-city-2024',
    title: 'IoT & Smart City Hackathon 2024',
    description: 'IoT 센서와 실시간 데이터로 더 스마트한 도시를 설계하세요.',
    longDescription: `IoT & Smart City Hackathon은 도시 데이터와 IoT 기술을 결합해 교통, 에너지, 안전 등 도시 문제를 해결하는 프로젝트를 경쟁합니다. 실제 시뮬레이션 데이터를 활용한 스마트 솔루션을 만들어보세요.`,
    status: 'ended',
    tags: ['IoT', 'Smart City', 'Data', 'Edge Computing', 'Sensor'],
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    totalPrize: '₩11,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩5,500,000' },
      { rank: '🥈 2위', amount: '₩3,500,000' },
      { rank: '🥉 3위', amount: '₩2,000,000' },
    ],
    maxTeamSize: 5,
    participantCount: 263,
    evaluationCriteria: [
      { name: '기술 혁신성', weight: 35, description: 'IoT 및 엣지 컴퓨팅 기술 활용도' },
      { name: '도시 임팩트', weight: 30, description: '실제 도시 문제 해결 효과' },
      { name: '완성도', weight: 25, description: '프로토타입 동작 및 확장성' },
      { name: '발표', weight: 10, description: '발표 및 Q&A' },
    ],
    schedule: [
      { date: '2024-11-01', title: '해커톤 시작', description: '참가 등록 및 팀 빌딩', milestone: true },
      { date: '2024-11-20', title: '데이터 배포', description: '시뮬레이션 IoT 데이터셋 배포' },
      { date: '2024-12-25', title: '최종 제출', description: '프로젝트 제출 마감', milestone: true },
      { date: '2024-12-31', title: '시상식', description: '결과 발표 및 시상', milestone: true },
    ],
    guidelines: ['제공된 시뮬레이션 IoT 데이터셋을 반드시 활용해야 합니다.', '실시간 대시보드 구현이 필수입니다.'],
    submissionRequirements: ['GitHub 링크', '실시간 대시보드 데모', '아키텍처 다이어그램', '3분 영상'],
    organizer: 'Smart City Korea Initiative',
    scoringType: 'evaluation',
  },
  {
    slug: 'edu-tech-2024',
    title: 'EduTech Grand Challenge 2024',
    description: '교육의 미래를 다시 설계하세요. AI 튜터부터 학습 경험 혁신까지.',
    longDescription: `EduTech Grand Challenge는 교육 기술의 혁신을 이끌 개발자와 디자이너를 위한 해커톤입니다. AI 기반 맞춤형 학습, 게이미피케이션, 비대면 협업 도구 등 다양한 주제에 도전해 주세요.`,
    status: 'ended',
    tags: ['EduTech', 'AI', 'LLM', 'Design', 'Gamification'],
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    totalPrize: '₩6,500,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩3,500,000' },
      { rank: '🥈 2위', amount: '₩2,000,000' },
      { rank: '🥉 3위', amount: '₩1,000,000' },
    ],
    maxTeamSize: 4,
    participantCount: 192,
    evaluationCriteria: [
      { name: '학습 효과', weight: 35, description: '교육 효과성 및 접근성' },
      { name: '기술 완성도', weight: 30, description: '구현 품질 및 안정성' },
      { name: 'UX/디자인', weight: 25, description: '학습자 경험 및 참여도' },
      { name: '발표', weight: 10, description: '발표 및 비전 공유' },
    ],
    schedule: [
      { date: '2024-04-01', title: '해커톤 시작', description: '참가 신청 오픈', milestone: true },
      { date: '2024-05-01', title: '개발 착수', description: '본격 프로젝트 시작', milestone: true },
      { date: '2024-06-25', title: '최종 제출', description: '프로젝트 제출 마감', milestone: true },
      { date: '2024-06-30', title: '시상식', description: '결과 발표 및 시상', milestone: true },
    ],
    guidelines: ['교육 관련 주제만 허용됩니다.', '미성년자 데이터 수집은 금지됩니다.'],
    submissionRequirements: ['GitHub 링크', '서비스 데모', '학습 효과 측정 보고서'],
    organizer: 'EdTech Alliance Korea',
    scoringType: 'evaluation',
  },
  {
    slug: 'app-festival-2025',
    title: 'App Festival Korea 2025',
    description: '모바일 앱 개발의 정수를 겨루는 국내 최대 앱 경진대회.',
    longDescription: `App Festival Korea는 iOS, Android, 크로스플랫폼을 아우르는 모바일 앱 개발 해커톤입니다. 사용자 경험, 기술적 완성도, 비즈니스 임팩트를 종합 평가하며, 최우수 앱은 실제 앱스토어 론칭 지원을 받습니다.`,
    status: 'ended',
    tags: ['Mobile', 'iOS', 'Android', 'Flutter', 'React Native', 'UX'],
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    totalPrize: '₩8,000,000',
    prizeDetails: [
      { rank: '🥇 1위', amount: '₩4,000,000', description: '상금 + 앱스토어 론칭 지원 + 투자사 IR 기회' },
      { rank: '🥈 2위', amount: '₩2,500,000', description: '상금 + 멘토링' },
      { rank: '🥉 3위', amount: '₩1,500,000', description: '상금' },
    ],
    maxTeamSize: 4,
    participantCount: 218,
    evaluationCriteria: [
      { name: '사용자 경험', weight: 35, description: '앱의 UX/UI 완성도 및 사용 편의성' },
      { name: '기술 완성도', weight: 30, description: '코드 품질, 성능, 안정성' },
      { name: '비즈니스 임팩트', weight: 25, description: '시장 가능성 및 실제 사용자 가치' },
      { name: '발표', weight: 10, description: '앱 시연 및 Q&A' },
    ],
    schedule: [
      { date: '2025-03-01', title: '참가 신청 오픈', description: '팀 빌딩 및 참가 신청 시작', milestone: true },
      { date: '2025-04-01', title: '개발 착수', description: '본격 앱 개발 시작', milestone: true },
      { date: '2025-05-25', title: '최종 제출', description: '앱 제출 마감', milestone: true },
      { date: '2025-05-31', title: '시상식', description: '결과 발표 및 시상', milestone: true },
    ],
    guidelines: [
      '모바일 앱 (iOS, Android, 크로스플랫폼) 형태여야 합니다.',
      '앱스토어/플레이스토어에 등록 가능한 수준의 완성도를 목표로 해주세요.',
      '오픈소스 라이브러리 활용 가능하나, 핵심 기능은 직접 개발해야 합니다.',
    ],
    submissionRequirements: ['GitHub 링크', 'APK 또는 TestFlight 링크', '앱 소개 영상 (3분)', '디자인 목업 파일'],
    organizer: 'Korea Mobile Developer Association',
    scoringType: 'evaluation',
  },
];

// ─── Build Initial Data (tag-dependent) ──────────────────────
// myTag and myName are injected at initStorage() time.

function buildInitialData(myTag: string, myName: string): {
  teams: Team[];
  leaderboards: LeaderboardEntry[];
} {
  // ── Teams ──────────────────────────────────────────────────

  const teams: Team[] = [
    // ① 내가 만든 팀 — Spark Studio (ai-innovation-2026)
    {
      id: 'my-team-001',
      teamName: 'Spark Studio',
      hackathonSlug: 'ai-innovation-2026',
      members: [
        {
          tag: myTag, name: myName, role: 'Frontend', joinedAt: '2026-03-05', currentTask: 'AI 코드 리뷰 UI 개발 중',
          todos: [
            { id: 'mt-1', text: 'GitHub 리포지토리 초기화 및 CI/CD 설정', status: 'done' as const, createdAt: '2026-03-06T10:00:00' },
            { id: 'mt-2', text: 'Monaco Editor 기반 코드 뷰어 통합', status: 'done' as const, createdAt: '2026-03-10T09:00:00' },
            { id: 'mt-3', text: 'AI 리뷰 인라인 패널 UI 구현', status: 'inprogress' as const, createdAt: '2026-03-20T14:00:00' },
            { id: 'mt-4', text: '코드 diff 시각화 뷰어 개발', status: 'inprogress' as const, createdAt: '2026-03-23T10:00:00' },
            { id: 'mt-5', text: '최종 제출 폼 및 README 완성', status: 'todo' as const, createdAt: '2026-03-28T09:00:00' },
            { id: 'mt-6', text: '데모 영상 촬영 및 편집', status: 'todo' as const, createdAt: '2026-03-28T09:30:00' },
          ],
        },
        {
          tag: '#1001', name: 'Kim Jisoo', role: 'AI/ML', joinedAt: '2026-03-30', currentTask: 'RAG 파이프라인 설계 중',
          skills: ['PyTorch', 'LangChain', 'OpenAI API', 'RAG', 'HuggingFace'],
          bio: 'LLM·RAG 전문 AI 엔지니어. 오픈소스 AI 프로젝트 메인테이너. 헬스케어·핀테크 해커톤 입상 다수.',
          todos: [
            { id: 'mt-ai-1', text: 'RAG 파이프라인 아키텍처 설계 문서 작성', status: 'done' as const, createdAt: '2026-03-30T10:00:00' },
            { id: 'mt-ai-2', text: 'LangChain + OpenAI API 연동 PoC 구현', status: 'inprogress' as const, createdAt: '2026-03-31T09:00:00' },
            { id: 'mt-ai-3', text: 'PR 코드 임베딩 벡터 DB 구축 (Pinecone)', status: 'inprogress' as const, createdAt: '2026-03-31T14:00:00' },
            { id: 'mt-ai-4', text: '리뷰 품질 평가 벤치마크 데이터셋 수집', status: 'todo' as const, createdAt: '2026-04-01T09:00:00' },
            { id: 'mt-ai-5', text: '모델 파인튜닝 실험 및 결과 정리', status: 'todo' as const, createdAt: '2026-04-01T10:00:00' },
          ],
        },
      ],
      master: myTag,
      isOpen: true,
      lookingFor: [
        { role: 'AI/ML', skills: ['PyTorch', 'LangChain', 'OpenAI API', 'RAG'], count: 1 },
        { role: 'Backend', skills: ['Python', 'FastAPI', 'PostgreSQL'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-spark-studio',
      intro: 'LLM 기반 실시간 코드 리뷰 자동화 서비스를 개발 중입니다. GPT-4와 RAG를 활용해 PR 리뷰 시간을 80% 단축하는 것이 목표예요. React로 깔끔한 에디터 UI를 만들고 있으니, AI/ML 엔지니어와 백엔드 개발자를 찾습니다!',
      quickMemos: [
        { id: 'memo-spark-1', authorTag: myTag, authorName: myName, content: '오늘 오후 3시 팀 미팅 — 기술 스택 최종 결정', createdAt: '2026-03-25T10:00:00' },
        { id: 'memo-spark-2', authorTag: myTag, authorName: myName, content: 'RAG 파이프라인 레퍼런스: LangChain docs v0.2', createdAt: '2026-03-26T09:30:00' },
      ],
      isFinalized: false,
      isTeamLocked: false,
      // 3건의 수신 지원서
      applicants: [
        {
          tag: '#1001',
          name: 'Kim Jisoo',
          message: '안녕하세요! AI/ML 엔지니어 김지수입니다. PyTorch와 LangChain으로 2년간 RAG 시스템을 개발했으며, 현재 오픈소스 LLM 프로젝트를 운영 중입니다. Spark Studio의 코드 리뷰 자동화 비전에 깊이 공감하며, 함께 혁신적인 제품을 만들고 싶습니다. 실제 PR 리뷰 데이터 분석 경험도 보유하고 있습니다.',
          selectedRole: 'AI/ML',
          techStack: [{ category: 'AI/ML', skills: ['PyTorch', 'LangChain', 'OpenAI API', 'RAG', 'HuggingFace'] }],
          appliedAt: '2026-03-22T14:20:00',
          status: 'accepted',
        },
        {
          tag: '#1002',
          name: 'Lee Minjun',
          message: 'FastAPI와 PostgreSQL로 백엔드 3년 경력의 이민준입니다. RESTful API 설계부터 비동기 처리까지 다양한 경험이 있습니다. 특히 코드 분석 도구 API 개발 경험이 있어 이 프로젝트에 즉시 기여할 수 있다고 생각합니다.',
          selectedRole: 'Backend',
          techStack: [{ category: 'Backend', skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'] }],
          appliedAt: '2026-03-23T09:15:00',
          status: 'pending',
        },
        {
          tag: '#2001',
          name: 'Park Seungho',
          message: 'Python 백엔드 + 데이터 엔지니어링 경험이 있는 박승호입니다. FastAPI, SQLAlchemy, 데이터 파이프라인 설계 경험이 풍부합니다. 해커톤 우승 경험이 있어 빠른 프로토타이핑에 자신 있습니다. AI 기반 서비스의 백엔드를 맡아 완성도 높은 제품을 만들고 싶습니다!',
          selectedRole: 'Backend',
          techStack: [
            { category: 'Backend', skills: ['Python', 'FastAPI', 'PostgreSQL'] },
            { category: 'Data', skills: ['Python', 'SQL', 'Pandas', 'Airflow'] },
          ],
          appliedAt: '2026-03-24T16:45:00',
          status: 'pending',
        },
      ],
      invitations: [
        {
          tag: '#3003',
          name: 'Kwon Mirae',
          sentAt: '2026-03-29T11:00:00',
          status: 'pending' as const,
          selectedRole: 'AI/ML',
        },
      ],
      todos: [
        { id: 'tt-1', text: '팀원 최종 확정 (이번 주 내)', completed: false, createdAt: '2026-03-20T10:00:00' },
        { id: 'tt-2', text: 'GitHub 리포지토리 초기 세팅', completed: true, createdAt: '2026-03-05T10:00:00' },
      ],
      createdAt: '2026-03-05',
    },

    // ② 내가 지원한 팀 — NovaMobile (mobile-ux-2026)
    {
      id: 'nova-mobile-001',
      teamName: 'NovaMobile',
      hackathonSlug: 'mobile-ux-2026',
      members: [
        {
          tag: '#4001', name: 'Oh Jiwon', role: 'Mobile', joinedAt: '2026-03-12', currentTask: 'Flutter 앱 아키텍처 설계 중',
          skills: ['Flutter', 'Dart', 'React Native', 'TypeScript', 'Expo'],
          bio: '모바일 UX에 진심인 Flutter 개발자. 여행 앱 스타트업 창업 경험, AR 기반 앱 개발 다수 보유.',
        },
        {
          tag: '#4002', name: 'Shin Youngho', role: 'Design', joinedAt: '2026-03-12', currentTask: 'Figma 프로토타입 제작',
          skills: ['Figma', 'UI/UX', 'Motion Design', 'User Research'],
          bio: 'B2C 모바일 앱 특화 UX 디자이너. 사용자 리서치부터 모션 디자인까지 풀스펙.',
        },
      ],
      master: '#4001',
      isOpen: true,
      lookingFor: [
        { role: 'Frontend', skills: ['Flutter', 'Dart', 'TypeScript', 'React Native'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-nova-mobile',
      intro: '여행 경험을 완전히 새롭게 바꿀 모바일 앱을 만들고 있어요. AR 기반 여행 가이드와 소셜 기능을 결합한 혁신적인 서비스입니다. Flutter로 부드러운 60fps 애니메이션을 구현할 수 있는 분, 또는 React Native 숙련자를 찾습니다!',
      quickMemos: [],
      isFinalized: false,
      isTeamLocked: false,
      // 내가 보낸 지원서
      applicants: [
        {
          tag: myTag,
          name: myName,
          message: '안녕하세요! React와 TypeScript로 3년간 프론트엔드 개발을 해온 이준호입니다. React Native 경험도 있어 Flutter 환경에 빠르게 적응할 수 있습니다. NovaMobile의 AR 기반 여행 앱 아이디어가 매우 흥미롭고, 사용자 경험을 극대화하는 UI/인터랙션 개발에 자신 있습니다. 함께라면 정말 멋진 앱을 만들 수 있을 것 같아요!',
          selectedRole: 'Frontend',
          techStack: [{ category: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'] }],
          appliedAt: '2026-03-26T11:30:00',
          status: 'pending',
        },
      ],
      invitations: [],
      todos: [],
      createdAt: '2026-03-12',
    },

    // ③ 매칭률 높은 팀 1 — Neural Nexus (ai-innovation-2026, 프론트엔드 구인)
    {
      id: 'team-001',
      teamName: 'Neural Nexus',
      hackathonSlug: 'ai-innovation-2026',
      members: [
        {
          tag: '#1001', name: 'Kim Jisoo', role: 'AI/ML', joinedAt: '2026-03-05', currentTask: 'RAG 파이프라인 구축 중',
          skills: ['PyTorch', 'LangChain', 'OpenAI API', 'RAG', 'HuggingFace'],
          bio: 'LLM·RAG 전문 AI 엔지니어. 오픈소스 AI 프로젝트 메인테이너. 헬스케어·핀테크 해커톤 입상 다수.',
        },
        {
          tag: '#1002', name: 'Lee Minjun', role: 'Backend', joinedAt: '2026-03-05', currentTask: 'FastAPI 서버 개발 중',
          skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'],
          bio: 'FastAPI 백엔드 전문가. B2B SaaS 서비스 개발 3년 경력.',
        },
      ],
      master: '#1001',
      isOpen: true,
      lookingFor: [
        { role: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-neural-nexus',
      intro: 'LLM 기반 코드 리뷰 자동화 툴을 개발하고 있습니다. GPT-4와 RAG 기술을 활용해 개발 생산성을 10배 높이는 것이 목표예요. React + TypeScript로 직관적인 코드 에디터 UI를 구현할 프론트엔드 개발자를 찾습니다!',
      quickMemos: [
        { id: 'memo-nn-1', authorTag: '#1001', authorName: 'Kim Jisoo', content: '내일 오전 10시 스탠드업 미팅', createdAt: '2026-03-20T09:00:00' },
        { id: 'memo-nn-2', authorTag: '#1002', authorName: 'Lee Minjun', content: 'DB 스키마 확정됨 — PR 보내드림', createdAt: '2026-03-20T14:30:00' },
      ],
      isFinalized: false,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      createdAt: '2026-03-05',
    },

    // ④ 매칭률 높은 팀 2 — CloudCanvas (health-tech-2026, 프론트엔드 + 디자인 구인)
    {
      id: 'cloud-canvas-001',
      teamName: 'CloudCanvas',
      hackathonSlug: 'health-tech-2026',
      members: [
        {
          tag: '#1002', name: 'Lee Minjun', role: 'Backend', joinedAt: '2026-03-22', currentTask: 'API 설계 및 DB 스키마 정의',
          skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'GraphQL'],
          bio: 'FastAPI 백엔드 전문가. 헬스케어 데이터 API 설계 경험 보유. 스타트업 CTO 출신.',
          todos: [
            { id: 'mtd-lm-1', text: 'API 설계 및 DB 스키마 정의', status: 'done', createdAt: '2026-03-22T09:00:00' },
            { id: 'mtd-lm-2', text: '기본 백엔드 보일러플레이트 구축', status: 'done', createdAt: '2026-03-23T10:00:00' },
            { id: 'mtd-lm-3', text: 'Redis 연동 및 캐싱 처리 설정', status: 'done', createdAt: '2026-03-24T11:00:00' },
            { id: 'mtd-lm-4', text: 'OAuth2 소셜 로그인 연동 작업', status: 'inprogress', createdAt: '2026-03-26T13:00:00' },
            { id: 'mtd-lm-5', text: '웨어러블 데이터 수집 파이프라인 구현', status: 'inprogress', createdAt: '2026-03-27T15:00:00' },
            { id: 'mtd-lm-6', text: '데이터 분석 모듈 및 비즈니스 로직 통합', status: 'todo', createdAt: '2026-03-28T09:00:00' },
          ],
        },
        {
          tag: '#2002', name: 'Choi Yuna', role: 'AI/ML', joinedAt: '2026-03-22', currentTask: '웨어러블 데이터 분석 모델 설계',
          skills: ['PyTorch', 'scikit-learn', 'Python', 'NLP', 'TensorFlow'],
          bio: '헬스케어 데이터 분석 전문 AI 연구원. 웨어러블 신호 처리 논문 2편 게재.',
          todos: [
            { id: 'mtd-cy-1', text: '사용자 인터뷰 질문지 작성', status: 'done', createdAt: '2026-03-22T10:00:00' },
            { id: 'mtd-cy-2', text: '핵심 UX 플로우 및 정보 구조 설계', status: 'done', createdAt: '2026-03-23T14:00:00' },
            { id: 'mtd-cy-3', text: '기본 컬러 팔레트 및 타이포그래피 확정', status: 'done', createdAt: '2026-03-24T09:00:00' },
            { id: 'mtd-cy-4', text: 'Figma 디자인 시스템 컴포넌트 기초 세팅', status: 'done', createdAt: '2026-03-25T11:00:00' },
            { id: 'mtd-cy-5', text: '메인 대시보드 시각화 UI 상세 설계', status: 'inprogress', createdAt: '2026-03-27T16:00:00' },
            { id: 'mtd-cy-6', text: '운동 결과 요약 리포트 레이아웃 기획', status: 'todo', createdAt: '2026-03-28T10:00:00' },
            { id: 'mtd-cy-7', text: '사용자 프로필 및 설정 페이지 기획', status: 'todo', createdAt: '2026-03-29T11:00:00' },
          ],
        },
      ],
      master: '#1002',
      isOpen: true,
      lookingFor: [
        { role: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'], count: 1 },
        { role: 'Design', skills: ['Figma', 'UI/UX', 'User Research'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-cloudcanvas',
      intro: '웨어러블 기기 데이터를 AI로 분석해 개인 맞춤 건강 인사이트를 제공하는 HealthTech 서비스입니다. Next.js로 반응형 대시보드를 구현할 프론트엔드 개발자와, 환자 친화적 UI를 설계할 디자이너를 찾아요!',
      quickMemos: [
        { id: 'qm-cc-1', authorTag: '#1002', authorName: 'Lee Minjun', content: '웨어러블 데이터 연동 규격 확인 부탁드려요!', createdAt: '2026-03-27T14:00:00' },
        { id: 'qm-cc-2', authorTag: '#2002', authorName: 'Choi Yuna', content: '시안 1안 피드백 반영 완료했습니다.', createdAt: '2026-03-28T10:30:00' },
      ],
      isFinalized: false,
      isTeamLocked: false,
      applicants: [],
      invitations: [
        {
          tag: myTag,
          name: myName,
          sentAt: new Date().toISOString(),
          status: 'pending',
          selectedRole: 'Frontend',
        }
      ],
      todos: [],
      createdAt: '2026-03-22',
    },

    // ⑤ 다른 참가팀 — DataForge (ai-innovation-2026)
    {
      id: 'team-002',
      teamName: 'DataForge',
      hackathonSlug: 'ai-innovation-2026',
      members: [
        {
          tag: '#2001', name: 'Park Seungho', role: 'Data', joinedAt: '2026-03-08', currentTask: '데이터 파이프라인 설계',
          skills: ['Python', 'Spark', 'Airflow', 'dbt', 'SQL', 'Pandas'],
          bio: '데이터 엔지니어링·분석 전문가. 제조업 IoT 데이터 도메인 강점. 해커톤 입상 경험 다수.',
        },
        {
          tag: '#2002', name: 'Choi Yuna', role: 'AI/ML', joinedAt: '2026-03-08', currentTask: '모델 파인튜닝 실험',
          skills: ['PyTorch', 'scikit-learn', 'Python', 'NLP', 'TensorFlow'],
          bio: '헬스케어 데이터 분석 전문 AI 연구원.',
        },
        {
          tag: '#2003', name: 'Jung Hyunwoo', role: 'Frontend', joinedAt: '2026-03-10', currentTask: '대시보드 UI 개발',
          skills: ['React', 'TypeScript', 'D3.js', 'Tailwind CSS'],
          bio: '데이터 시각화 특화 프론트엔드 개발자.',
        },
      ],
      master: '#2001',
      isOpen: true,
      lookingFor: [
        { role: 'Backend', skills: ['Python', 'FastAPI', 'PostgreSQL'], count: 1 },
        { role: 'DevOps', skills: ['Docker', 'AWS', 'Kubernetes'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-dataforge',
      intro: '실시간 이상 탐지 AI 플랫폼을 만들고 있어요. 제조업 IoT 센서 데이터를 분석해 장비 고장을 예측하는 B2B SaaS입니다. 백엔드와 DevOps 경험 있으신 분 환영합니다!',
      quickMemos: [],
      isFinalized: false,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      createdAt: '2026-03-08',
    },

    // ⑥ 다른 참가팀 — QuantumLeap (ai-innovation-2026, 풀팀)
    {
      id: 'team-003',
      teamName: 'QuantumLeap',
      hackathonSlug: 'ai-innovation-2026',
      members: [
        { tag: '#3001', name: 'Han Soyeon', role: 'Frontend', joinedAt: '2026-03-06', currentTask: 'Three.js 3D 시각화' },
        { tag: '#3002', name: 'Lim Dongjun', role: 'Backend', joinedAt: '2026-03-06', currentTask: '스트리밍 API 구현' },
        { tag: '#3003', name: 'Kwon Mirae', role: 'Design', joinedAt: '2026-03-07', currentTask: '디자인 시스템 구축' },
        { tag: '#3004', name: 'Yoon Taeyang', role: 'AI/ML', joinedAt: '2026-03-07', currentTask: '멀티모달 모델 실험' },
      ],
      master: '#3001',
      isOpen: false,
      lookingFor: [
        { role: 'Frontend', skills: ['Three.js', 'React', 'TypeScript'], count: 1 },
      ],
      contactUrl: '',
      intro: 'AI 기반 3D 콘텐츠 생성 툴을 개발 중입니다. 텍스트로 3D 씬을 생성하는 혁신적인 서비스예요. (팀 모집 완료)',
      quickMemos: [],
      isFinalized: false,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      createdAt: '2026-03-06',
    },

    // ⑦ 다른 참가팀 — SwipeDesign (mobile-ux-2026) — 팀장: Bae Junseok #4003
    {
      id: 'team-004',
      teamName: 'SwipeDesign',
      hackathonSlug: 'mobile-ux-2026',
      members: [
        {
          tag: '#4003', name: 'Bae Junseok', role: 'Mobile', joinedAt: '2026-03-12', currentTask: 'Flutter 라우팅 구조 설계',
          skills: ['Flutter', 'Dart', 'iOS', 'Swift', 'Kotlin'],
          bio: 'iOS/Android 크로스플랫폼 개발 5년. App Store 앱 3개 출시, Flutter 오픈소스 기여자.',
        },
        {
          tag: '#4002', name: 'Shin Youngho', role: 'Design', joinedAt: '2026-03-12', currentTask: 'Figma 프로토타입 제작',
          skills: ['Figma', 'UI/UX', 'Motion Design', 'User Research'],
          bio: 'B2C 모바일 앱 특화 UX 디자이너. 사용자 리서치부터 모션 디자인까지 풀스펙.',
        },
      ],
      master: '#4003',
      isOpen: true,
      lookingFor: [
        { role: 'Frontend', skills: ['Flutter', 'Dart', 'React Native'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-swipedesign',
      intro: '혁신적인 인터랙션 디자인으로 사용자를 사로잡는 여행 앱을 만들고 있어요. Flutter로 부드러운 60fps 애니메이션을 구현할 수 있는 분을 찾습니다!',
      quickMemos: [],
      isFinalized: false,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      createdAt: '2026-03-12',
    },

    // ⑧ 다른 참가팀 — DevOpsX (devops-cloud-2026)
    {
      id: 'devopsx-001',
      teamName: 'DevOpsX',
      hackathonSlug: 'devops-cloud-2026',
      members: [
        {
          tag: '#5001', name: 'Go Taehun', role: 'DevOps', joinedAt: '2026-02-20', currentTask: 'Kubernetes 클러스터 설계',
          skills: ['Kubernetes', 'Terraform', 'AWS', 'GitHub Actions', 'Docker'],
          bio: 'AWS 공인 아키텍트(SAA). IaC 전도사. Kubernetes 커뮤니티 기여자 2년 활동.',
        },
        {
          tag: '#5002', name: 'Bae Sumin', role: 'Backend', joinedAt: '2026-02-20', currentTask: 'CI/CD 파이프라인 구축',
          skills: ['Go', 'Rust', 'Node.js', 'GraphQL'],
          bio: 'Go·Rust 백엔드 개발자. 고성능 API 서버 설계 전문.',
        },
      ],
      master: '#5001',
      isOpen: true,
      lookingFor: [
        { role: 'DevOps', skills: ['Terraform', 'AWS', 'GitHub Actions'], count: 1 },
        { role: 'Backend', skills: ['Go', 'Rust', 'Node.js'], count: 1 },
      ],
      contactUrl: 'https://open.kakao.com/daker-devopsx',
      intro: 'AWS 기반 멀티 리전 자동 배포 플랫폼을 구축 중입니다. Terraform + GitHub Actions로 완전 자동화된 인프라를 만들어요. Go/Rust 백엔드와 Terraform IaC 경험자를 찾습니다!',
      quickMemos: [],
      isFinalized: false,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      createdAt: '2026-02-20',
    },

    // ─── 종료된 팀 5개 (리더보드용) ───────────────────────────

    // ⑨ GreenByte — climate-tech-2025, 1위
    {
      id: 'team-006',
      teamName: 'GreenByte',
      hackathonSlug: 'climate-tech-2025',
      members: [
        { tag: '#6001', name: 'Moon Sungmin', role: 'Backend', joinedAt: '2025-10-05', currentTask: '완료' },
        { tag: '#6002', name: 'Ahn Jiyoung', role: 'Frontend', joinedAt: '2025-10-05', currentTask: '완료' },
        { tag: '#6003', name: 'Son Hyunsik', role: 'Data', joinedAt: '2025-10-07', currentTask: '완료' },
      ],
      master: '#6001',
      isOpen: false,
      lookingFor: [
        { role: 'Backend', skills: ['Node.js', 'Express', 'PostgreSQL'], count: 1 },
      ],
      contactUrl: '',
      intro: '탄소 발자국 실시간 추적 플랫폼을 개발했습니다.',
      quickMemos: [],
      isFinalized: true,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      finalRank: 1,
      finalScore: 92,
      submission: {
        notes: '탄소 발자국 계산 알고리즘을 구현했습니다.',
        fileUrl: 'https://github.com/greenbyte/climate-tracker',
        submittedAt: '2025-12-09T22:00:00',
        score: 92,
      },
      createdAt: '2025-10-05',
    },

    // ⑩ EcoHackers — climate-tech-2025, 2위
    {
      id: 'team-007',
      teamName: 'EcoHackers',
      hackathonSlug: 'climate-tech-2025',
      members: [
        { tag: '#7001', name: 'Noh Jaewon', role: 'Frontend', joinedAt: '2025-10-10', currentTask: '완료' },
        { tag: '#7002', name: 'Jang Hyeji', role: 'AI/ML', joinedAt: '2025-10-10', currentTask: '완료' },
        { tag: '#8002', name: 'Im Soobin', role: 'Backend', joinedAt: '2025-10-12', currentTask: '완료' },
      ],
      master: '#7001',
      isOpen: false,
      lookingFor: [
        { role: 'AI/ML', skills: ['Python', 'PyTorch', 'scikit-learn'], count: 1 },
      ],
      contactUrl: '',
      intro: '재생에너지 최적화 AI를 개발했습니다.',
      quickMemos: [],
      isFinalized: true,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      finalRank: 2,
      finalScore: 78,
      submission: {
        notes: '재생에너지 최적화 모델 구현',
        fileUrl: 'https://github.com/ecohackers/energy-opt',
        submittedAt: '2025-12-09T20:00:00',
        score: 78,
      },
      createdAt: '2025-10-10',
    },

    // ⑪ FinFlow — fintech-2025, 1위
    {
      id: 'team-008',
      teamName: 'FinFlow',
      hackathonSlug: 'fintech-2025',
      members: [
        { tag: '#8001', name: 'Ryu Changhun', role: 'Backend', joinedAt: '2025-09-05', currentTask: '완료' },
        { tag: '#8002', name: 'Im Soobin', role: 'Frontend', joinedAt: '2025-09-05', currentTask: '완료' },
        { tag: '#8003', name: 'Seo Eunji', role: 'Design', joinedAt: '2025-09-06', currentTask: '완료' },
      ],
      master: '#8001',
      isOpen: false,
      lookingFor: [
        { role: 'Design', skills: ['Figma', 'UI/UX', 'Prototyping'], count: 1 },
      ],
      contactUrl: '',
      intro: 'AI 기반 개인 자산 관리 플랫폼을 개발했습니다.',
      quickMemos: [],
      isFinalized: true,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      finalRank: 1,
      finalScore: 95,
      submission: {
        notes: 'AI 기반 자산 배분 알고리즘 구현',
        submittedAt: '2025-11-28T21:00:00',
        score: 95,
      },
      createdAt: '2025-09-05',
    },

    // ⑫ MedAI Crew — healthcare-ai-2025, 1위
    {
      id: 'medai-team-001',
      teamName: 'MedAI Crew',
      hackathonSlug: 'healthcare-ai-2025',
      members: [
        { tag: '#1001', name: 'Kim Jisoo', role: 'AI/ML', joinedAt: '2025-06-05', currentTask: '완료' },
        { tag: '#2001', name: 'Park Seungho', role: 'Data', joinedAt: '2025-06-05', currentTask: '완료' },
        { tag: '#0001', name: 'Yoon Jaehyun', role: 'Backend', joinedAt: '2025-06-07', currentTask: '완료' },
      ],
      master: '#1001',
      isOpen: false,
      lookingFor: [
        { role: 'AI/ML', skills: ['Computer Vision', 'PyTorch', 'TensorFlow'], count: 1 },
      ],
      contactUrl: '',
      intro: 'X-Ray 이미지 기반 폐질환 AI 진단 보조 시스템을 개발했습니다.',
      quickMemos: [],
      isFinalized: true,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      finalRank: 1,
      finalScore: 91,
      submission: {
        notes: 'ResNet-50 기반 폐질환 분류 모델 (정확도 94.3%)',
        fileUrl: 'https://github.com/medai-crew/lung-ai',
        submittedAt: '2025-08-24T20:00:00',
        score: 91,
      },
      createdAt: '2025-06-05',
    },

    // ⑬ SmartGrid — iot-smart-city-2024, 1위
    {
      id: 'smartgrid-team-001',
      teamName: 'SmartGrid',
      hackathonSlug: 'iot-smart-city-2024',
      members: [
        { tag: '#6001', name: 'Moon Sungmin', role: 'Backend', joinedAt: '2024-11-05', currentTask: '완료' },
        { tag: '#6002', name: 'Ahn Jiyoung', role: 'Frontend', joinedAt: '2024-11-05', currentTask: '완료' },
        { tag: '#0001', name: 'Yoon Jaehyun', role: 'DevOps', joinedAt: '2024-11-06', currentTask: '완료' },
      ],
      master: '#6001',
      isOpen: false,
      lookingFor: [
        { role: 'Backend', skills: ['Go', 'FastAPI', 'PostgreSQL'], count: 1 },
      ],
      contactUrl: '',
      intro: '실시간 도시 에너지 소비 모니터링 및 예측 플랫폼을 개발했습니다.',
      quickMemos: [],
      isFinalized: true,
      isTeamLocked: false,
      applicants: [],
      invitations: [],
      todos: [],
      finalRank: 1,
      finalScore: 89,
      submission: {
        notes: 'LSTM 기반 에너지 소비 예측 + 실시간 대시보드',
        fileUrl: 'https://github.com/smartgrid/city-energy',
        submittedAt: '2024-12-24T21:30:00',
        score: 89,
      },
      createdAt: '2024-11-05',
    },
  ];

  // ── Leaderboards ───────────────────────────────────────────

  const leaderboards: LeaderboardEntry[] = [
    // climate-tech-2025 (5팀)
    {
      id: 'lb-c1',
      teamId: 'team-006',
      teamName: 'GreenByte',
      hackathonSlug: 'climate-tech-2025',
      rank: 1, score: 92,
      memberTags: ['#6001', '#6002', '#6003', '#0001'],
      memberNames: ['Moon Sungmin', 'Ahn Jiyoung', 'Son Hyunsik', 'Yoon Jaehyun'],
    },
    {
      id: 'lb-c2',
      teamId: 'team-007',
      teamName: 'EcoHackers',
      hackathonSlug: 'climate-tech-2025',
      rank: 2, score: 78,
      memberTags: ['#7001', '#7002', '#8002'],
      memberNames: ['Noh Jaewon', 'Jang Hyeji', 'Im Soobin'],
    },
    {
      id: 'lb-c3',
      teamId: 'climate-t3',
      teamName: 'BlueCarbon',
      hackathonSlug: 'climate-tech-2025',
      rank: 3, score: 65,
      memberTags: ['#4003', '#9001', '#9002'],
      memberNames: ['Bae Junseok', 'Kim Donghee', 'Park Jiho'],
    },
    {
      id: 'lb-c4',
      teamId: 'climate-t4',
      teamName: 'EcoGrid',
      hackathonSlug: 'climate-tech-2025',
      rank: 4, score: 50,
      memberTags: ['#11001', '#11002'],
      memberNames: ['Nam Jihoon', 'Yang Seojin'],
    },
    {
      id: 'lb-c5',
      teamId: 'climate-t5',
      teamName: 'GreenPulse',
      hackathonSlug: 'climate-tech-2025',
      rank: 5, score: 38,
      memberTags: ['#16001', '#16002'],
      memberNames: ['Ha Junho', 'Bae Minji'],
    },

    // fintech-2025 (5팀)
    {
      id: 'lb-f1',
      teamId: 'team-008',
      teamName: 'FinFlow',
      hackathonSlug: 'fintech-2025',
      rank: 1, score: 95,
      memberTags: ['#8001', '#8002', '#8003', '#0001'],
      memberNames: ['Ryu Changhun', 'Im Soobin', 'Seo Eunji', 'Yoon Jaehyun'],
    },
    {
      id: 'lb-f2',
      teamId: 'fintech-t2',
      teamName: 'PayNow',
      hackathonSlug: 'fintech-2025',
      rank: 2, score: 87,
      memberTags: ['#10001', '#10002', '#10003'],
      memberNames: ['Cho Minjae', 'Hong Yesul', 'Jung Sungwon'],
    },
    {
      id: 'lb-f3',
      teamId: 'fintech-t3',
      teamName: 'CryptoPay',
      hackathonSlug: 'fintech-2025',
      rank: 3, score: 72,
      memberTags: ['#11001', '#11002'],
      memberNames: ['Nam Jihoon', 'Yang Seojin'],
    },
    {
      id: 'lb-f4',
      teamId: 'fintech-t4',
      teamName: 'MoneyFlow',
      hackathonSlug: 'fintech-2025',
      rank: 4, score: 58,
      memberTags: ['#13001', '#13002'],
      memberNames: ['Oh Hyungwoo', 'Jeon Minji'],
    },
    {
      id: 'lb-f5',
      teamId: 'fintech-t5',
      teamName: 'WealthAI',
      hackathonSlug: 'fintech-2025',
      rank: 5, score: 44,
      memberTags: ['#14001', '#14002'],
      memberNames: ['Shin Minchul', 'Kang Sohyeon'],
    },

    // healthcare-ai-2025 (4팀)
    {
      id: 'lb-h1',
      teamId: 'medai-team-001',
      teamName: 'MedAI Crew',
      hackathonSlug: 'healthcare-ai-2025',
      rank: 1, score: 91,
      memberTags: ['#1001', '#2001', '#0001'],
      memberNames: ['Kim Jisoo', 'Park Seungho', 'Yoon Jaehyun'],
    },
    {
      id: 'lb-h2',
      teamId: 'health-t2',
      teamName: 'HealthSync',
      hackathonSlug: 'healthcare-ai-2025',
      rank: 2, score: 75,
      memberTags: ['#2002', '#3001', '#8002'],
      memberNames: ['Choi Yuna', 'Han Soyeon', 'Im Soobin'],
    },
    {
      id: 'lb-h3',
      teamId: 'health-t3',
      teamName: 'CareBot',
      hackathonSlug: 'healthcare-ai-2025',
      rank: 3, score: 60,
      memberTags: ['#15001', '#15002'],
      memberNames: ['Lee Seungwoo', 'Park Minju'],
    },
    {
      id: 'lb-h4',
      teamId: 'health-t4',
      teamName: 'BioPulse',
      hackathonSlug: 'healthcare-ai-2025',
      rank: 4, score: 45,
      memberTags: ['#16002', '#12002'],
      memberNames: ['Bae Minji', 'Lim Jinhee'],
    },

    // iot-smart-city-2024 (4팀)
    {
      id: 'lb-i1',
      teamId: 'smartgrid-team-001',
      teamName: 'SmartGrid',
      hackathonSlug: 'iot-smart-city-2024',
      rank: 1, score: 89,
      memberTags: ['#6001', '#6002', '#0001'],
      memberNames: ['Moon Sungmin', 'Ahn Jiyoung', 'Yoon Jaehyun'],
    },
    {
      id: 'lb-i2',
      teamId: 'iot-t2',
      teamName: 'CityLink',
      hackathonSlug: 'iot-smart-city-2024',
      rank: 2, score: 82,
      memberTags: ['#3002', '#6003', '#8002'],
      memberNames: ['Lim Dongjun', 'Son Hyunsik', 'Im Soobin'],
    },
    {
      id: 'lb-i3',
      teamId: 'iot-t3',
      teamName: 'UrbanAI',
      hackathonSlug: 'iot-smart-city-2024',
      rank: 3, score: 70,
      memberTags: ['#4001', '#17001', '#17002'],
      memberNames: ['Oh Jiwon', 'Lee Seunghyun', 'Kim Taeyang'],
    },
    {
      id: 'lb-i4',
      teamId: 'iot-t4',
      teamName: 'FlowCity',
      hackathonSlug: 'iot-smart-city-2024',
      rank: 4, score: 55,
      memberTags: ['#16001', '#13002'],
      memberNames: ['Ha Junho', 'Jeon Minji'],
    },

    // edu-tech-2024 (4팀) — 나(myTag)도 포함
    {
      id: 'lb-e1',
      teamId: 'edu-t1',
      teamName: 'LearnAI',
      hackathonSlug: 'edu-tech-2024',
      rank: 1, score: 88,
      memberTags: ['#3001', '#3002', '#0001'],
      memberNames: ['Han Soyeon', 'Lim Dongjun', 'Yoon Jaehyun'],
    },
    {
      id: 'lb-e2',
      teamId: 'devspirit-past',
      teamName: 'DevSpirit',
      hackathonSlug: 'edu-tech-2024',
      rank: 2, score: 74,
      memberTags: [myTag, '#17002'],
      memberNames: [myName, 'Kim Taeyang'],
    },
    {
      id: 'lb-e3',
      teamId: 'edu-t3',
      teamName: 'StudySync',
      hackathonSlug: 'edu-tech-2024',
      rank: 3, score: 61,
      memberTags: ['#1001', '#13001'],
      memberNames: ['Kim Jisoo', 'Oh Hyungwoo'],
    },
    {
      id: 'lb-e4',
      teamId: 'edu-t4',
      teamName: 'EduBridge',
      hackathonSlug: 'edu-tech-2024',
      rank: 4, score: 47,
      memberTags: ['#9002', '#12002'],
      memberNames: ['Park Jiho', 'Lim Jinhee'],
    },

    // app-festival-2025 (3팀) — Oh Jiwon #4001 수상
    {
      id: 'lb-af1',
      teamId: 'app-fest-t1',
      teamName: 'Wander',
      hackathonSlug: 'app-festival-2025',
      rank: 1, score: 96,
      memberTags: ['#4001', '#4002'],
      memberNames: ['Oh Jiwon', 'Shin Youngho'],
    },
    {
      id: 'lb-af2',
      teamId: 'app-fest-t2',
      teamName: 'RideKit',
      hackathonSlug: 'app-festival-2025',
      rank: 2, score: 88,
      memberTags: ['#4003', '#9001', '#9002', '#3001'],
      memberNames: ['Bae Junseok', 'Kim Donghee', 'Park Jiho', 'Han Soyeon'],
    },
    {
      id: 'lb-af3',
      teamId: 'app-fest-t3',
      teamName: 'DailyFlow',
      hackathonSlug: 'app-festival-2025',
      rank: 3, score: 74,
      memberTags: ['#11001', '#17001'],
      memberNames: ['Nam Jihoon', 'Lee Seunghyun'],
    },
  ];

  return { teams, leaderboards };
}

// ─── Core Storage Functions ───────────────────────────────────

export function initStorage(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.INIT)) return;

  const tag = '#' + Math.floor(1000 + Math.random() * 9000);
  const myName = 'Lee Junho';

  const user: UserProfile = {
    name: myName,
    tag,
    bio: '프론트엔드 개발자 / React·TypeScript 전문. 해커톤에서 아이디어를 실제 제품으로 만들어가는 과정을 사랑합니다!',
    techStack: [
      { category: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'] },
    ],
    joinedHackathons: ['ai-innovation-2026', 'mobile-ux-2026', 'health-tech-2026'],
    personalData: {
      'ai-innovation-2026': {
        todos: [
          { id: 'pt-1', text: 'RAG 파이프라인 프로토타입 완성', completed: true, createdAt: '2026-03-10T10:00:00' },
          { id: 'pt-2', text: 'UI 컴포넌트 시스템 구축', completed: false, createdAt: '2026-03-12T10:00:00' },
          { id: 'pt-3', text: '최종 데모 시나리오 작성', completed: false, createdAt: '2026-03-20T10:00:00' },
        ],
        phase: 2,
        notes: 'React 기반 코드 에디터 UI 완성 목표. 현재 팀원 모집 중.',
        memos: [
          { id: 'pm-1', content: '팀원 지원 3건 검토 필요', createdAt: '2026-03-25T09:00:00' },
        ],
      },
      'mobile-ux-2026': {
        todos: [
          { id: 'pt-4', text: '경쟁 앱 UX 분석 완료', completed: true, createdAt: '2026-03-15T09:00:00' },
          { id: 'pt-5', text: 'NovaMobile 팀 면접 준비', completed: false, createdAt: '2026-03-27T10:00:00' },
        ],
        phase: 1,
        notes: '모바일 앱 기획 단계. NovaMobile 팀 지원 완료 — 결과 기다리는 중.',
        memos: [],
      },
      'health-tech-2026': {
        todos: [],
        phase: 1,
        notes: '헬스케어 리서치 중. CloudCanvas 팀의 프론트엔드 포지션 초대 고민 중.',
        memos: [],
      },
    },
  };

  const { teams, leaderboards } = buildInitialData(tag, myName);
  const filteredTeams = teams.filter(t => t.hackathonSlug !== null);

  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  localStorage.setItem(KEYS.HACKATHONS, JSON.stringify(INITIAL_HACKATHONS));
  localStorage.setItem(KEYS.TEAMS, JSON.stringify(filteredTeams));
  localStorage.setItem(KEYS.LEADERBOARDS, JSON.stringify(leaderboards));
  localStorage.setItem(KEYS.INIT, 'true');
}

export function getStorage(): StorageData {
  if (typeof window === 'undefined') {
    return {
      userProfile: {
        name: 'Lee Junho',
        tag: '#0000',
        bio: '',
        techStack: [],
        joinedHackathons: [],
        personalData: {},
      },
      hackathons: INITIAL_HACKATHONS,
      teams: [],
      leaderboards: [],
    };
  }

  const userStr = localStorage.getItem(KEYS.USER);
  const hackathonsStr = localStorage.getItem(KEYS.HACKATHONS);
  const teamsStr = localStorage.getItem(KEYS.TEAMS);
  const leaderboardsStr = localStorage.getItem(KEYS.LEADERBOARDS);

  return {
    userProfile: userStr ? JSON.parse(userStr) : { name: 'Lee Junho', tag: '#0000', bio: '', techStack: [], joinedHackathons: [], personalData: {} },
    hackathons: hackathonsStr ? JSON.parse(hackathonsStr) : INITIAL_HACKATHONS,
    teams: teamsStr ? JSON.parse(teamsStr) : [],
    leaderboards: leaderboardsStr ? JSON.parse(leaderboardsStr) : [],
  };
}

function setStorageKey(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('storage'));
}

// ─── User Profile Operations ──────────────────────────────────

export function updateUserProfile(updates: Partial<UserProfile>): void {
  const { userProfile } = getStorage();
  const updated = { ...userProfile, ...updates };
  setStorageKey(KEYS.USER, updated);
}

export function registerForHackathon(slug: string): void {
  const { userProfile } = getStorage();
  if (userProfile.joinedHackathons.includes(slug)) return;
  const updated = {
    ...userProfile,
    joinedHackathons: [...userProfile.joinedHackathons, slug],
    personalData: {
      ...userProfile.personalData,
      [slug]: { todos: [], phase: 0, notes: '' },
    },
  };
  setStorageKey(KEYS.USER, updated);
}

export function updatePersonalData(slug: string, data: Partial<PersonalHackathonData>): void {
  const { userProfile } = getStorage();
  const existing = userProfile.personalData[slug] || { todos: [], phase: 0, notes: '' };
  const updated = {
    ...userProfile,
    personalData: {
      ...userProfile.personalData,
      [slug]: { ...existing, ...data },
    },
  };
  setStorageKey(KEYS.USER, updated);
}

export function addPersonalTodo(slug: string, text: string): void {
  const { userProfile } = getStorage();
  const existing = userProfile.personalData[slug] || { todos: [], phase: 0, notes: '' };
  const newTodo: Todo = {
    id: `todo-${Date.now()}`,
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  updatePersonalData(slug, { todos: [...existing.todos, newTodo] });
}

export function togglePersonalTodo(slug: string, todoId: string): void {
  const { userProfile } = getStorage();
  const existing = userProfile.personalData[slug];
  if (!existing) return;
  const todos = existing.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
  updatePersonalData(slug, { todos });
}

export function deletePersonalTodo(slug: string, todoId: string): void {
  const { userProfile } = getStorage();
  const existing = userProfile.personalData[slug];
  if (!existing) return;
  const todos = existing.todos.filter(t => t.id !== todoId);
  updatePersonalData(slug, { todos });
}

export function addPersonalMemo(slug: string, content: string): void {
  const storage = getStorage();
  const pd = storage.userProfile.personalData[slug] || { todos: [], phase: 0, notes: '', memos: [] };
  const memo: PersonalMemo = {
    id: `pmemo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    content,
    createdAt: new Date().toISOString(),
  };
  updatePersonalData(slug, { memos: [...(pd.memos || []), memo] });
}

export function deletePersonalMemo(slug: string, memoId: string): void {
  const storage = getStorage();
  const pd = storage.userProfile.personalData[slug];
  if (!pd) return;
  updatePersonalData(slug, { memos: (pd.memos || []).filter(m => m.id !== memoId) });
}

export function updatePersonalMemo(slug: string, memoId: string, content: string): void {
  const storage = getStorage();
  const pd = storage.userProfile.personalData[slug];
  if (!pd) return;
  updatePersonalData(slug, {
    memos: (pd.memos || []).map(m => m.id === memoId ? { ...m, content } : m),
  });
}

export function submitPersonalProject(slug: string, data: { notes: string; fileUrl?: string; attachedFiles?: AttachedFile[] }): void {
  const sub: Submission = {
    ...data,
    submittedAt: new Date().toISOString(),
  };
  updatePersonalData(slug, { personalSubmission: sub });

  // 추가 수정: 개인 최종 제출 시 해당 대회의 모든 팀 지원 내역 자동 취소
  const apps = getAllUserApplications();
  apps.forEach(app => {
    if (app.hackathonSlug === slug && (app.status === 'pending' || app.status === 'accepted')) {
      cancelApplication(app.teamId);
    }
  });

  // 추가 수정: 개인 최종 제출 시 해당 대회의 모든 대기 중인 초대 거절 처리
  const invs = getAllPendingInvitations();
  invs.forEach(inv => {
    if (inv.hackathonSlug === slug) {
      rejectInvitation(inv.teamId);
    }
  });
}

// ─── Team Operations ──────────────────────────────────────────

export function createTeam(teamData: {
  teamName: string;
  hackathonSlug: string | null;
  isOpen: boolean;
  lookingFor: LookingFor[];
  contactUrl: string;
  intro: string;
}): Team {
  const { userProfile, teams } = getStorage();
  const newTeam: Team = {
    id: `team-${Date.now()}`,
    teamName: teamData.teamName,
    hackathonSlug: teamData.hackathonSlug,
    members: [{
      tag: userProfile.tag,
      name: userProfile.name,
      role: userProfile.techStack[0]?.category || 'General',
      joinedAt: new Date().toISOString().split('T')[0],
      currentTask: '팀 결성 중',
    }],
    master: userProfile.tag,
    isOpen: teamData.isOpen,
    lookingFor: teamData.lookingFor,
    contactUrl: teamData.contactUrl,
    intro: teamData.intro,
    quickMemos: [],
    isFinalized: false,
    isTeamLocked: false,
    applicants: [],
    invitations: [],
    todos: [],
    createdAt: new Date().toISOString().split('T')[0],
  };

  setStorageKey(KEYS.TEAMS, [...teams, newTeam]);

  if (teamData.hackathonSlug) {
    registerForHackathon(teamData.hackathonSlug);
  }

  return newTeam;
}

export function updateTeam(teamId: string, updates: Partial<Team>): void {
  const { teams } = getStorage();
  const updated = teams.map(t => t.id === teamId ? { ...t, ...updates } : t);
  setStorageKey(KEYS.TEAMS, updated);
}

export function applyToTeam(teamId: string, message: string, selectedRole: string = ''): 'ok' | 'already_finalized' | 'already_applicant' | 'already_in_team' {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return 'ok';

  if (team.hackathonSlug) {
    // 1. 개인 참가자로 이미 최종 제출을 완료했는지 체크
    const personalData = userProfile.personalData[team.hackathonSlug];
    if (personalData?.personalSubmission) {
      return 'already_finalized';
    }

    // 2. 이미 해당 대회에 다른 팀의 멤버인지 체크 (나의 팀이 아니면서)
    const existingTeam = teams.find(t => 
      t.hackathonSlug === team.hackathonSlug &&
      t.members.some(m => m.tag === userProfile.tag)
    );

    if (existingTeam) {
      return existingTeam.isFinalized ? 'already_finalized' : 'already_in_team';
    }
  }

  // 3. 이미 이 팀에 지원했는지 체크
  if (team.applicants.some(a => a.tag === userProfile.tag)) {
    return 'already_applicant';
  }

  const applicant: Applicant = {
    tag: userProfile.tag,
    name: userProfile.name,
    message,
    selectedRole,
    techStack: userProfile.techStack,
    appliedAt: new Date().toISOString(),
    status: 'pending',
  };

  updateTeam(teamId, { applicants: [...team.applicants, applicant] });

  if (team.hackathonSlug) registerForHackathon(team.hackathonSlug);
  return 'ok';
}

export function cancelApplication(teamId: string): void {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const applicant = team.applicants.find(a => a.tag === userProfile.tag);
  if (applicant?.status === 'accepted') {
    try {
      const LATE_CANCEL_KEY = 'daker_late_cancels';
      const str = localStorage.getItem(LATE_CANCEL_KEY);
      const cancels: Record<string, number> = str ? JSON.parse(str) : {};
      cancels[userProfile.tag] = (cancels[userProfile.tag] || 0) + 1;
      localStorage.setItem(LATE_CANCEL_KEY, JSON.stringify(cancels));
    } catch { /* noop */ }
  }

  const updatedApplicants = team.applicants.filter(a => a.tag !== userProfile.tag);
  updateTeam(teamId, { applicants: updatedApplicants });
}

export function checkExistingApplicationForHackathon(hackathonSlug: string | null): Team | null {
  if (!hackathonSlug) return null;
  const { userProfile, teams } = getStorage();
  return teams.find(t =>
    t.hackathonSlug === hackathonSlug &&
    t.applicants.some(a => a.tag === userProfile.tag && a.status === 'pending')
  ) || null;
}

export function manageApplicant(
  teamId: string,
  applicantTag: string,
  action: 'accept' | 'reject'
): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  if (action === 'accept') {
    const applicant = team.applicants.find(a => a.tag === applicantTag);
    if (!applicant) return;

    const newMember: TeamMember = {
      tag: applicant.tag,
      name: applicant.name,
      role: applicant.techStack[0]?.category || 'General',
      joinedAt: new Date().toISOString().split('T')[0],
      currentTask: '팀 합류 완료',
    };

    const updatedApplicants = team.applicants.map(a =>
      a.tag === applicantTag ? { ...a, status: 'accepted' as const } : a
    );

    updateTeam(teamId, {
      members: [...team.members, newMember],
      applicants: updatedApplicants,
    });
  } else {
    const updatedApplicants = team.applicants.map(a =>
      a.tag === applicantTag ? { ...a, status: 'rejected' as const } : a
    );
    updateTeam(teamId, { applicants: updatedApplicants });
  }
}

export function leaveTeam(teamId: string): void {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  if (team.master === userProfile.tag && team.members.length === 1) {
    const updatedTeams = teams.filter(t => t.id !== teamId);
    setStorageKey(KEYS.TEAMS, updatedTeams);
  } else {
    const updatedMembers = team.members.filter(m => m.tag !== userProfile.tag);
    const newMaster = team.master === userProfile.tag ? updatedMembers[0]?.tag : team.master;
    updateTeam(teamId, { members: updatedMembers, master: newMaster || team.master });
  }
}

export function transferMaster(teamId: string, newMasterTag: string): void {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  if (team.master !== userProfile.tag) return; // 팀장만 위임 가능
  if (!team.members.some(m => m.tag === newMasterTag)) return; // 팀원이어야 함
  updateTeam(teamId, { master: newMasterTag });
}

export function addQuickMemo(teamId: string, content: string): void {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const memo: QuickMemo = {
    id: `memo-${Date.now()}`,
    authorTag: userProfile.tag,
    authorName: userProfile.name,
    content,
    createdAt: new Date().toISOString(),
  };

  updateTeam(teamId, { quickMemos: [...team.quickMemos, memo] });
}

export function deleteQuickMemo(teamId: string, memoId: string): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  updateTeam(teamId, { quickMemos: team.quickMemos.filter(m => m.id !== memoId) });
}

export function updateMemberTask(teamId: string, memberTag: string, task: string): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const members = team.members.map(m => m.tag === memberTag ? { ...m, currentTask: task } : m);
  updateTeam(teamId, { members });
}

export function addMemberTodo(teamId: string, memberTag: string, text: string): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const newTodo: MemberTodo = {
    id: `mtodo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    status: 'todo',
    createdAt: new Date().toISOString(),
  };
  const members = team.members.map(m =>
    m.tag === memberTag ? { ...m, todos: [...(m.todos || []), newTodo] } : m
  );
  updateTeam(teamId, { members });
}

export function updateMemberTodo(teamId: string, memberTag: string, todoId: string, updates: Partial<MemberTodo>): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const members = team.members.map(m => {
    if (m.tag !== memberTag) return m;
    return { ...m, todos: (m.todos || []).map(t => t.id === todoId ? { ...t, ...updates } : t) };
  });
  updateTeam(teamId, { members });
}

export function deleteMemberTodo(teamId: string, memberTag: string, todoId: string): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const members = team.members.map(m => {
    if (m.tag !== memberTag) return m;
    return { ...m, todos: (m.todos || []).filter(t => t.id !== todoId) };
  });
  updateTeam(teamId, { members });
}

export function submitProject(teamId: string, submission: { notes: string; fileUrl?: string; attachedFiles?: AttachedFile[] }): void {
  const { teams, leaderboards } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team || !team.hackathonSlug) return;

  const sub: Submission = {
    ...submission,
    submittedAt: new Date().toISOString(),
  };

  updateTeam(teamId, { submission: sub, isFinalized: true });

  const existingEntry = leaderboards.find(l => l.teamId === teamId);
  if (!existingEntry) {
    const newEntry: LeaderboardEntry = {
      id: `lb-${Date.now()}`,
      teamId,
      teamName: team.teamName,
      hackathonSlug: team.hackathonSlug,
      rank: 999,
      score: 0,
      memberTags: team.members.map(m => m.tag),
      memberNames: team.members.map(m => m.name),
    };
    setStorageKey(KEYS.LEADERBOARDS, [...leaderboards, newEntry]);
  }
}

// ─── 지능형 매칭 알고리즘 ────────────────────────────────────────
//
// 점수 구성 (슬롯 당 최대 90점 → 퍼센트 환산)
//   · 직무 유사도 (Role Proximity)  : 직접 일치=50점, 유사 직군=맵 값(최대 35점)
//   · 스택 커버리지 (Stack Coverage): (보유 스킬 ∩ 요구 스킬) / 요구 스킬 수 * 40점
//
// 사용자의 모든 기술 스택 × 팀의 모든 모집 슬롯 조합 중 최고 점수를 채택해
// 0 ~ 100% 퍼센트로 반환합니다.

const MATCH_MAX = 90; // role(50) + stack(40)

export function calculateMatchScore(userProfile: UserProfile, team: Team): number {
  if (!team.isOpen || team.lookingFor.length === 0) return 0;
  if (userProfile.techStack.length === 0) return 0;

  let bestScore = 0;

  for (const slot of team.lookingFor) {
    for (const userStack of userProfile.techStack) {
      const roleScore = getRoleProximityScore(userStack.category, slot.role);

      let stackScore = 0;
      if (slot.skills && slot.skills.length > 0) {
        const userSkillsLower = userStack.skills.map(s => s.toLowerCase());
        const matched = slot.skills.filter(s =>
          userSkillsLower.includes(s.toLowerCase())
        ).length;
        stackScore = (matched / slot.skills.length) * 40;
      }

      const slotScore = roleScore + stackScore;
      if (slotScore > bestScore) bestScore = slotScore;
    }
  }

  const percent = Math.round((bestScore / MATCH_MAX) * 1000) / 10;
  console.log(`[지능형 매칭 알고리즘] 팀: "${team.teamName}", 매칭률: ${percent}%`);
  return Math.min(100, percent);
}

// ─── Rankings ─────────────────────────────────────────────────

export interface GlobalRankingEntry {
  tag: string;
  name: string;
  totalScore: number;
  hackathonCount: number;
  bestRank: number;
}

export function getGlobalRankings(): GlobalRankingEntry[] {
  const { leaderboards } = getStorage();

  const memberScores: Record<string, { name: string; scores: number[]; hackathonCount: number; bestRank: number }> = {};

  for (const entry of leaderboards) {
    if (entry.rank === 999) continue;

    const hackathonTeamCount = leaderboards.filter(l => l.hackathonSlug === entry.hackathonSlug && l.rank !== 999).length;
    const pointScore = hackathonTeamCount > 0
      ? Math.round((Math.sqrt(hackathonTeamCount) / Math.sqrt(entry.rank)) * 100)
      : 0;

    for (let i = 0; i < entry.memberTags.length; i++) {
      const tag = entry.memberTags[i];
      const name = entry.memberNames[i] || 'Unknown';

      if (!memberScores[tag]) {
        memberScores[tag] = { name, scores: [], hackathonCount: 0, bestRank: 999 };
      }

      memberScores[tag].scores.push(pointScore);
      memberScores[tag].hackathonCount += 1;
      memberScores[tag].bestRank = Math.min(memberScores[tag].bestRank, entry.rank);
    }
  }

  const rankings: GlobalRankingEntry[] = Object.entries(memberScores).map(([tag, data]) => {
    const sortedScores = [...data.scores].sort((a, b) => b - a);
    const top3 = sortedScores.slice(0, 3);
    const totalScore = top3.reduce((sum, s) => sum + s, 0);

    return {
      tag,
      name: data.name,
      totalScore,
      hackathonCount: data.hackathonCount,
      bestRank: data.bestRank,
    };
  });

  return rankings.sort((a, b) => b.totalScore - a.totalScore);
}

// ─── Helper Functions ─────────────────────────────────────────

export function getUserTeamForHackathon(hackathonSlug: string): Team | null {
  const { userProfile, teams } = getStorage();
  return teams.find(t =>
    t.hackathonSlug === hackathonSlug &&
    t.members.some(m => m.tag === userProfile.tag)
  ) || null;
}

export function isFreeAgent(hackathonSlug: string): boolean {
  const { userProfile } = getStorage();
  const isRegistered = userProfile.joinedHackathons.includes(hackathonSlug);
  const team = getUserTeamForHackathon(hackathonSlug);
  return isRegistered && !team;
}

export function getUserApplications(): string[] {
  const { userProfile, teams } = getStorage();
  return teams
    .filter(t => t.applicants.some(a => a.tag === userProfile.tag && a.status === 'pending'))
    .map(t => t.id);
}

export interface UserApplicationRecord {
  teamId: string;
  teamName: string;
  hackathonSlug: string | null;
  selectedRole: string;
  message: string;
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export function getAllUserApplications(): UserApplicationRecord[] {
  const { userProfile, teams } = getStorage();
  const records: UserApplicationRecord[] = [];
  for (const team of teams) {
    const applicant = team.applicants.find(a => a.tag === userProfile.tag);
    if (applicant) {
      records.push({
        teamId: team.id,
        teamName: team.teamName,
        hackathonSlug: team.hackathonSlug,
        selectedRole: applicant.selectedRole,
        message: applicant.message,
        appliedAt: applicant.appliedAt,
        status: applicant.status,
      });
    }
  }
  return records.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
}

export interface PendingInvitationRecord {
  teamId: string;
  teamName: string;
  hackathonSlug: string | null;
  selectedRole?: string;
  sentAt: string;
}

export function getAllPendingInvitations(): PendingInvitationRecord[] {
  const { userProfile, teams } = getStorage();
  const records: PendingInvitationRecord[] = [];
  for (const team of teams) {
    const inv = team.invitations.find(i => i.tag === userProfile.tag && i.status === 'pending');
    if (inv) {
      records.push({
        teamId: team.id,
        teamName: team.teamName,
        hackathonSlug: team.hackathonSlug,
        selectedRole: inv.selectedRole,
        sentAt: inv.sentAt,
      });
    }
  }
  return records.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export function findUserByTag(tag: string): { name: string; tag: string } | null {
  const { userProfile, teams } = getStorage();
  if (userProfile.tag === tag) return { name: userProfile.name, tag: userProfile.tag };
  for (const team of teams) {
    const member = team.members.find(m => m.tag === tag);
    if (member) return { name: member.name, tag: member.tag };
    const applicant = team.applicants.find(a => a.tag === tag);
    if (applicant) return { name: applicant.name, tag: applicant.tag };
  }
  return null;
}

export function sendInvitation(teamId: string, tag: string, selectedRole?: string): 'ok' | 'already_member' | 'already_invited' | 'self' | 'not_found' | 'not_registered' | 'already_in_team' | 'already_applicant' {
  const { userProfile, teams, leaderboards } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return 'ok';
  if (tag === userProfile.tag) return 'self';
  if (team.members.some(m => m.tag === tag)) return 'already_member';
  if (team.invitations.some(i => i.tag === tag && i.status === 'pending')) return 'already_invited';

  const user = findUserByTag(tag);
  if (!user) return 'not_found';

  // 1. 이미 나의 팀에 지원한 지원자인가?
  if (team.applicants.some(a => a.tag === tag && a.status === 'pending')) return 'already_applicant';

  // 사용자가 한 번 초대를 취소했던 이력이 있다면, (테스트/모의 동작 지원) 타 팀 소속 여부와 관계없이 재초대가 가능하도록 허용
  const cancelledStr = localStorage.getItem('daker_cancelled_invites') || '[]';
  const cancelledInvites: string[] = JSON.parse(cancelledStr);
  const isCancelledBefore = cancelledInvites.includes(tag);

  // 2. 이미 이 대회에 참가 중인 타 팀에 속해있는지 검사 (단, 취소 이력이 있으면 테스트 원활을 위해 스킵)
  const inOtherTeam = !isCancelledBefore && teams.some(t => t.hackathonSlug === team.hackathonSlug && t.members.some(m => m.tag === tag));
  if (inOtherTeam) return 'already_in_team';

  // 3. 이 대회에 참가를 신청한 기록이 있는지 검사
  let isRegistered = false;
  if (tag === userProfile.tag) {
    isRegistered = userProfile.joinedHackathons.includes(team.hackathonSlug || '');
  } else {
    // 가상 유저(목업)의 경우 참가 신청 여부를 검사: 해당 대회의 다른 팀에 지원자(applicant)나 멤버(member)로 있거나 리더보드에 있는지 확인
    isRegistered = teams.some(t => t.hackathonSlug === team.hackathonSlug && (t.applicants.some(a => a.tag === tag) || t.members.some(m => m.tag === tag))) ||
                   leaderboards.some(l => l.hackathonSlug === team.hackathonSlug && l.memberTags.includes(tag));
  }
  
  if (!isRegistered) return 'not_registered';

  const invitation: Invitation = {
    tag,
    name: user.name || '알 수 없는 사용자',
    sentAt: new Date().toISOString(),
    status: 'pending',
    selectedRole,
  };
  updateTeam(teamId, { invitations: [...team.invitations, invitation] });
  return 'ok';
}

export function cancelInvitation(teamId: string, tag: string): void {
  const { teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  updateTeam(teamId, {
    invitations: team.invitations.filter(i => i.tag !== tag),
  });
  
  try {
    const cancelledStr = localStorage.getItem('daker_cancelled_invites') || '[]';
    const cancelled = JSON.parse(cancelledStr);
    if (!cancelled.includes(tag)) {
      cancelled.push(tag);
      localStorage.setItem('daker_cancelled_invites', JSON.stringify(cancelled));
    }
  } catch (e) { /* ignore */ }
}

export function acceptInvitation(teamId: string): 'ok' | 'not_found' | 'already_in_team' | 'already_finalized' {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return 'not_found';

  // 해커톤 별 중복 참가 체크
  if (team.hackathonSlug) {
    // 1. 개인 참가자로 이미 최종 제출을 완료했는지 체크
    const personalData = userProfile.personalData[team.hackathonSlug];
    if (personalData?.personalSubmission) {
      return 'already_finalized';
    }

    // 2. 다른 팀에 이미 소속되어 있는지 체크
    const existingTeam = teams.find(t => 
      t.id !== teamId && 
      t.hackathonSlug === team.hackathonSlug &&
      t.members.some(m => m.tag === userProfile.tag)
    );

    if (existingTeam) {
      return existingTeam.isFinalized ? 'already_finalized' : 'already_in_team';
    }
  }

  const invitation = team.invitations.find(i => i.tag === userProfile.tag);
  if (!invitation) return 'not_found';

  const newMember: TeamMember = {
    tag: userProfile.tag,
    name: userProfile.name,
    role: invitation.selectedRole || userProfile.techStack[0]?.category || 'General',
    joinedAt: new Date().toISOString().split('T')[0],
    currentTask: '팀 합류 완료',
  };

  const updatedInvitations = team.invitations.map(i =>
    i.tag === userProfile.tag ? { ...i, status: 'accepted' as const } : i
  );

  updateTeam(teamId, {
    members: [...team.members, newMember],
    invitations: updatedInvitations,
  });

  if (team.hackathonSlug) registerForHackathon(team.hackathonSlug);
  return 'ok';
}

export function rejectInvitation(teamId: string): void {
  const { userProfile, teams } = getStorage();
  const team = teams.find(t => t.id === teamId);
  if (!team) return;

  const updatedInvitations = team.invitations.map(i =>
    i.tag === userProfile.tag ? { ...i, status: 'rejected' as const } : i
  );
  updateTeam(teamId, { invitations: updatedInvitations });
}

// ─── Team Lock / Unlock ───────────────────────────────────────

export function lockTeam(teamId: string): void {
  updateTeam(teamId, { isTeamLocked: true });
}

export function unlockTeam(teamId: string): void {
  updateTeam(teamId, { isTeamLocked: false });
}



// ─── Reset ───────────────────────────────────────
export const resetStorageData = () => {
  if (typeof window === 'undefined') return;

  // 1. 브라우저의 모든 저장 데이터 삭제
  localStorage.clear();

  // 2. 기존에 정의된 initStorage 함수를 실행하여 
  //    v4 버전의 초기 데모 데이터를 다시 주입합니다.
  initStorage();

  // 3. 페이지를 새로고침하여 리셋된 데이터를 즉시 반영합니다.
  window.location.reload();
};
