import { MdVerifiedUser } from 'react-icons/md';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/lib/data-store';

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useDataStore((s) => s.login);
  const [isLoading, setIsLoading] = useState(false);

  const handleAzureADLogin = async () => {
    setIsLoading(true);
    // Simulate Azure AD redirect + token exchange
    await new Promise((resolve) => setTimeout(resolve, 1200));
    login('user@company.com', '');
    setIsLoading(false);
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* LEFT SIDE - Huawei Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-red-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-red-500/6 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-red-600/4 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top - Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src="/huawei-logo.png"
              alt="Huawei"
              className="h-14 w-auto brightness-0 invert opacity-90"
            />
          </motion.div>

          {/* Center - Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Large watermark logo — static, no animation */}
            <div className="mb-12">
              <img
                src="/huawei-logo.png"
                alt=""
                className="opacity-[0.06] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
                style={{ width: '500px', filter: 'brightness(0) invert(1)' }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Cloud FinOps
                <br />
                <span className="text-red-500">Platform</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                Enterprise-grade cloud cost management, optimization, and governance for Huawei Cloud Stack.
              </p>
            </motion.div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-4"
            >
              {[
                'Real-time cost analytics & trend forecasting',
                'AI-powered optimization recommendations',
                'Multi-tenant governance & budget management',
                'Tag compliance & waste detection',
              ].map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-1 h-5 rounded-full bg-red-500/60" />
                  <span className="text-sm text-slate-400">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-xs text-slate-600">
              Powered by Huawei Cloud Stack (HCS) 8.5
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-bl from-muted/50 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-sm"
        >
          {/* Mobile logo (shown on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/huawei-logo.png"
              alt="Huawei"
              className="h-12 w-auto dark:brightness-0 dark:invert dark:opacity-90"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access the FinOps Platform
            </p>
          </div>

          {/* Azure AD Button */}
          <div className="space-y-4">
            <Button
              onClick={handleAzureADLogin}
              disabled={isLoading}
              className="w-full h-12 bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20 border-0 ring-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  {/* Microsoft logo SVG */}
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                  Sign in with Microsoft
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-muted-foreground bg-background">
                  Azure Active Directory
                </span>
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <MdVerifiedUser className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Enterprise SSO
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Authentication is managed through your organization's Azure Active Directory. Click the button above to sign in with your corporate credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 text-center space-y-3">
            <p className="text-xs text-muted-foreground/70">
              By signing in, you agree to the platform's terms of use and privacy policy.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/70">
              <button className="hover:text-foreground transition-colors">
                Terms of Service
              </button>
              <span>|</span>
              <button className="hover:text-foreground transition-colors">
                Privacy Policy
              </button>
              <span>|</span>
              <button className="hover:text-foreground transition-colors">
                Support
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
