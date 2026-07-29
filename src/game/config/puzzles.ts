// ── Puzzle Definitions ──────────────────────────────────────────────────────

export type PuzzleState = 'inactive' | 'active' | 'solved' | 'failed';

export interface PuzzleDef {
  id: string;
  name: string;
  roomId: string;
  description: string;
  type: 'power' | 'chemical' | 'valve' | 'symbol';
  clueDocument?: string; // doc id that gives the clue
  clueText: string;
  failMessage?: string;
  successMessage: string;
}

export interface PowerPuzzle extends PuzzleDef {
  type: 'power';
  requiredFuses: number;
  requiredBattery: boolean;
  fuseSlots: number;
}

export interface ChemicalPuzzle extends PuzzleDef {
  type: 'chemical';
  stabilizerRequired: boolean;
  valveCode: number; // 4-digit code
}

export interface ValvePuzzle extends PuzzleDef {
  type: 'valve';
  requiredValves: number;
  valvePositions: number; // number of wheels to turn
}

export interface SymbolPuzzle extends PuzzleDef {
  type: 'symbol';
  symbols: string[];
  correctOrder: number[];
  gridSize: number;
}

export type AnyPuzzle = PowerPuzzle | ChemicalPuzzle | ValvePuzzle | SymbolPuzzle;

// ── Puzzle Definitions ──────────────────────────────────────────────────────

export const PUZZLES: Record<string, AnyPuzzle> = {
  puzzle_power: {
    id: 'puzzle_power',
    name: 'Main Power Restoration',
    roomId: 'power',
    description: 'The main power distribution panel requires two fuses and a battery cell to restore facility power.',
    type: 'power',
    clueDocument: 'doc_power_instructions',
    clueText: 'Generator restart procedure notes: Insert two Maintenance Fuses into main bus panel, then insert Battery Cell into auxiliary power slot.',
    successMessage: 'The main panel hums to life. Lights flicker on across the facility. Power is restored.',
    failMessage: 'The panel sparks but nothing happens. You need the correct components.',
    requiredFuses: 2,
    requiredBattery: true,
    fuseSlots: 3,
  },

  puzzle_neutralize: {
    id: 'puzzle_neutralize',
    name: 'Chemical Decontamination',
    roomId: 'medlab',
    description: 'The door to the maintenance corridor is sealed by a chemical lock. You need to prepare the neutralization compound.',
    type: 'chemical',
    clueDocument: 'doc_lab_report',
    clueText: 'The analysis report mentions Chemical Stabilizer Compound B-7. It neutralizes the organic growth.',
    successMessage: 'The chemical lock disengages with a hiss. The door slides open.',
    failMessage: 'The mixture bubbles and discolors. This isn\'t right.',
    stabilizerRequired: true,
    valveCode: 7742, // Dr. Rook's ID
  },

  puzzle_valve: {
    id: 'puzzle_valve',
    name: 'Flooded Corridor Drain',
    roomId: 'corridor',
    description: 'The corridor is flooded. A set of four valve wheels along the wall control the drainage system.',
    type: 'valve',
    clueDocument: 'doc_intake_memo',
    clueText: 'The maintenance corridor flood control requires all four valves to be turned in sequence.',
    successMessage: 'The water begins to drain with a gurgling roar. The path ahead is clear.',
    failMessage: 'The valves lock. Wrong sequence.',
    requiredValves: 4,
    valvePositions: 4,
  },

  puzzle_symbol: {
    id: 'puzzle_symbol',
    name: 'Specimen Container Alignment',
    roomId: 'storage',
    description: 'A row of specimen containers can be rotated to align symbols. The correct sequence will unlock a hidden compartment.',
    type: 'symbol',
    clueText: 'The containers must be aligned to match the research sequence: Circle, Triangle, Wave, Diamond.',
    successMessage: 'The hidden compartment clicks open. Inside is a security badge.',
    symbols: ['●', '▲', '〰', '◆'],
    correctOrder: [0, 1, 2, 3],
    gridSize: 4,
  },
};

// ── Puzzle State Tracking ───────────────────────────────────────────────────

export interface PuzzleStateData {
  puzzleId: string;
  state: PuzzleState;
  data: Record<string, unknown>;
}
