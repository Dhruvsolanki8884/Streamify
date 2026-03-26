import { ShipWheelIcon, EyeIcon, EyeOffIcon, XIcon, KeyRoundIcon } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import useLogin from "../hooks/useLogin";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

/* ── Forgot Password Modal ── */
const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState("email"); // "email" | "reset"
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axiosInstance.post("/auth/check-email", { email });
      setStep("reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Email not found");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      await axiosInstance.post("/auth/reset-password", { email, newPassword });
      toast.success("Password reset successfully! Please sign in.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(24, 23, 23, 0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm bg-base-100 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-300">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-primary" />
            <h3 className="font-semibold text-base">
              {step === "email" ? "Forgot Password" : "Reset Password"}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="p-5">
          {step === "email" ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <p className="text-sm opacity-70">
                Enter your registered email address and we'll let you set a new password.
              </p>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-xs" /> : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm opacity-70">
                Create a new password for <span className="font-medium text-primary">{email}</span>
              </p>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className="input input-bordered w-full pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors">
                    {showNew ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text">Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    className="input input-bordered w-full pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors">
                    {showConfirm ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-xs" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Login Page ── */
const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8" data-theme="forest">
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        {/* ── Form ── */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          <div className="mb-4 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wide">
              Streamify
            </span>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response?.data?.message || error.message || "Something went wrong"}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Welcome Back</h2>
                <p className="text-sm opacity-70">Sign in to continue your language journey</p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Email */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="input input-bordered w-full"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Password</span>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="label-text-alt text-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="input input-bordered w-full pr-10"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                    >
                      {showPassword ?  <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
                  {isPending ? (
                    <><span className="loading loading-spinner loading-xs" /> Login...</>
                  ) : "Login"}
                </button>

                <div className="text-center mt-2">
                  <p className="text-sm">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary hover:underline">Create one</Link>
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* ── Illustration ── */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            <div className="relative aspect-square max-w-sm mx-auto">
              <img src="/Video call-bro.png" alt="Language connection" className="w-full h-full" />
            </div>
            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">Connect with Language Partners Worldwide</h2>
              <p className="opacity-70">Practice conversations, share your culture, and make friends while learning a new language!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
