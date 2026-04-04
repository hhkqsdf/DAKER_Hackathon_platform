// Tech categories and their associated skills
export const TECH_CATEGORIES = [
  'Frontend',
  'Backend',
  'DevOps',
  'Design',
  'AI/ML',
  'Mobile',
  'Data',
  'Blockchain',
] as const;

export type TechCategory = typeof TECH_CATEGORIES[number];

export const SKILLS_BY_CATEGORY: Record<TechCategory, string[]> = {
  Frontend: ['React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Three.js', 'Svelte', 'WebGL', 'Flutter', 'Dart', 'React Native'],
  Backend: ['Node.js', 'Python', 'Go', 'Java', 'Rust', 'FastAPI', 'Django', 'Spring', 'Express', 'GraphQL', 'PostgreSQL', 'MongoDB', 'Redis'],
  DevOps: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'Linux', 'Nginx', 'GitHub Actions'],
  Design: ['Figma', 'UI/UX', 'Prototyping', 'User Research', 'Motion Design', 'Brand Design', 'Accessibility'],
  'AI/ML': ['PyTorch', 'TensorFlow', 'LangChain', 'OpenAI API', 'HuggingFace', 'scikit-learn', 'Computer Vision', 'NLP', 'RAG', 'LoRA'],
  Mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Expo'],
  Data: ['Python', 'SQL', 'Tableau', 'Power BI', 'Spark', 'Kafka', 'Airflow', 'dbt', 'Pandas'],
  Blockchain: ['Solidity', 'Web3.js', 'Ethers.js', 'Hardhat', 'IPFS', 'EVM', 'Smart Contracts'],
};

export const CATEGORY_COLORS: Record<TechCategory, { bg: string; text: string; border: string }> = {
  Frontend: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  Backend: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  DevOps: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  Design: { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' },
  'AI/ML': { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30' },
  Mobile: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Data: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  Blockchain: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
};

export const STATUS_CONFIG = {
  ongoing: { label: '진행 중', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  upcoming: { label: '예정', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  ended: { label: '종료', bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

export const PHASE_LABELS = [
  { phase: 0, label: '참가 등록', icon: '🎯', desc: '해커톤 참가를 등록했어요.' },
  { phase: 1, label: '아이디어 구상', icon: '💡', desc: '아이디어를 구체화하고 기술 스택을 정해요.' },
  { phase: 2, label: '개발 진행', icon: '⚡', desc: '본격적인 개발에 집중해요.' },
  { phase: 3, label: '최종 제출', icon: '🚀', desc: '프로젝트를 마무리하고 제출해요.' },
];

export const RANKING_PERIOD_OPTIONS = [
  { value: 'all', label: '전체 기간' },
  { value: '30d', label: '최근 30일' },
  { value: '7d', label: '최근 7일' },
];

// ─── Role Proximity Map ──────────────────────────────────────
// 직무 간 연관성 점수 (0~50, 직접 일치=50은 별도 처리)
// 키 형식: 두 직무명을 알파벳 순으로 정렬해 '|'로 연결 ex) "Design|Frontend"
export const ROLE_PROXIMITY_MAP: Record<string, number> = {
  // AI/ML 계열
  'AI/ML|Backend':    15, // MLOps/API serving 교차점
  'AI/ML|Blockchain': 10, // 온체인 ML 활용
  'AI/ML|Data':       35, // 데이터 사이언스 고도 중첩
  'AI/ML|Design':      5, // 낮은 연관성
  'AI/ML|DevOps':     15, // MLOps 파이프라인
  'AI/ML|Frontend':    8, // AI 기반 UI 연동
  'AI/ML|Mobile':      8, // 온디바이스 ML
  // Backend 계열
  'Backend|Blockchain': 20, // 스마트 컨트랙트 백엔드
  'Backend|Data':       20, // DB·API 연동
  'Backend|Design':      5, // 낮음
  'Backend|DevOps':     25, // 인프라·서버 교차점
  'Backend|Frontend':   10, // 풀스택 교차점
  'Backend|Mobile':     10, // 모바일 API 연동
  // Blockchain 계열
  'Blockchain|Data':    10, // 온체인 데이터 분석
  'Blockchain|Design':   5, // dApp UX
  'Blockchain|DevOps':  10, // 노드 인프라
  'Blockchain|Frontend': 15, // Web3 프론트엔드
  'Blockchain|Mobile':   8, // 크립토 지갑 앱
  // Data 계열
  'Data|Design':       8,  // 데이터 시각화
  'Data|DevOps':      20,  // 데이터 파이프라인 인프라
  'Data|Frontend':     8,  // 대시보드 UI
  'Data|Mobile':       5,  // 낮음
  // Design 계열
  'Design|DevOps':     5,  // 낮음
  'Design|Frontend':  35,  // UI/UX ↔ 프론트엔드 고도 중첩
  'Design|Mobile':    30,  // 모바일 UX 설계
  // DevOps 계열
  'DevOps|Frontend':   5,  // 낮음
  'DevOps|Mobile':     5,  // 모바일 CI/CD
  // Frontend ↔ Mobile
  'Frontend|Mobile':  25,  // React Native 교차점
};

/**
 * 두 직무 간 유사도 점수를 반환합니다.
 * @returns 0~50 (직접 일치 = 50)
 */
export function getRoleProximityScore(userRole: string, requiredRole: string): number {
  if (userRole.toLowerCase() === requiredRole.toLowerCase()) return 50;
  const key = [userRole, requiredRole].sort().join('|');
  return ROLE_PROXIMITY_MAP[key] ?? 0;
}