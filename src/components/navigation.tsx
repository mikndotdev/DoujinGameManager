import { useLocation, useNavigate } from "react-router";
import { HomeIcon, SaveIcon } from "lucide-react";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  return (
    <>
      <div className="dock md:hidden">
        <button className={pathname === "/" ? "dock-active" : ""} onClick={() => navigate("/")}>
          <HomeIcon />
          <span className="dock-label">ホーム</span>
        </button>
        <button
          className={pathname.startsWith("/manage-data") ? "dock-active" : ""}
          onClick={() => navigate("/manage-data")}
        >
          <SaveIcon />
          <span className="dock-label">データ管理</span>
        </button>
      </div>
    </>
  );
}
