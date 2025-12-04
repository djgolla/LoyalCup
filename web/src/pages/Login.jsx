// Login.jsx

import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    nav("/");
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-[#121212]">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-neutral-900 p-8 rounded-xl shadow-soft w-full max-w-sm border border-gray-200 dark:border-neutral-800 animate-slideUp"
      >
        <h1 className="text-xl font-semibold mb-6">Login</h1>

        <input
          type="text"
          placeholder="Email"
          className="w-full mb-4 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded-lg outline-none"
        />

        <button className="w-full bg-coffee text-white py-2 rounded-lg">
          Login
        </button>
      </form>
    </div>
  );
}
