import React, { useState } from 'react';
import { audioSynth } from '../utils/audio';
import type { ViewMode } from '../types';
import { MODE_STEPS, type ModeName } from '../theory/modes';
import { RANK_TO_LETTER, accidentalForLetterInKey, staffPosFromLetterOct } from '../utils/music';

// État global pour empêcher les clics multiples et gérer l'arrêt
let isPlaying = false;
let lastClickedMeasure: string | null = null;

// Convertit letter rank + accidental en pitch class
function letterAndAccidentalToPc(letterRank: number, accidental: 'sharp' | 'flat' | null): number {
  const basePcs = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
  let pc = basePcs[letterRank % 7];

  if (accidental === 'sharp') pc = (pc + 1) % 12;
  else if (accidental === 'flat') pc = (pc - 1 + 12) % 12;

  return pc;
}

interface MeasureClickHandlerProps {
  // Position et taille de la zone cliquable
  x: number;
  y: number;
  width: number;
  height: number;

  // Données musicales
  degree: number;
  currentKeyPc: number;
  tonicLetterRank: number;
  tonicStartOct: number;
  view: ViewMode;

  // Comportement spécial
  isSecondStaff?: boolean; // Si true, joue les notes de la deuxième portée

  // Styles visuels
  className?: string;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export default function MeasureClickHandler({
  x,
  y,
  width,
  height,
  degree,
  currentKeyPc,
  tonicLetterRank,
  tonicStartOct,
  view,
  isSecondStaff = false,
  className = '',
  onPlayStart,
  onPlayEnd
}: MeasureClickHandlerProps) {

  // Calculer les pitch classes et octaves selon la vue (exactement comme affiché visuellement)
  const getPitchClassesAndOctaves = (): { pcs: number[]; octaves: number[] } => {
    switch (view) {
      case 0: // Vue diatonique - une seule note
        const absIndex = tonicLetterRank + degree;
        const letterRank = absIndex % 7;
        const oct = tonicStartOct + Math.floor(absIndex / 7);
        const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
        const acc = accidentalForLetterInKey(letter, currentKeyPc);
        const pc = letterAndAccidentalToPc(letterRank, acc);
        return { pcs: [pc], octaves: [oct] };

      case 1: // Vue tétrade - accord de 7e (exactement comme affiché)
        // Calculer chordOctAdj exactement comme dans la logique visuelle
        const chordAbsIndices = [0, 2, 4, 6].map(offset => tonicLetterRank + degree + offset);
        const chordStaffPosMax = Math.max(
          ...chordAbsIndices.map(ai => {
            const lr = ai % 7;
            const oc = tonicStartOct + Math.floor(ai / 7);
            return staffPosFromLetterOct(lr, oc);
          })
        );
        const chordOctAdj = chordStaffPosMax > 10 ? -1 : 0;

        const chordData = [0, 2, 4, 6].map(offset => {
          const absIndex = tonicLetterRank + degree + offset;
          const letterRank = absIndex % 7;
          const oct = tonicStartOct + Math.floor(absIndex / 7) + chordOctAdj;
          const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
          const acc = accidentalForLetterInKey(letter, currentKeyPc);
          const pc = letterAndAccidentalToPc(letterRank, acc);
          return { pc, oct };
        });
        return {
          pcs: chordData.map(d => d.pc),
          octaves: chordData.map(d => d.oct)
        };

      case 2: // Vue modes - séquence de gamme (7 notes + octave)
        if (isSecondStaff) {
          // Pour la deuxième portée, jouer les notes du mode correspondant au degré
          const modeSteps = getModeSteps(degree);
          const modeData: { pc: number; oct: number }[] = [];

          let currentOctave = tonicStartOct;
          let lastPc = -1;

          modeSteps.forEach((step, idx) => {
            // Calculer le pitch class de cette note dans le mode
            const pc = (currentKeyPc + step) % 12;

            // S'assurer que la séquence monte (pas de saut d'octave vers le bas)
            if (idx > 0 && pc <= lastPc) {
              currentOctave++;
            }

            modeData.push({ pc, oct: currentOctave });
            lastPc = pc;
          });

          // Ajouter la 8e note (octave de la première)
          const firstNote = modeData[0];
          // S'assurer qu'elle est plus haute que la dernière note
          const lastNote = modeData[modeData.length - 1];
          const eighthOctave = firstNote.pc <= lastNote.pc ? lastNote.oct + 1 : lastNote.oct;
          modeData.push({ pc: firstNote.pc, oct: eighthOctave });

          return {
            pcs: modeData.map(d => d.pc),
            octaves: modeData.map(d => d.oct)
          };
        } else {
          // Pour la première portée, jouer la gamme majeure normale à partir du degré
          // (pas le mode, mais la gamme diatonique normale)

          // Calculer modeOctAdj exactement comme dans la logique visuelle
          const modeAbsIndices = Array.from({ length: 8 }, (_, st) => tonicLetterRank + degree + st);
          const modeStaffPosMax = Math.max(
            ...modeAbsIndices.map(ai => {
              const lr = ai % 7;
              const oc = tonicStartOct + Math.floor(ai / 7);
              return staffPosFromLetterOct(lr, oc);
            })
          );
          const modeOctAdj = modeStaffPosMax > 10 ? -1 : 0;

          const modeData: { pc: number; oct: number }[] = [];
          const baseNotes = [0, 2, 4, 5, 7, 9, 11]; // Gamme majeure

          // Commencer avec l'octave de base
          let currentOctave = tonicStartOct + modeOctAdj;
          let lastPc = -1;

          for (let step = 0; step < 7; step++) {
            // Calculer le pitch class en utilisant la gamme majeure normale
            const noteIndex = (degree + step) % 7;
            const pc = (currentKeyPc + baseNotes[noteIndex]) % 12;

            // S'assurer que la séquence est diatonique ascendante
            if (step > 0) {
              // Si le pitch class actuel est plus bas que le précédent, monter d'une octave
              if (pc < lastPc) {
                currentOctave++;
              }
            }

            modeData.push({ pc, oct: currentOctave });
            lastPc = pc;
          }

          // Ajouter la 8e note (octave de la première)
          const firstNote = modeData[0];
          modeData.push({ pc: firstNote.pc, oct: firstNote.oct + 1 });

          return {
            pcs: modeData.map(d => d.pc),
            octaves: modeData.map(d => d.oct)
          };
        }

      default:
        return { pcs: [], octaves: [] };
    }
  };

  // Récupère les steps d'un mode
  const getModeSteps = (degree: number): number[] => {
    const modeNames: ModeName[] = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
    const modeName = modeNames[degree] || 'ionian';
    return MODE_STEPS[modeName];
  };

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Créer un identifiant unique pour cette mesure
    const measureId = `${view}-${degree}-${isSecondStaff ? 'second' : 'first'}`;

    // Si on clique sur la même mesure pendant la lecture, arrêter
    if (isPlaying && lastClickedMeasure === measureId) {
      audioSynth.stopAllSounds();
      isPlaying = false;
      lastClickedMeasure = null;
      onPlayEnd?.();
      return;
    }

    // Empêcher les clics multiples pendant la lecture (sauf pour arrêter)
    if (isPlaying) return;

    try {
      isPlaying = true;
      lastClickedMeasure = measureId;
      onPlayStart?.();

      const { pcs, octaves } = getPitchClassesAndOctaves();

      if (pcs.length === 0) return;

      switch (view) {
        case 0: // Note unique
          await audioSynth.playNote(pcs[0], 0.8, octaves[0]);
          break;

        case 1: // Accord
          await audioSynth.playChordWithOctaves(pcs, octaves, 1.5);
          break;

        case 2: // Séquence mélodique
          await audioSynth.playSequenceWithOctaves(pcs, octaves, 0.4);
          break;
      }

    } catch (error) {
      console.warn('Erreur lors de la lecture audio:', error);
    } finally {
      isPlaying = false;
      lastClickedMeasure = null;
      onPlayEnd?.();
    }
  };

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="transparent"
      stroke="none"
      className={`cursor-pointer hover:fill-blue-100 hover:fill-opacity-20 ${className}`}
      onClick={handleClick}
      style={{
        transition: 'fill-opacity 0.2s ease'
      }}
    />
  );
}