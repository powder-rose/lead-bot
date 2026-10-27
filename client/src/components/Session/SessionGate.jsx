import { useEffect, useState } from 'react';
import { apiFetch, SESSION_EXPIRED_EVENT } from '../../api/apiFetch.js';
import { SessionContext } from './SessionContext.js';
import { LoginScreen, LoginCard, SessionButton, SessionError } from './Session.styles.js';

const sessionRequest = async options => {
  const response = await apiFetch('/api/session', { cache: 'no-store', ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Не удалось проверить доступ');
  return payload.data;
};

const LoginForm = ({ onLogin, notice }) => {
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await sessionRequest({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setPassword('');
      onLogin();
    } catch (error) {
      setError(error.message || 'Не удалось войти. Проверьте соединение');
      setPassword('');
    } finally {
      setPending(false);
    }
  };

  return (
    <LoginScreen>
      <LoginCard aria-labelledby="login-title">
        <h1 id="login-title">Вход в LeadBot</h1>
        <p>{notice || 'Введите пароль команды, чтобы продолжить.'}</p>
        <form onSubmit={submit}>
          <label htmlFor="team-password">
            Пароль команды
            <input
              id="team-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              maxLength={1024}
              disabled={pending}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>
          {error && (
            <SessionError id="login-error" role="alert">
              {error}
            </SessionError>
          )}
          <SessionButton type="submit" disabled={pending}>
            {pending ? 'Входим…' : 'Войти'}
          </SessionButton>
        </form>
      </LoginCard>
    </LoginScreen>
  );
};

export const SessionGate = ({ children }) => {
  const [status, setStatus] = useState('loading');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    sessionRequest({ signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted)
          setStatus(data.authenticated ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    const onExpired = () => {
      setStatus('anonymous');
      setNotice('Сессия завершилась. Войдите снова.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');
    try {
      await sessionRequest({ method: 'DELETE' });
      setNotice('Вы вышли из LeadBot.');
      setStatus('anonymous');
    } catch {
      setLogoutError('Не удалось выйти. Проверьте соединение и повторите.');
    } finally {
      setLoggingOut(false);
    }
  };

  if (status === 'loading' || status === 'unavailable') {
    return (
      <LoginScreen>
        <LoginCard>
          <h1>LeadBot</h1>
          <p role="status">
            {status === 'loading'
              ? 'Проверяем доступ…'
              : 'Сервер недоступен. Проверьте соединение.'}
          </p>
          {status === 'unavailable' && (
            <SessionButton
              onClick={() => {
                setStatus('loading');
                setAttempt(value => value + 1);
              }}
            >
              Повторить
            </SessionButton>
          )}
        </LoginCard>
      </LoginScreen>
    );
  }

  if (status === 'anonymous') {
    return (
      <LoginForm
        notice={notice}
        onLogin={() => {
          setStatus('authenticated');
          setLogoutError('');
        }}
      />
    );
  }

  return (
    <SessionContext.Provider value={{ logout, loggingOut, logoutError }}>
      {children}
    </SessionContext.Provider>
  );
};
