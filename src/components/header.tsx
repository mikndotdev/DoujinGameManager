import { Link } from "react-router";

export default function Header() {
  return (
    <div className={"sticky top-0 bg-gray-100 py-5 mb-5 shadow-md z-50"}>
      <div className={"flex flex-row justify-center md:justify-between md:px-5"}>
        <div className="flex flex-row items-center justify-center">
          <h1 className="text-2xl font-bold">Doujin Game Manager</h1>
        </div>
        <div className="flex flex-row items-center justify-center space-x-2 hidden md:block">
          <Link to={"/"}>
            <button className={"btn btn-primary"}>ホーム</button>
          </Link>
          <Link to={"/manage-data"}>
            <button className={"btn btn-secondary"}>データ管理</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
