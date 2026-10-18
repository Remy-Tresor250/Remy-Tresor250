// Generative ambient score. Everything is synthesised in the browser, so there is no
// audio file to download and the music can breathe with the scroll.

type Voice = { oscs: OscillatorNode[]; gain: GainNode }

const CHORDS: number[][] = [
  [50, 57, 62, 66, 69, 76], // Dmaj9
  [47, 54, 59, 62, 66, 73], // Bm11
  [43, 50, 55, 59, 62, 69], // Gmaj9
  [45, 52, 57, 61, 64, 71], // A6/9
  [42, 49, 54, 57, 61, 68], // F#m9
  [43, 50, 55, 59, 66, 74], // Gmaj7#11
]
const SPARKLE = [74, 76, 78, 81, 83, 86, 88, 90, 93]

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

class AmbientEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private music!: GainNode
  private sfx!: GainNode
  private padFilter!: BiquadFilterNode
  private reverb!: ConvolverNode
  private delay!: DelayNode
  private voices: Voice[] = []
  private chordIndex = 0
  private chordTimer = 0
  private sparkleTimer = 0
  private energy = 0
  private enabled = false
  private started = false

  get isRunning() {
    return this.started && this.enabled
  }

  /** Must be called from a user gesture. */
  start() {
    if (this.started) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    this.ctx = ctx
    this.started = true

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    comp.connect(ctx.destination)

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(comp)

    this.reverb = ctx.createConvolver()
    this.reverb.buffer = this.impulse(5.5, 2.6)
    const wet = ctx.createGain()
    wet.gain.value = 0.85
    this.reverb.connect(wet).connect(this.master)

    this.music = ctx.createGain()
    this.music.gain.value = 0.42
    this.music.connect(this.master)
    this.music.connect(this.reverb)

    this.padFilter = ctx.createBiquadFilter()
    this.padFilter.type = 'lowpass'
    this.padFilter.frequency.value = 700
    this.padFilter.Q.value = 0.6
    this.padFilter.connect(this.music)

    this.delay = ctx.createDelay(2)
    this.delay.delayTime.value = 0.56
    const fb = ctx.createGain()
    fb.gain.value = 0.38
    const dtone = ctx.createBiquadFilter()
    dtone.type = 'lowpass'
    dtone.frequency.value = 2600
    this.delay.connect(dtone).connect(fb).connect(this.delay)
    dtone.connect(this.music)

    this.sfx = ctx.createGain()
    this.sfx.gain.value = 0.5
    this.sfx.connect(this.master)
    this.sfx.connect(this.reverb)

    this.air()
    this.playChord(0)
    this.loop()

    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return
      if (document.hidden) this.ctx.suspend()
      else if (this.enabled) this.ctx.resume()
    })
  }

  setEnabled(on: boolean) {
    if (on && !this.started) this.start()
    this.enabled = on
    const ctx = this.ctx
    if (!ctx) return
    if (on && ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(on ? 0.75 : 0, t + (on ? 2.8 : 0.8))
  }

  /** 0..1 — how much the visitor is moving. Opens the filter and invites sparkles. */
  setEnergy(v: number) {
    this.energy += (Math.min(1, Math.max(0, v)) - this.energy) * 0.08
    if (!this.ctx || !this.enabled) return
    const t = this.ctx.currentTime
    this.padFilter.frequency.setTargetAtTime(620 + this.energy * 2600, t, 0.25)
    this.music.gain.setTargetAtTime(0.34 + this.energy * 0.38, t, 0.4)
  }

  /** Move the harmony with the story's chapter. */
  setChapter(i: number) {
    const next = ((i % CHORDS.length) + CHORDS.length) % CHORDS.length
    if (next === this.chordIndex || !this.ctx) return
    this.playChord(next)
  }

  tick() {
    if (!this.ctx || !this.enabled) return
    this.blip(SPARKLE[(Math.random() * SPARKLE.length) | 0] + 12, 0.035, 0.35, 'sine')
  }

  chime() {
    if (!this.ctx || !this.enabled) return
    const base = CHORDS[this.chordIndex]
    ;[0, 2, 4].forEach((k, i) => setTimeout(() => this.blip(base[k] + 24, 0.07, 2.4, 'triangle'), i * 90))
  }

  private loop() {
    const step = () => {
      if (this.ctx && this.enabled) {
        const now = performance.now()
        if (now > this.chordTimer) this.playChord((this.chordIndex + 1) % CHORDS.length)
        const rate = 4200 - this.energy * 3400
        if (now > this.sparkleTimer) {
          this.sparkleTimer = now + rate * (0.6 + Math.random() * 0.8)
          const chord = CHORDS[this.chordIndex]
          const pool = SPARKLE.filter((n) => chord.some((c) => (n - c) % 12 === 0)).concat(chord.slice(3).map((n) => n + 12))
          this.blip(pool[(Math.random() * pool.length) | 0], 0.05 + this.energy * 0.04, 3.2, 'sine')
        }
      }
      window.setTimeout(step, 120)
    }
    step()
  }

  private playChord(index: number) {
    const ctx = this.ctx!
    const t = ctx.currentTime
    this.chordIndex = index
    this.chordTimer = performance.now() + 11000
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(t)
      v.gain.gain.setValueAtTime(v.gain.gain.value, t)
      v.gain.gain.linearRampToValueAtTime(0, t + 6)
      v.oscs.forEach((o) => o.stop(t + 6.2))
    }
    this.voices = []
    CHORDS[index].forEach((note, i) => {
      const gain = ctx.createGain()
      gain.gain.value = 0
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.07 : 0.045, t + 4.5)
      gain.connect(this.padFilter)
      const oscs: OscillatorNode[] = []
      const types: OscillatorType[] = i === 0 ? ['sine', 'triangle'] : ['sawtooth', 'triangle']
      ;[-7, 7].forEach((cents, k) => {
        const o = ctx.createOscillator()
        o.type = types[k]
        o.frequency.value = mtof(note - (i === 0 ? 12 : 0))
        o.detune.value = cents + (Math.random() - 0.5) * 4
        const lfo = ctx.createOscillator()
        const lfoGain = ctx.createGain()
        lfo.frequency.value = 0.05 + Math.random() * 0.1
        lfoGain.gain.value = 5
        lfo.connect(lfoGain).connect(o.detune)
        lfo.start(t)
        o.connect(gain)
        o.start(t)
        oscs.push(o, lfo)
      })
      this.voices.push({ oscs, gain })
    })
  }

  private blip(note: number, level: number, decay: number, type: OscillatorType) {
    const ctx = this.ctx!
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = mtof(note)
    g.gain.value = 0
    g.gain.linearRampToValueAtTime(level, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    const pan = ctx.createStereoPanner()
    pan.pan.value = (Math.random() - 0.5) * 1.2
    o.connect(g).connect(pan)
    pan.connect(this.sfx)
    pan.connect(this.delay)
    o.start(t)
    o.stop(t + decay + 0.1)
  }

  private air() {
    const ctx = this.ctx!
    const len = ctx.sampleRate * 4
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      let last = 0
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
        d[i] = last * 3.5
      }
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900
    bp.Q.value = 0.7
    const lfo = ctx.createOscillator()
    const lg = ctx.createGain()
    lfo.frequency.value = 0.03
    lg.gain.value = 500
    lfo.connect(lg).connect(bp.frequency)
    const g = ctx.createGain()
    g.gain.value = 0.05
    src.connect(bp).connect(g).connect(this.music)
    src.start()
    lfo.start()
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!
    const len = Math.floor(ctx.sampleRate * seconds)
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
    return buf
  }
}

export const ambient = new AmbientEngine()
