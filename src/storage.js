const STORAGE_KEY = 'gamemap_state_v2'

export const defaultState = {
  active_game: 'game_01',
  active_map: 'map_001',
  games: {
    game_01: {
      title: 'RPG Adventure',
      maps: [
        { id: 'map_001', name: '始まりの洞窟', image_data: null, canvas_data: null, annotations: [] },
        { id: 'map_002', name: '草原の町',     image_data: null, canvas_data: null, annotations: [] },
      ],
    },
    game_02: {
      title: 'Action Quest',
      maps: [
        { id: 'map_003', name: 'ステージ 1', image_data: null, canvas_data: null, annotations: [] },
      ],
    },
  },
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultState))
  } catch {
    return JSON.parse(JSON.stringify(defaultState))
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getActiveGame(state) {
  return state.games[state.active_game] ?? null
}

export function getActiveMap(state) {
  const game = getActiveGame(state)
  return game?.maps.find(m => m.id === state.active_map) ?? null
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
