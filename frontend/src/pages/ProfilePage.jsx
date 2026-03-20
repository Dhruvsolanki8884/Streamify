import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../lib/api";
import Avatar from "../components/Avatar";
import {
  ShuffleIcon,
  LoaderIcon,
  SaveIcon,
  LogOutIcon,
  PencilIcon,
  XIcon,
  MapPinIcon,
} from "lucide-react";
import useLogout from "../hooks/useLogout";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const { logoutMutation } = useLogout();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", bio: "", profilePic: "" });

  useEffect(() => {
    if (authUser)
      setForm({
        fullName: authUser.fullName || "",
        bio: authUser.bio || "",
        profilePic: authUser.profilePic || "",
      });
  }, [authUser]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile saved!");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setEditing(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const shuffle = () => {
    setForm((f) => ({
      ...f,
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(f.fullName || Math.random())}`,
    }));
    toast.success("New avatar!");
  };

  const cancel = () => {
    setForm({
      fullName: authUser.fullName || "",
      bio: authUser.bio || "",
      profilePic: authUser.profilePic || "",
    });
    setEditing(false);
  };
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);
  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-base-100 rounded-3xl shadow-2xl overflow-hidden">
          {/* ── Banner ── */}
          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-primary via-secondary to-accent">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1.5px, transparent 1.5px)",
                backgroundSize: "28px 28px",
              }}
            />

            {/* Logout — top right */}
            <button
              onClick={logoutMutation}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/25 hover:bg-error/80 text-white text-xs font-semibold backdrop-blur-sm transition-all duration-200 group"
            >
              <LogOutIcon className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>

          {/* ── Avatar — overlapping banner ── */}
          <div className="flex flex-col items-center -mt-14 px-6 pb-6">
            <div className="relative mb-4">
              <div className="ring-4 ring-base-100 rounded-full shadow-xl">
                <Avatar src={form.profilePic} alt={form.fullName} size="2xl" />
              </div>
              {editing && (
                <button
                  onClick={shuffle}
                  title="New avatar"
                  className="absolute -bottom-1 -right-1 size-8 rounded-full bg-accent text-accent-content shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-150"
                >
                  <ShuffleIcon className="size-4" />
                </button>
              )}
              {/* Online dot */}
              {!editing && (
                <span className="absolute bottom-1 right-1 size-4 rounded-full bg-success ring-2 ring-base-100 animate-pulse" />
              )}
            </div>

            {/* ── VIEW MODE ── */}
            {!editing && (
              <div className="w-full text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {authUser.fullName}
                </h1>

                {authUser.location && (
                  <p className="text-sm text-base-content/50 flex items-center justify-center gap-1">
                    <MapPinIcon className="size-3.5" />
                    {authUser.location}
                  </p>
                )}

                {authUser.bio && (
                  <p className="text-sm sm:text-base text-base-content/70 leading-relaxed max-w-xs mx-auto">
                    {authUser.bio}
                  </p>
                )}

                {/* Language badges */}
                {(authUser.nativeLanguage || authUser.learningLanguage) && (
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {authUser.nativeLanguage && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        🗣 {cap(authUser.nativeLanguage)}
                      </span>
                    )}
                    {authUser.learningLanguage && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                        📖 {cap(authUser.learningLanguage)}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex justify-center gap-8 pt-3 pb-1">
                  {[
                    ["Friends", "—"],
                    ["Chats", "—"],
                    ["Status", "Active"],
                  ].map(([label, val]) => (
                    <div key={label} className="text-center">
                      <p className="text-base font-bold">{val}</p>
                      <p className="text-[11px] text-base-content/40 uppercase tracking-wide">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Edit button — bottom center */}
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-primary btn-sm rounded-xl gap-2 px-6 mt-2"
                >
                  <PencilIcon className="size-4" />
                  Edit Profile
                </button>
              </div>
            )}

            {/* ── EDIT MODE ── */}
            {editing && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  mutate(form);
                }}
                className="w-full space-y-4 mt-1"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    required
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    className="input input-bordered w-full focus:input-primary transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-base-content/40">
                    Bio
                  </label>
                  <textarea
                    value={form.bio}
                    rows={3}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bio: e.target.value }))
                    }
                    className="textarea textarea-bordered w-full resize-none focus:textarea-primary transition-all"
                    placeholder="Write something about yourself…"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary flex-1 gap-2"
                  >
                    {isPending ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : (
                      <>
                        <SaveIcon className="size-4" />
                        Save Profile
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancel}
                    className="btn btn-ghost flex-1 border border-base-300 gap-2"
                  >
                    <XIcon className="size-4" />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
