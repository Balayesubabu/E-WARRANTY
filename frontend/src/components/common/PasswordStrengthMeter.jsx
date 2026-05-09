import { useMemo } from 'react';
import { isPasswordStrong, PASSWORD_HINT_TEXT } from '../../utils/passwordPolicy';

export function PasswordStrengthMeter({ password = '', showHint = true }) {
  const isStrong = useMemo(() => isPasswordStrong(password), [password]);

  if (!password) {
    return showHint ? (
      <p className="pt-1.5 text-xs text-slate-500">{PASSWORD_HINT_TEXT}</p>
    ) : null;
  }

  return (
    <>
      {showHint ? <p className="pt-1 text-xs text-slate-500">{PASSWORD_HINT_TEXT}</p> : null}
      <p className={`pt-1.5 text-xs font-medium ${isStrong ? 'text-green-600' : 'text-red-500'}`}>
        {isStrong ? 'Strong password' : 'Weak password — meet all requirements above'}
      </p>
    </>
  );
}
