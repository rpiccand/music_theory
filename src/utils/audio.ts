// Système audio pour la synthèse de notes et accords

class AudioSynthesizer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    this.initAudio();
  }

  private async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.3; // Volume plus élevé
    } catch (error) {
      console.warn('Audio context non disponible:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      await this.initAudio();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Convertit un pitch class en fréquence (A4 = 440Hz)
  private pcToFrequency(pc: number, octave: number = 4): number {
    // A4 = 440Hz, chaque demi-ton = 2^(1/12)
    const A4 = 440;
    const semitoneRatio = Math.pow(2, 1/12);

    // A = pitch class 9, donc décalage de -9 pour centrer sur A
    const semitonesFromA4 = (octave - 4) * 12 + (pc - 9);

    return A4 * Math.pow(semitoneRatio, semitonesFromA4);
  }

  // Crée un son doux et agréable, semblable à une flûte ou un orgue
  private createPianoNote(frequency: number, noteGain: GainNode, duration: number): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;

    // Harmoniques très simples et douces
    const harmonics = [
      { freq: frequency, gain: 1.0 },        // Fondamentale
      { freq: frequency * 2, gain: 0.2 },    // Octave très douce
      { freq: frequency * 3, gain: 0.1 },    // Quinte très subtile
    ];

    harmonics.forEach(({ freq, gain }) => {
      const oscillator = this.audioContext!.createOscillator();
      const harmonicGain = this.audioContext!.createGain();

      // Utiliser sine pour le son le plus doux possible
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, currentTime);

      // Envelope très douce avec attack lent
      harmonicGain.gain.setValueAtTime(0, currentTime);
      harmonicGain.gain.linearRampToValueAtTime(gain * 0.3, currentTime + 0.05); // Attack lent et doux
      harmonicGain.gain.linearRampToValueAtTime(gain * 0.2, currentTime + 0.1);  // Plateau doux
      harmonicGain.gain.linearRampToValueAtTime(gain * 0.15, currentTime + duration * 0.7); // Sustain long
      harmonicGain.gain.linearRampToValueAtTime(0, currentTime + duration); // Release très doux

      oscillator.connect(harmonicGain);
      harmonicGain.connect(noteGain);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
    });
  }

  // Joue une note unique
  async playNote(pc: number, duration: number = 0.5, octave: number = 4): Promise<void> {
    await this.ensureAudioContext();

    if (!this.audioContext || !this.gainNode) return;

    const noteGain = this.audioContext.createGain();
    noteGain.connect(this.gainNode);

    this.createPianoNote(
      this.pcToFrequency(pc, octave),
      noteGain,
      duration
    );
  }

  // Joue un accord (plusieurs notes simultanément)
  async playChord(pcs: number[], duration: number = 1, octave: number = 3): Promise<void> {
    await this.ensureAudioContext();

    if (!this.audioContext || !this.gainNode) return;

    pcs.forEach((pc, index) => {
      const noteGain = this.audioContext!.createGain();
      noteGain.gain.value = 0.4; // Volume adapté pour accord
      noteGain.connect(this.gainNode!);

      // Étalement sur 2 octaves pour un accord plus harmonieux
      const noteOctave = octave + Math.floor(index / 3);

      this.createPianoNote(
        this.pcToFrequency(pc, noteOctave),
        noteGain,
        duration
      );
    });
  }

  // Joue un accord avec octaves spécifiques pour chaque note
  async playChordWithOctaves(pcs: number[], octaves: number[], duration: number = 1): Promise<void> {
    await this.ensureAudioContext();

    if (!this.audioContext || !this.gainNode) return;

    pcs.forEach((pc, index) => {
      const noteGain = this.audioContext!.createGain();
      noteGain.gain.value = 0.4; // Volume adapté pour accord
      noteGain.connect(this.gainNode!);

      this.createPianoNote(
        this.pcToFrequency(pc, octaves[index]),
        noteGain,
        duration
      );
    });
  }

  // Joue une séquence de notes (mélodie)
  async playSequence(pcs: number[], noteDuration: number = 0.3, octave: number = 4): Promise<void> {
    for (let i = 0; i < pcs.length; i++) {
      await this.playNote(pcs[i], noteDuration, octave);

      // Petite pause entre les notes
      if (i < pcs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, noteDuration * 800));
      }
    }
  }

  // Joue une séquence de notes avec octaves spécifiques pour chaque note
  async playSequenceWithOctaves(pcs: number[], octaves: number[], noteDuration: number = 0.3): Promise<void> {
    for (let i = 0; i < pcs.length; i++) {
      await this.playNote(pcs[i], noteDuration, octaves[i]);

      // Petite pause entre les notes
      if (i < pcs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, noteDuration * 800));
      }
    }
  }

  // Arrête tous les sons
  stop(): void {
    if (this.audioContext) {
      // Créer un nouveau contexte pour arrêter tous les sons
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
      this.initAudio();
    }
  }

  // Arrête tous les sons en cours sans recréer le contexte
  stopAllSounds(): void {
    if (this.audioContext) {
      try {
        // Fermer le contexte audio actuel pour arrêter tous les sons
        this.audioContext.close();
        this.audioContext = null;
        this.gainNode = null;

        // Recréer immédiatement un nouveau contexte
        this.initAudio();
      } catch (error) {
        console.warn('Erreur lors de l\'arrêt des sons:', error);
      }
    }
  }
}

// Instance singleton
export const audioSynth = new AudioSynthesizer();

// Types pour l'utilisation
export interface PlaybackOptions {
  duration?: number;
  octave?: number;
}

export type PlaybackMode = 'note' | 'chord' | 'sequence';