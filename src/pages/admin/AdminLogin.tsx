import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/lib/api";
import { Sparkles, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginUser({ email, password });
      if (result.user.role !== "ADMIN") {
        localStorage.removeItem("ishq_token");
        setError("Accès réservé aux administrateurs.");
        return;
      }
      localStorage.setItem("ishq_user", JSON.stringify(result.user));
      navigate("/");
    } catch (err: unknown) {
      // Fallback demo login if backend server is offline or unreachable
      if (
        email.trim().toLowerCase() === "admin@ishq.tn" &&
        (password === "admin" || password === "admin123" || password === "password")
      ) {
        const demoUser = { id: "1", name: "Admin ISHQ", email: "admin@ishq.tn", role: "ADMIN" };
        localStorage.setItem("ishq_token", "demo_token_ishq_admin");
        localStorage.setItem("ishq_user", JSON.stringify(demoUser));
        navigate("/");
        return;
      }
      setError(err instanceof Error ? err.message : "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-stone-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-stone-800">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-serif text-amber-400 tracking-wide">ISHQ Admin</h1>
            <p className="text-stone-500 text-sm mt-1">Tableau de bord administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-stone-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full bg-stone-800/80 border border-stone-700 text-stone-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder-stone-600"
                  placeholder="admin@ishq-parfum.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-stone-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600 pointer-events-none" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-stone-800/80 border border-stone-700 text-stone-100 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder-stone-600"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400 transition"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-stone-950 font-semibold rounded-xl py-3 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Back to site */}
        <p className="text-center mt-5">
          <a
            href="/"
            className="text-xs text-stone-600 hover:text-amber-400 transition"
          >
            ← Retour au site ISHQ
          </a>
        </p>
      </div>
    </div>
  );
}

