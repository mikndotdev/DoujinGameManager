import { type IGameData } from "../interfaces/gameData.ts";
import GameInfo from "../components/gameInfo.tsx";
import gameDataJson from "../games.json";

export default function Home() {
  const gameData: IGameData[] = gameDataJson;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 gap-4">
        {gameData.map((game) => (
          <GameInfo key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
