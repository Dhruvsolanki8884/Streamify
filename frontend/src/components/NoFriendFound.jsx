import { UsersIcon } from "lucide-react";

const NoFriendFound = () => {
  return (
    <div className="card bg-base-200/80 border border-base-300 p-8 sm:p-10 text-center rounded-2xl">
      <div className="max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
          <UsersIcon className="size-8 opacity-50" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No friends yet</h3>
        <p className="text-base-content/70 text-sm sm:text-base">
          Connect with language partners below to start practicing together!
        </p>
      </div>
    </div>
  );
};

export default NoFriendFound;
