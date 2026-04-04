import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-8xl mb-6"
        >
          🛸
        </motion.div>
        <h1
          className="text-6xl mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #fff, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>
        <p className="text-xl text-white mb-2" style={{ fontWeight: 600 }}>
          길을 잃었어요
        </p>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
          요청하신 페이지를 찾을 수 없어요.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}
          >
            <Home size={15} />
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            <ArrowLeft size={15} />
            이전 페이지
          </button>
        </div>
      </motion.div>
    </div>
  );
}
