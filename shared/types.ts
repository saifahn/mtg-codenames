interface NoGameState {
  game: null
}

export type Team = 'uw' | 'rb'

export type CardIdentity = Team | 'assassin' | 'neutral'

export interface BoardSpace {
  word: string
  identity: CardIdentity
  flipped: boolean
}

export type DetailedAction = 'assassinChosen' | 'allOperativesFound' | null

export interface GameBaseState {
  board: BoardSpace[][]
  goesFirst: Team
  currentTurn: Team
  status: 'ready' | 'inProgress' | 'finished'
  clue: {
    word: string
    number: number | null
  }
  cardsRemaining: {
    [key in Team]: number
  }
  lastAction?: DetailedAction
  // add logged in users and users by team
}

export type GameState = NoGameState | { game: GameBaseState }
