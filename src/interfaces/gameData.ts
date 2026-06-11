export interface IGameData {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface IGameDataJson {
  games: IGameData[];
}
