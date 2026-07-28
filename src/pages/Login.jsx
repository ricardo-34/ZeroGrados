import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { resetSocket } from '../hooks/useSocket.js';

const DEMO = [
  { rol: 'Admin', email: 'admin@zerogrados.com', pass: 'admin123' },
  { rol: 'Cajero', email: 'cajero@zerogrados.com', pass: 'cajero123' },
  { rol: 'Mesero', email: 'mesero@zerogrados.com', pass: 'mesero123' },
  { rol: 'Cocina', email: 'cocina@zerogrados.com', pass: 'cocina123' },
];

const FONTS =
  'https://fonts.googleapis.com/css2?family=Anton&family=Pacifico&family=Rubik:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap';

// Inyecta las fuentes y las animaciones una sola vez.
function ensureAssets() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('zg-fonts')) {
    const l = document.createElement('link');
    l.id = 'zg-fonts';
    l.rel = 'stylesheet';
    l.href = FONTS;
    document.head.appendChild(l);
  }
  if (!document.getElementById('zg-anim')) {
    const s = document.createElement('style');
    s.id = 'zg-anim';
    s.textContent = `
      @keyframes zgSpin{to{transform:rotate(360deg)}}
      @keyframes zgPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.85;transform:scale(1.12)}}
      @keyframes zgDrop{0%{transform:translateY(-10px) scaleY(.8);opacity:0}30%{opacity:1}100%{transform:translateY(140px) scaleY(1.5);opacity:0}}
      @keyframes zgSpinner{to{transform:rotate(360deg)}}
      @keyframes zgMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      .zg-input:focus{border-color:#12A29A !important;box-shadow:0 0 0 5px rgba(55,208,222,.22) !important;outline:none}
      .zg-input::placeholder{color:rgba(11,79,76,.42)}
      .zg-submit:hover{transform:translateY(4px);box-shadow:0 5px 0 #062F2D !important;color:#FFD52E !important}
      .zg-eye:hover{background:#37D0DE !important}
      .zg-demo:hover{background:rgba(55,208,222,.22) !important;border-color:#12A29A !important;transform:translateY(-3px)}
      .zg-support a{color:#37D0DE;text-decoration:none}
      .zg-support a:hover{color:#FFD52E}
    `;
    document.head.appendChild(s);
  }
}

