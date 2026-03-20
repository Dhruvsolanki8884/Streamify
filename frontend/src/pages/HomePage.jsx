import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  sendFriendRequest,
  getFriendRequests,
} from "../lib/api";
import { Link } from "react-router";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  MessageCircleIcon,
  SparklesIcon,
} from "lucide-react";

import { capitalize } from "../lib/utils";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendFound from "../components/NoFriendFound";
import Avatar from "../components/Avatar";
import useAuthUser from "../hooks/useAuthUser";

const HomePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const incomingCount = friendRequests?.incomingReqs?.length || 0;

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--p),0.08)_0%,transparent_50%)]" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {authUser?.fullName?.split(" ")[0] || "there"}
                </span>
              </h1>
              <p className="mt-2 text-base sm:text-lg opacity-70">
                Connect with language partners and practice together
              </p>
            </div>
            <Link
              to="/notifications"
              className="btn btn-primary gap-2 shrink-0 shadow-lg shadow-primary/25"
            >
              <UsersIcon className="size-5" />
              Friend Requests
              {incomingCount > 0 && (
                <span className="badge badge-sm badge-error">{incomingCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-10 sm:space-y-12">
        {/* Friends Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <MessageCircleIcon className="size-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold">Your Friends</h2>
            {friends.length > 0 && (
              <span className="badge badge-ghost">{friends.length}</span>
            )}
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <NoFriendFound />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {friends.map((friend) => (
                <FriendCard key={friend._id} friend={friend} />
              ))}
            </div>
          )}
        </section>

        {/* Discover Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <SparklesIcon className="size-5 text-secondary" />
                <h2 className="text-xl sm:text-2xl font-bold">
                  Meet New Learners
                </h2>
              </div>
              <p className="text-sm sm:text-base opacity-70">
                Discover language exchange partners based on your profile
              </p>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg text-secondary" />
            </div>
          ) : recommendedUsers.length === 0 ? (
            <div className="card bg-base-200/80 border border-base-300 p-8 sm:p-12 text-center rounded-2xl">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="size-8 opacity-50" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  No recommendations yet
                </h3>
                <p className="text-base-content/70">
                  Complete your profile and check back later for new language
                  partners!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {recommendedUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="group card bg-base-200/80 hover:bg-base-200 border border-base-300/50 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
                  >
                    <div className="card-body p-4 sm:p-5 space-y-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar
                          src={user.profilePic}
                          alt={user.fullName}
                          size="lg"
                          className="ring-2 ring-base-300 group-hover:ring-primary/30 transition-all"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg truncate">
                            {user.fullName}
                          </h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3.5 mr-1 shrink-0" />
                              <span className="truncate">{user.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary text-xs">
                          {getLanguageFlag(user.nativeLanguage)}
                          {capitalize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline text-xs">
                          {getLanguageFlag(user.learningLanguage)}
                          {capitalize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && (
                        <p className="text-sm opacity-80 line-clamp-2">
                          {user.bio}
                        </p>
                      )}

                      <button
                        className={`btn w-full mt-auto ${
                          hasRequestBeenSent
                            ? "btn-ghost btn-disabled"
                            : "btn-primary"
                        }`}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Add Friend
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
