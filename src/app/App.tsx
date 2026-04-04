import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { initStorage, resetStorageData } from '../lib/storage';
import { RefreshCw } from 'lucide-react';

// ─── 1. 리셋 버튼 컴포넌트 (파일 내부에서 정의) ───
function ResetDemoButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {/* 우측 하단 플로팅 버튼 */}
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 z-[9999]"
        style={{ 
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', 
          boxShadow: '0 8px 30px rgba(124,58,237,0.4)' 
        }}
        title="데이터 초기화"
      >
        <RefreshCw size={24} className="text-white" />
      </button>

      {/* 리셋 확인 모달 */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" 
          onClick={() => setShowConfirm(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl p-6 bg-[#0f0f1f] border border-violet-500/30" 
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-bold mb-2">데이터 초기화</h3>
            <p className="text-sm text-white/60 mb-6">모든 변경 사항을 삭제하고 초기 데모 상태로 되돌리시겠습니까?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="flex-1 py-3 rounded-xl text-sm text-white/70 bg-white/5"
              >
                취소
              </button>
              <button 
                onClick={resetStorageData} 
                className="flex-1 py-3 rounded-xl text-sm text-white bg-violet-600 font-bold"
              >
                리셋 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 2. 메인 App 컴포넌트 (단 하나만 존재해야 함) ───
export default function App() {
  useEffect(() => {
    // 버전 체크 로직: v4가 없을 때만 최초 1회 초기화 진행
    const DEMO_VERSION = 'daker_initialized_v4';

    if (!localStorage.getItem(DEMO_VERSION)) {
      // 1. 구버전 파편 및 기존 데이터 삭제
      localStorage.removeItem('daker_initialized_v3');
      localStorage.removeItem('daker_initialized_v2');
      localStorage.removeItem('daker_initialized_v1');
      localStorage.removeItem('daker_storage');

      // 2. 초기 데이터 주입 (storage.ts의 initStorage 실행)
      initStorage();

      // 3. 버전 마킹 (이제 새로고침해도 다시 초기화되지 않음)
      localStorage.setItem(DEMO_VERSION, 'true');
    }
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      
      {/* 리셋 버튼 배치 */}
      <ResetDemoButton /> 

      {/* 토스터 설정 (스타일 유지) */}
      <Toaster
        position="top-right"
        offset={{ top: 72 }}
        toastOptions={{
          style: {
            background: 'rgba(15, 10, 30, 0.95)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            wordBreak: 'keep-all',
            overflowWrap: 'break-word',
          },
        }}
        style={{ '--width': '360px' } as React.CSSProperties}
        richColors
      />
    </>
  );
}