export default function Login() {
  ensureAssets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [visible, setVisible] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setError('');
    setCargando(true);
    try {
      resetSocket();
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const usarDemo = (d) => {
    setEmail(d.email);
    setPassword(d.pass);
    setError('');
  };

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(20px,4vh,40px)',
        padding: 'clamp(24px,4vw,56px)',
        boxSizing: 'border-box',
        fontFamily: 'Rubik, system-ui, sans-serif',
        background:
          'radial-gradient(120% 90% at 15% 0%,#12A29A 0%,#0B4F4C 46%,#062F2D 100%)',
        isolation: 'isolate',
        overflow: 'hidden',
      }}
    >
      {/* Textura de puntos */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,249,236,.14) 1.4px,transparent 1.5px)',
          backgroundSize: '26px 26px',
          opacity: 0.5,
          zIndex: 0,
        }}
      />
      {/* Halo pulsante */}
      <div
        style={{
          position: 'absolute',
          top: '-22%',
          left: '-8%',
          width: 'min(900px,110vw)',
          height: 'min(900px,110vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(191,243,245,.2),rgba(191,243,245,0) 62%)',
          animation: 'zgPulse 10s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      {/* Gotas */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          top: 0,
          width: 9,
          height: 110,
          borderRadius: 999,
          background: 'linear-gradient(#BFF3F5,rgba(191,243,245,0))',
          animation: 'zgDrop 5s ease-in infinite',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '14%',
          top: 0,
          width: 7,
          height: 88,
          borderRadius: 999,
          background: 'linear-gradient(#37D0DE,rgba(55,208,222,0))',
          animation: 'zgDrop 6.4s ease-in 1.4s infinite',
          zIndex: 1,
        }}
      />

      {/* Tarjeta del formulario — más ancha */}
      <div style={{ position: 'relative', width: 'min(100%,640px)', zIndex: 5 }}>
        <div
          style={{
            position: 'absolute',
            inset: -14,
            borderRadius: 44,
            background:
              'conic-gradient(from 0deg,rgba(55,208,222,.35),rgba(255,213,46,.25),rgba(55,208,222,.35))',
            filter: 'blur(26px)',
            zIndex: 0,
          }}
        />

        <form
          onSubmit={submit}
          style={{
            position: 'relative',
            zIndex: 2,
            background: '#FFF9EC',
            color: '#0B4F4C',
            borderRadius: '38px 38px 110px 38px',
            padding: 'clamp(26px,3.4vw,44px)',
            boxShadow: '0 40px 70px rgba(0,0,0,.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  font: '800 11px/1 Rubik',
                  letterSpacing: '.3em',
                  textTransform: 'uppercase',
                  color: '#0E8C86',
                }}
              >
                Iniciar turno
              </div>
              <h2
                style={{
                  margin: '10px 0 0',
                  font: '400 clamp(30px,3.6vw,46px)/.92 Anton',
                  textTransform: 'uppercase',
                  color: '#0B4F4C',
                }}
              >
                Ingresar
              </h2>
              <div className="text-muted" style={{ marginTop: 8, fontSize: 13 }}>
                Sistema POS — Heladería y Granizados
              </div>
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background: '#0B4F4C',
                color: '#FFD52E',
                display: 'grid',
                placeItems: 'center',
                font: '900 20px/1 Anton',
                flex: 'none',
              }}
            >
              0°
            </div>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(232,80,62,.12)',
                border: '1px solid rgba(232,80,62,.45)',
                borderRadius: 20,
                padding: '14px 18px',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#E8503E',
                  color: '#FFF9EC',
                  display: 'grid',
                  placeItems: 'center',
                  font: '800 14px/1 Rubik',
                  flex: 'none',
                }}
              >
                !
              </span>
              <span style={{ font: '500 14px/1.4 Rubik', color: '#8E2318' }}>
                {error}
              </span>
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span
              style={{
                font: '700 11px/1 Rubik',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#0E8C86',
              }}
            >
              Correo electrónico
            </span>
            <input
              className="zg-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@zerogrados.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                font: '500 16px/1 Rubik',
                color: '#0B4F4C',
                background: '#FFFFFF',
                border: '2px solid rgba(11,79,76,.16)',
                borderRadius: 20,
                padding: '17px 20px',
                transition: 'border-color .25s,box-shadow .25s',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span
              style={{
                font: '700 11px/1 Rubik',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#0E8C86',
              }}
            >
              Contraseña
            </span>
            <span style={{ position: 'relative', display: 'block' }}>
              <input
                className="zg-input"
                required
                type={visible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  font: '500 16px/1 Rubik',
                  color: '#0B4F4C',
                  background: '#FFFFFF',
                  border: '2px solid rgba(11,79,76,.16)',
                  borderRadius: 20,
                  padding: '17px 92px 17px 20px',
                  transition: 'border-color .25s,box-shadow .25s',
                }}
              />
              <button
                type="button"
                className="zg-eye"
                onClick={() => setVisible((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  background: 'rgba(55,208,222,.2)',
                  border: 'none',
                  borderRadius: 999,
                  padding: '10px 14px',
                  font: '800 10px/1 Rubik',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: '#0B4F4C',
                  transition: 'background .25s',
                }}
              >
                {visible ? 'Ocultar' : 'Ver'}
              </button>
            </span>
          </label>

          <button
            type="submit"
            className="zg-submit"
            disabled={cargando}
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
              cursor: cargando ? 'default' : 'pointer',
              background: '#0B4F4C',
              color: '#FFF9EC',
              border: 'none',
              borderRadius: 999,
              padding: '20px 28px',
              font: '800 15px/1 Rubik',
              letterSpacing: '.04em',
              boxShadow: '0 9px 0 #062F2D',
              transition: 'transform .2s,box-shadow .2s,color .2s',
            }}
          >
            {cargando && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '3px solid rgba(255,249,236,.35)',
                  borderTopColor: '#FFD52E',
                  animation: 'zgSpinner .8s linear infinite',
                }}
              />
            )}
            <span>{cargando ? 'Ingresando…' : 'Ingresar al turno'}</span>
          </button>

          <div
            style={{
              marginTop: 6,
              borderTop: '2px dashed rgba(11,79,76,.22)',
              paddingTop: 18,
            }}
          >
            <div
              style={{
                font: '700 11px/1 Rubik',
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: '#0E8C86',
              }}
            >
              Accesos de demostración
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  className="zg-demo"
                  onClick={() => usarDemo(d)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '2px solid rgba(11,79,76,.2)',
                    borderRadius: 999,
                    padding: '12px 18px',
                    font: '700 13px/1 Rubik',
                    color: '#0B4F4C',
                    transition: 'transform .25s,background .25s,border-color .25s',
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: '#12A29A',
                    }}
                  />
                  {d.rol}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div
          className="zg-support"
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
            font: '600 12px/1.4 Rubik',
            color: 'rgba(255,249,236,.6)',
          }}
        >
          <span>¿Olvidaste tu clave? Habla con el administrador.</span>
          <a href="#">Soporte</a>
        </div>
      </div>
    </main>
  );
}
