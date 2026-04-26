import type { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'stadt',  icon: '🏙', label: 'Stadt'        },
  { id: 'land',   icon: '🌍', label: 'Land'         },
  { id: 'fluss',  icon: '🌊', label: 'Fluss'        },
  { id: 'name',   icon: '👤', label: 'Name'         },
  { id: 'tier',   icon: '🐾', label: 'Tier'         },
  { id: 'beruf',  icon: '💼', label: 'Beruf'        },
  { id: 'film',   icon: '🎬', label: 'Film / Serie' },
  { id: 'auto',   icon: '🚗', label: 'Automarke'    },
  { id: 'rapper', icon: '🎤', label: 'Rapper'       },
  { id: 'game',   icon: '🎮', label: 'Videospiel'   },
];

export const LETTER_POOL = 'ABCDEFGHIKLMNOPRSTUVWZ';

export const DEFAULT_ROUND_TIME = 120;
export const DEFAULT_TOTAL_ROUNDS = 3;
export const MAX_PLAYERS = 10;
export const ROOM_CODE_LENGTH = 6;
export const ACCELERATED_TIMER_SECS = 15;

export const POINTS_UNIQUE = 10;
export const POINTS_SHARED = 5;
export const POINTS_EMPTY = 0;

export const PLAYER_EMOJIS = ['🦊', '🐼', '🦁', '🐯', '🦋', '🐙', '🦄', '🐸', '🦅', '🐬'];
