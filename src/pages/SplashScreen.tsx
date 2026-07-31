import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/Home", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <img
        src="/assets/hui-logo.png"
        alt="HUI Logo"
        className="w-40 h-40 animate-splash"
      />
    </div>
  );
}
