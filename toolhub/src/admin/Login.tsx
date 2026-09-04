import { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, Lock, UserRound } from "lucide-react";
import { Spinner } from "../components/ui";
import { Turnstile } from "../components/Turnstile";
import { useConfig } from "../lib/queries";
import { useLogin } from "./auth";

interface LoginForm {
  username: string;
  password: string;
}

// The panel shows nothing about the catalog until a staff account signs in,
// and there is no "create account" path: staff are added from inside.
export function Login() {
  const login = useLogin();
  const { data: config } = useConfig();
  const [botToken, setBotToken] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const needsChallenge = config?.turnstile.login === true;
  const [blocked, setBlocked] = useState("");

  const onSubmit = handleSubmit((values) => {
    // A disabled button with no explanation looks like a broken page, so the
    // missing challenge is reported instead of silently swallowing the click.
    if (needsChallenge && !botToken) {
      setBlocked("Complete the bot check above, then sign in. If it does not appear, disable your blocker for this page.");
      return;
    }
    setBlocked("");
    login.mutate(
      { ...values, ...(needsChallenge ? { turnstileToken: botToken } : {}) },
      { onError: () => setBotToken("") }
    );
  });

  return (
    <div className="login-shell">
      {/* noValidate: the browser's own bubble can block submission without
          showing anything, so validation is reported in the form instead. */}
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-mark"><KeyRound size={20} /></div>
        <h1>Staff sign in</h1>
        <p>This area is restricted. Sign in with your ToolHub staff account.</p>

        <label>
          <UserRound size={13} /> Login
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            {...register("username", {
              required: "Login is required",
              minLength: { value: 3, message: "At least 3 characters" },
              pattern: {
                value: /^[A-Za-z0-9._-]+$/,
                message: "Latin letters, digits, dot, underscore and dash only"
              }
            })}
            placeholder="admin"
          />
          {errors.username ? <em className="field-error">{errors.username.message}</em> : null}
        </label>

        <label>
          <Lock size={13} /> Password
          <input
            type="password"
            autoComplete="current-password"
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "At least 8 characters" } })}
            placeholder="••••••••"
          />
          {errors.password ? <em className="field-error">{errors.password.message}</em> : null}
        </label>

        {login.isError ? (
          <div className="login-error">{login.error instanceof Error ? login.error.message : "Sign in failed"}</div>
        ) : null}
        {blocked ? <div className="login-error">{blocked}</div> : null}

        {needsChallenge && config ? (
          <Turnstile siteKey={config.turnstile.siteKey} onToken={setBotToken} />
        ) : null}

        <button className="btn primary full" type="submit" disabled={login.isPending}>
          {login.isPending ? <Spinner size={14} /> : null} Sign in
        </button>
        <small className="login-note">Sessions expire automatically. Repeated failures are rate limited.</small>
      </form>
    </div>
  );
}
