import { Link, useLocation } from 'react-router';
import { Zap, Users, Trophy, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getStorage } from '../../lib/storage';
import { motion, AnimatePresence } from 'motion/react';

const NAV_LINKS = [
  { href: '/hackathons', label: '해커톤', icon: Zap },
  { href: '/camp', label: '팀 모집', icon: Users },
  { href: '/rankings', label: '랭킹', icon: Trophy },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUser = () => {
      const { userProfile } = getStorage();
      setUserName(userProfile.name);
    };
    loadUser();
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) => {
    // hash router: pathname is the part after '#'
    const path = location.pathname;
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(7, 7, 15, 0.9)'
            : 'rgba(7, 7, 15, 0.6)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
              >
                <Zap size={16} className="text-white" />
              </div>
              <span
                className="text-xl tracking-tight"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff' }}
              >
                DAKER
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
                  style={{
                    color: isActive(href) ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                    background: isActive(href) ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                    fontWeight: isActive(href) ? 600 : 400,
                  }}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Profile */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200"
                style={{
                  color: isActive('/profile') ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                  background: isActive('/profile') ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <User size={15} />
                <span className="max-w-24 truncate">{userName || 'Profile'}</span>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.05)' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden"
            style={{
              background: 'rgba(7, 7, 15, 0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                  style={{
                    color: isActive(href) ? '#a78bfa' : 'rgba(255,255,255,0.8)',
                    background: isActive(href) ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                style={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <User size={16} />
                프로필
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}