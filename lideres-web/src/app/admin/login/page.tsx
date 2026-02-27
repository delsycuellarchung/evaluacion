"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const disableDb = String(process.env.NEXT_PUBLIC_DISABLE_DB || '').toLowerCase() === 'true';

  // NO redirección automática: solo login manual
  // Si quieres auditar el login, no debe saltar directo al dashboard
  // Redirige solo cuando el usuario envía el formulario o pulsa el botón de 'Forzar login dev'

  const submitLabel = useMemo(() => {
    if (mode === "register") return "Crear cuenta";
    if (mode === "reset") return "Enviar enlace";
    return "Ingresar";
  }, [mode]);

  // Maneja el submit del formulario: valida credenciales básicas y redirige
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Credencial de desarrollo temporal
    if (mode === "login" && email.trim() === "admin" && password === "admin123") {
      localStorage.setItem("adminAuth", "true");
      router.push("/admin/dashboard");
      return;
    }

    if (!email.trim()) {
      setError("El correo es obligatorio.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("El correo no es válido.");
      return;
    }

    if (mode === "register" && !fullName.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }

    if (mode !== "reset" && !password) {
      setError("La contraseña es obligatoria.");
      return;
    }

    if (mode !== "reset") {
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password);

      if (!hasUpperCase) {
        setError("La contraseña debe incluir al menos una letra mayúscula.");
        return;
      }
      if (!hasNumber) {
        setError("La contraseña debe incluir al menos un número.");
        return;
      }
      if (!hasSpecialChar) {
        setError("La contraseña debe incluir al menos un carácter especial (!@#$%^&*...).");
        return;
      }
    }

    setLoading(true);

    try {
      if (!supabase || disableDb) {
        setError("Base de datos deshabilitada. Usa admin/admin123 para entrar en modo local.");
        return;
      }
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/admin/dashboard");
        return;
      }

      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (signUpError) throw signUpError;
        setSuccess("Revisa tu correo para confirmar el registro.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });
      if (resetError) throw resetError;
      setSuccess("Te enviamos un enlace para restablecer la contraseña.");
    } catch (err: any) {
      console.error("Auth error:", err);
      // Mostrar mensaje amigable, y si estamos en desarrollo mostrar más detalle
      setError(err?.message || "Ocurrió un error. Intenta nuevamente.");
      if (process.env.NODE_ENV === "development") {
        // @ts-ignore
        setSuccess(JSON.stringify(err, Object.getOwnPropertyNames(err)).slice(0, 1000));
      }
    } finally {
      setLoading(false);
    }
  }

  // Toggle para mostrar/ocultar la contraseña en el input
  function handleTogglePassword() {
    setShowPassword((s) => !s);
  }

  return (
    <div className="login-container">
      <main className="login-card card-enter">
        <h1 className="login-title">
          {mode === "login" ? "Login" : mode === "register" ? "Crear cuenta" : "Recuperar contraseña"}
        </h1>
        <form onSubmit={handleSubmit} className="login-form">
          {mode === "register" ? (
            <label className="login-field">
              <span className="mb-1 text-sm" style={{display:'block',marginBottom:'6px'}}>Nombre completo</span>
              <div className="password-wrapper">
                <input
                  className="login-input input-anim"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  style={{ paddingLeft: 44 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <img src="/images/nombre.png" alt="nombre" style={{ width: 20, height: 20, display: 'block', opacity: 0.6 }} />
                </span>
              </div>
            </label>
          ) : null}

          <label className="login-field">
            <span className="mb-1 text-sm" style={{display:'block',marginBottom:'6px'}}>Correo</span>
            <div className="password-wrapper">
              <input
                className="login-input input-anim"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                type="email"
                style={{ paddingLeft: 44 }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <img src="/images/correo.png" alt="correo" style={{ width: 20, height: 20, display: 'block', opacity: 0.6 }} />
              </span>
            </div>
          </label>

          {mode !== "reset" ? (
            <label className="login-field">
              <span className="mb-1 text-sm" style={{display:'block',marginBottom:'6px'}}>Contraseña</span>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input input-anim"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  style={{ paddingLeft: 44 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <img src="/images/contraseña.png" alt="contraseña" style={{ width: 20, height: 20, display: 'block', opacity: 0.6 }} />
                </span>
                <button
                  type="button"
                  className={"pw-toggle " + (showPassword ? "active" : "")}
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.94 10.94a3 3 0 004.12 4.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.53 12.15C3.8 8.12 7.6 5.25 12 5.25c1.1 0 2.17.16 3.16.46" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </label>
          ) : null}

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <div className="btn-row">
            <button type="submit" className="login-button btn-press" disabled={loading}>
              {loading ? "Procesando..." : submitLabel}
            </button>
          </div>

          <div className="login-links">
            {mode !== "login" ? (
              <button type="button" className="link-btn" onClick={() => setMode("login")}>
                Volver a iniciar sesión
              </button>
            ) : null}
            {mode === "login" ? (
              <>
                <button type="button" className="link-btn" onClick={() => setMode("register")}>
                  Crear cuenta
                </button>
                <span style={{ color: 'rgba(15,23,42,0.3)', userSelect: 'none' }}>|</span>
                <button type="button" className="link-btn" onClick={() => setMode("reset")}>
                  Olvidé mi contraseña
                </button>
              </>
            ) : null}
          </div>
          <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Debug:</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  // Forzar credencial de desarrollo
                  localStorage.setItem('adminAuth', 'true');
                  router.push('/admin/dashboard');
                }}
              >
                Forzar login dev
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
