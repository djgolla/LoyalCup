import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Profile
      </h1>
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
          <p className="text-gray-900 dark:text-white">{user?.full_name}</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <p className="text-gray-900 dark:text-white">{user?.email}</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role
          </label>
          <p className="text-gray-900 dark:text-white">{user?.role}</p>
        </div>
        <a
          href="/profile/edit"
          className="inline-block px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
        >
          Edit Profile
        </a>
      </div>
    </div>
  );
}
