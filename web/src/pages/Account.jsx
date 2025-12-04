// Account.jsx
// shows manager account info

import { useEffect, useState } from "react";
import Loading from "../components/Loading";

export default function Account() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => setAccount(data));
  }, []);

  if (!account) return <Loading />;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <h1 className="text-2xl font-semibold">Account</h1>

      <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
        <p className="text-lg font-medium">{account.name}</p>
        <p className="opacity-70">{account.email}</p>
      </div>
    </div>
  );
}
