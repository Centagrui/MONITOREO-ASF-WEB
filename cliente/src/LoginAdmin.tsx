import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  onLoginExitoso: (adminName: string) => void;
}

export const LoginAdmin: React.FC<Props> = ({ onLoginExitoso }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await axios.post('http://localhost:3000/api/admin/login', {
        usuario,
        password
      });

      sessionStorage.setItem('admin_sesion', res.data.admin);
      onLoginExitoso(res.data.admin);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Acceso no autorizado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="asf-card shadow p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold" style={{ color: 'var(--agro-green-dark)' }}>
            Agro Santa Fé
          </h2>
          <span className="badge asf-badge-magenta mb-2">Panel Administrativo</span>
          <p className="text-muted small mb-0">Ingresa tus credenciales para ver el monitoreo</p>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Usuario Administrador</label>
            <input
              type="text"
              className="form-control"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: admin"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn asf-btn-primary w-100 py-2 shadow-sm"
            disabled={cargando}
          >
            {cargando ? 'Verificando...' : 'Entrar al Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};