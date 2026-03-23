import { useEffect, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CameraIcon, LoaderIcon, MapPinIcon,
  ShipWheelIcon, ShuffleIcon, UserIcon,
  BookOpenIcon, GlobeIcon,
} from "lucide-react";
import { completeOnboarding } from "../lib/api";
import { LANGUAGES } from "../constants";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: "",
    bio: "",
    nativeLanguage: "",
    learningLanguage: "",
    location: "",
    profilePic: "",
  });

  useEffect(() => {
    if (authUser) {
      setFormState({
        fullName: authUser.fullName || "",
        bio: authUser.bio || "",
        nativeLanguage: authUser.nativeLanguage || "",
        learningLanguage: authUser.learningLanguage || "",
        location: authUser.location || "",
        profilePic: authUser.profilePic || "",
      });
    }
  }, [authUser]);

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  const handleRandomAvatar = () => {
    const seed = formState.fullName?.trim() || Math.random().toString(36).slice(2);
    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setFormState(prev => ({ ...prev, profilePic: url }));
    toast.success("Avatar generated!");
  };

  const set = (key) => (e) => setFormState(prev => ({ ...prev, [key]: e.target.value }));

  return (
    /* Full-page scroll container — works even when #root is overflow:hidden */
    <div
      className="fixed inset-0 overflow-y-auto bg-base-100"
      style={{ zIndex: 10 }}
    >
      <div className="min-h-full flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-2xl">

          {/* ── Header ── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-4">
              <ShipWheelIcon className="size-7 text-primary-content" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
            <p className="mt-2 text-base-content/60 text-sm">
              Set up your profile to start connecting with language partners
            </p>
          </div>

          {/* ── Card ── */}
          <div className="card bg-base-200 border border-base-300 shadow-xl rounded-3xl overflow-hidden">
            <div className="card-body p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Avatar ── */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-base-300 overflow-hidden ring-4 ring-base-100 shadow-lg">
                      {formState.profilePic ? (
                        <img
                          src={formState.profilePic}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CameraIcon className="size-10 text-base-content/30" />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="btn btn-outline btn-sm gap-2"
                  >
                    <ShuffleIcon className="size-4" />
                    Generate Avatar
                  </button>
                </div>

                {/* ── Full Name ── */}
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <UserIcon className="size-4 opacity-60" /> Full Name
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="input input-bordered w-full"
                    value={formState.fullName}
                    onChange={set("fullName")}
                    required
                  />
                </div>

                {/* ── Bio ── */}
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <BookOpenIcon className="size-4 opacity-60" /> Bio
                    </span>
                  </label>
                  <textarea
                    value={formState.bio}
                    onChange={set("bio")}
                    className="textarea textarea-bordered w-full h-24 resize-none"
                    placeholder="Tell others about yourself and your language learning goals..."
                  />
                </div>

                {/* ── Languages ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-medium flex items-center gap-1.5">
                        <GlobeIcon className="size-4 opacity-60" /> Native Language
                      </span>
                    </label>
                    <select
                      value={formState.nativeLanguage}
                      onChange={set("nativeLanguage")}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select native language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`native-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1">
                      <span className="label-text font-medium flex items-center gap-1.5">
                        <GlobeIcon className="size-4 opacity-60" /> Learning Language
                      </span>
                    </label>
                    <select
                      value={formState.learningLanguage}
                      onChange={set("learningLanguage")}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select learning language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Location ── */}
                <div className="form-control">
                  <label className="label pb-1">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <MapPinIcon className="size-4 opacity-60" /> Location
                    </span>
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50 pointer-events-none" />
                    <input
                      type="text"
                      value={formState.location}
                      onChange={set("location")}
                      className="input input-bordered w-full pl-9"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                {/* ── Submit ── */}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <LoaderIcon className="animate-spin size-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ShipWheelIcon className="size-5" />
                      Complete Onboarding
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* bottom padding so content isn't flush against edge on short screens */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
