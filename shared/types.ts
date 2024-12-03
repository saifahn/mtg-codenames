interface NoGameState {
  game: null
}

export type Team = 'uw' | 'rb'

type CardIdentity = Team | 'assassin' | 'neutral'

export interface BoardSpace {
  word: string
  identity: CardIdentity
  flipped: boolean
}

export interface GameBaseState {
  board: BoardSpace[][]
  goesFirst: Team
  currentTurn: Team
  status: 'ready' | 'inProgress' | 'finished'
  // add logged in users and users by team
}

export type GameState = NoGameState | { game: GameBaseState }
