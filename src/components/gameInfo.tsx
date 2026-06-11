import { type IGameData } from "../interfaces/gameData.ts";

interface GameInfoProps {
  game: IGameData;
}

export default function GameInfo({ game }: GameInfoProps) {
  return (
    <>
      <a href={`/games/${game.id}`}>
        <div className="card bg-base-200 shadow-md w-full hover:shadow-lg transition-shadow duration-300">
          <div className="card-body flex flex-col sm:flex-row justify-between items-center gap-4 p-4 sm:p-6">
            <div className="w-full sm:w-auto sm:pr-10">
              <img src={game.image} alt="game" className="size-36 w-full object-cover" />
            </div>
            <div className="text-center sm:text-right w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl font-bold">{game.name}</h2>
              <p className="text-sm sm:text-base">{game.description}</p>
            </div>
          </div>
        </div>
      </a>
    </>
  );
}
