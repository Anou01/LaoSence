import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "admin") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "admin");
      navigate("/admin/dashboard");
    } else {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "user");
      navigate("/");
    }
  };

  return (
    <div className="p-4">
      <h2>Login Page</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2"
      />
      <button onClick={handleLogin} className="ml-2 px-4 py-2 bg-blue-500 text-white">
        Login
      </button>
    </div>
  );
}
