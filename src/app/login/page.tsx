import { LoginForm } from "./_components/login-form";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your ZeronERP account",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left — Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 items-center justify-center p-12">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -right-[20%] w-[700px] h-[700px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-white/3 blur-2xl" />
        </div>

        <div className="relative z-10 max-w-lg text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M14 14L26 8" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 14L2 8" stroke="currentColor" strokeWidth="2"/>
                <path d="M14 14V26" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">ZeronERP</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Business management,
            <br />
            <span className="text-white/80">radically simplified.</span>
          </h1>

          <p className="text-lg text-white/70 leading-relaxed mb-8">
            A modern ERP platform with built-in AI that eliminates complexity.
            Manage inventory, sales, procurement, and finance — all in one place.
          </p>

          <div className="space-y-4">
            {[
              "AI-powered document scanning — photograph a bill, get it auto-filled",
              "Ask questions in plain language — get instant business insights",
              "GST-compliant invoicing built right in",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-white/80 text-sm leading-snug">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M14 14L26 8" stroke="white" strokeWidth="2"/>
                <path d="M14 14L2 8" stroke="white" strokeWidth="2"/>
                <path d="M14 14V26" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ZeronERP</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1.5">Welcome back</h2>
          <p className="text-muted-foreground mb-8">
            Sign in to your account to continue
          </p>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
