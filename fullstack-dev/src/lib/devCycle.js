export const PHASES = ["requisitos", "diseño", "desarrollo", "qa", "producción"];

export function isValidPhase(phase) {
  return PHASES.includes(phase);
}

/**
 * Determina si pasar de currentPhase a nextPhase es válido: solo se puede
 * avanzar una fase a la vez, en orden, nunca saltar.
 */
export function isSequentialAdvance(currentPhase, nextPhase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const nextIndex = PHASES.indexOf(nextPhase);
  if (currentIndex === -1 || nextIndex === -1) return false;
  return nextIndex === currentIndex + 1;
}
