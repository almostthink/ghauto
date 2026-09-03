import { useForm } from "react-hook-form";
import { KeyRound, Lock, Mail } from "lucide-react";
import { Spinner } from "../components/ui";
import { useLogin } from "./auth";

interface LoginForm {
  email: string;
  password: string;
}

// The panel shows nothing about the catalog until a staff account signs in,
// and there is no "create account" path: staff are added from inside.
export function Login() {
  const login = useLogin();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = handleSubmit((values) => login.mutate(values));

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-mark"><KeyRound size={20} /></div>
        <h1>Staff sign in</h1>
        <p>This area is restricted. Sign in with your ToolHub staff account.</p>

        <label>
          <Mail size={13} /> Email
          <input
            type="email"
            autoComplete="username"
            {...register("email", { required: "Email is required" })}
            placeholder="you@toolhub.local"
          />
          {errors.email ? <em className="field-error">{errors.email.message}</em> : null}
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

        <button className="btn primary full" type="submit" disabled={login.isPending}>
          {login.isPending ? <Spinner size={14} /> : null} Sign in
        </button>
        <small className="login-note">Sessions expire automatically. Repeated failures are rate limited.</small>
      </form>
    </div>
  );
}
