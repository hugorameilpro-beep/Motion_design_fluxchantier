"""Epic trailer-style score, synthesised with numpy (no samples, no third-party audio).

Shared by the FluxChantier and VigiChantier videos. Same 128 BPM grid as the visuals
(1 bar = 1.875 s), D major with a darker opening:

  bar 1      Bm drone, braam + taiko on the logo
  bar 2      G -> A, taiko on every beat, string ostinato enters, swell into the wipe
  bars 3-6   D  Bm  G  A : full groove (taiko pattern, 16th ostinato, strings pad, heroic melody)
  bar 7      G -> A : taiko roll and rise, braam on the outro
  bar 8      D : climax braam on the end logo, melody holds the tonic
  bars 9-10  G -> D : soft strings under the Synapsis signature

compose(TL, SR) returns a (N, 2) float array; the caller mixes sound effects on top.
"""
import numpy as np


def compose(TL, SR=44100, seed=5, stems=False):
    rng = np.random.default_rng(seed)
    DUR = TL["duration"]
    N = int(SR * DUR)
    BEAT = 60 / TL["bpm"]
    BAR = 4 * BEAT
    out = {k: np.zeros((N, 2)) for k in ("pad", "ost", "mel", "low", "drm", "fx")}

    def note(n):
        return 440.0 * 2 ** ((n - 69) / 12)

    def tax(d):
        return np.arange(int(d * SR)) / SR

    def put(stem, t0, sig, gain=1.0, pan=0.0):
        i = int(round(t0 * SR))
        if i >= N or len(sig) == 0:
            return
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
        j = min(N, i + len(sig))
        a = max(0, -i)
        out[stem][max(i, 0):j] += sig[a:j - i] * gain

    def saw(freq, n, ph0=0.0):
        """PolyBLEP band-limited saw; freq is a scalar or a per-sample array."""
        f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
        dt = f / SR
        ph = (ph0 + np.cumsum(dt)) % 1.0
        y = 2 * ph - 1
        m = ph < dt
        x = ph[m] / dt[m]
        y[m] -= x + x - x * x - 1
        m = ph > 1 - dt
        x = (ph[m] - 1) / dt[m]
        y[m] -= x * x + x + x + 1
        return y

    def lp(x, fc, order=2):
        X = np.fft.rfft(x, axis=0)
        f = np.fft.rfftfreq(x.shape[0], 1 / SR)
        H = 1 / np.sqrt(1 + (f / fc) ** (2 * order))
        return np.fft.irfft(X * (H[:, None] if x.ndim == 2 else H), n=x.shape[0], axis=0)

    def hp(x, fc, order=2):
        X = np.fft.rfft(x, axis=0)
        f = np.fft.rfftfreq(x.shape[0], 1 / SR)
        H = 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))
        return np.fft.irfft(X * (H[:, None] if x.ndim == 2 else H), n=x.shape[0], axis=0)

    # ---------------------------------------------------------------- instruments
    DET = [-17, -10, -4, 0, 4, 10, 17]

    def strings(t0, d, notes, gain, attack=0.35, release=0.3):
        n = int((d + release) * SR)
        t = np.arange(n) / SR
        vib = 1 + 0.0035 * np.sin(2 * np.pi * 5.3 * t + rng.uniform(0, 6)) * np.minimum(1, t / 0.6)
        L = np.zeros(n); R = np.zeros(n)
        for nn in notes:
            for k, c in enumerate(DET):
                y = saw(note(nn) * 2 ** (c / 1200) * vib, n, rng.uniform())
                p = (k / (len(DET) - 1)) * 2 - 1
                L += y * (1 - p) * 0.5; R += y * (1 + p) * 0.5
        env = np.minimum(1, t / attack) * np.clip((d + release - t) / release, 0, 1)
        sig = np.stack([L, R], axis=1) * env[:, None] / (len(notes) * len(DET)) * 2.2
        put("pad", t0, sig, gain)

    def ostinato_note(t0, nn, gain, pan):
        d = BEAT / 4 * 0.95
        n = int(d * 1.6 * SR)
        t = np.arange(n) / SR
        y = 0.6 * saw(note(nn) * 2 ** (6 / 1200), n, rng.uniform()) + 0.6 * saw(note(nn) * 2 ** (-6 / 1200), n, rng.uniform())
        env = np.minimum(1, t / 0.003) * np.exp(-t * 16)
        put("ost", t0, y * env, gain, pan)

    def lead(t0, d, nn, gain):
        n = int((d + 0.25) * SR)
        t = np.arange(n) / SR
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.18) / 0.3, 0, 1)
        y = sum(saw(note(nn) * 2 ** (c / 1200) * vib, n, rng.uniform()) for c in (-7, 0, 7)) / 3
        env = np.minimum(1, t / 0.09) * np.clip((d + 0.25 - t) / 0.25, 0, 1) * (0.85 + 0.15 * np.exp(-t * 3))
        put("mel", t0, y * env, gain, 0.12)

    def braam(t0, root, gain=1.0, d=2.4):
        n = int(d * SR)
        t = np.arange(n) / SR
        raw = np.zeros(n)
        for nn in (root, root + 7, root + 12, root + 19):
            for c in (-12, -5, 0, 5, 12):
                raw += saw(note(nn) * 2 ** (c / 1200) * (1 + 0.012 * np.exp(-t * 6)), n, rng.uniform())
        raw /= 20
        dark, bright = lp(raw, 320, 3), lp(raw, 2800, 2)
        k = np.minimum(1, t / 0.07) * np.exp(-t * 1.6)          # filter opens fast, closes slowly
        y = dark * (1 - k) + bright * k
        y = np.tanh(2.2 * y) * np.minimum(1, t / 0.02) * np.exp(-t * 1.05)
        put("low", t0, np.stack([y, np.roll(y, 180)], axis=1), gain)

    def taiko(t0, gain=1.0, big=True, pan=0.0):
        d = 0.9 if big else 0.45
        n = int(d * SR)
        t = np.arange(n) / SR
        sig = np.zeros(n)
        for off, det in ((0.0, 1.0), (0.006, 0.97), (0.013, 1.04)):   # small ensemble flam
            tt = np.clip(t - off, 0, None)
            f0, f1 = (46, 75) if big else (105, 80)
            f = (f0 + f1 * np.exp(-tt * (18 if big else 30))) * det
            body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (4.5 if big else 9)) * (t >= off)
            skin = np.sin(2 * np.pi * (190 if big else 330) * det * tt) * np.exp(-tt * 28) * 0.35 * (t >= off)
            sig += body + skin
        hit = rng.standard_normal(n) * np.exp(-t * 60) * 0.5
        sig = np.tanh(1.6 * (sig / 3 + lp(hit, 1800)))
        put("drm", t0, sig, gain, pan)

    def crash(t0, gain=0.5, d=2.6):
        t = tax(d)
        c = hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 1.6)
        put("fx", t0, np.stack([c, np.roll(c, 211)], axis=1), gain)

    def swell(t_end, d, gain=0.5):
        t = tax(d)
        s = hp(rng.standard_normal(len(t)), 2500) * (t / d) ** 3
        put("fx", t_end - d, np.stack([s, np.roll(s, 97)], axis=1), gain)

    def tick(t0, gain):
        t = tax(0.03)
        put("drm", t0, hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 140), gain, 0.3)

    # ---------------------------------------------------------------- harmony
    VOICE = {"Bm": [47, 54, 59, 62, 66], "G": [43, 50, 55, 59, 62], "A": [45, 52, 57, 61, 64], "D": [50, 57, 62, 66, 69]}
    ROOT3 = {"Bm": 47, "G": 43, "A": 45, "D": 50}       # ostinato roots (octave 3)
    LOW = {"Bm": 35, "G": 31, "A": 33, "D": 38}         # braam roots (octave 1-2)
    # (start time, duration, chord)
    plan = [(0.0, BAR, "Bm"), (BAR, BAR / 2, "G"), (1.5 * BAR, BAR / 2, "A"),
            (2 * BAR, BAR, "D"), (3 * BAR, BAR, "Bm"), (4 * BAR, BAR, "G"), (5 * BAR, BAR, "A"),
            (6 * BAR, BAR / 2, "G"), (6.5 * BAR, BAR / 2, "A"), (7 * BAR, BAR, "D"),
            (8 * BAR, BAR, "G"), (9 * BAR, DUR - 9 * BAR, "D")]
    chord_at = lambda tt: next(c for (s, d, c) in plan if s <= tt < s + d + 1e-6)

    pop, hit = TL["logoPop"], TL["logoHit"]
    sig0 = TL["scenes"].get("signature", [DUR, DUR])[0]

    # strings pad (quiet in the intro and the signature, full in the body)
    for (s, d, c) in plan:
        g = 0.55 if s < BAR else 0.75 if s < 2 * BAR else 0.45 if s >= sig0 - 1e-6 else 1.0
        strings(s, d, VOICE[c], 0.16 * g, attack=0.6 if s < BAR else 0.25)
    # low drone under the intro
    strings(0.0, BAR + 0.2, [35, 42], 0.12, attack=0.7)

    # ostinato: enters on the A of bar 2, grows, stops before the climax
    pat = [0, 12, 7, 12]
    t16 = BEAT / 4
    tt = 1.5 * BAR
    while tt < 7 * BAR - 1e-6:
        c = chord_at(tt)
        i = int(round(tt / t16))
        g = 0.05 if tt < 2 * BAR else 0.085 if tt < 4 * BAR else 0.1
        acc = 1.25 if i % 4 == 0 else 1.0
        ostinato_note(tt, ROOT3[c] + pat[i % 4], g * acc, 0.25 if i % 2 else -0.25)
        if tt >= 4 * BAR:                      # octave layer for the second half
            ostinato_note(tt, ROOT3[c] + 12 + pat[(i + 2) % 4], g * 0.45, -0.4 if i % 2 else 0.4)
        tt += t16

    # heroic melody (bars 3-8)
    mel = [  # (bar, beat, beats, midi)
        (2, 0, 2, 81), (2, 2, 1, 78), (2, 3, 1, 81),
        (3, 0, 2, 83), (3, 2, 2, 78),
        (4, 0, 2, 86), (4, 2, 1, 83), (4, 3, 1, 79),
        (5, 0, 2, 85), (5, 2, 2, 88),
        (6, 0, 2, 86), (6, 2, 2, 88),
    ]
    for (b, bt, ln, nn) in mel:
        lead(b * BAR + bt * BEAT, ln * BEAT * 0.98, nn, 0.06)
    lead(hit, 15 - hit, 86, 0.075)
    lead(hit, 15 - hit, 78, 0.04)

    # braams on the big moments
    braam(pop, LOW["Bm"], 0.55)
    braam(2 * BAR, LOW["D"], 0.6)
    braam(6.5 * BAR, LOW["A"], 0.6)
    braam(hit, LOW["D"], 0.9, d=2.8)
    braam(hit, LOW["D"] + 12, 0.35, d=2.2)

    # drums
    taiko(pop, 1.0); crash(pop, 0.25)
    for k in range(4):                                   # bar 2: every beat
        taiko(BAR + k * BEAT, 0.75 + 0.08 * k, big=True, pan=(-0.2, 0.2)[k % 2])
    taiko(2 * BAR, 1.15); crash(2 * BAR, 0.45)
    groove = [(0, True, 1.0), (1.5, False, 0.55), (2, True, 0.85), (3, False, 0.6), (3.5, False, 0.7)]
    for b in range(2, 6):
        for (bt, big, g) in groove:
            if b == 2 and bt == 0:
                continue
            taiko(b * BAR + bt * BEAT, g * (0.9 if big else 1.0), big=big, pan=0.15 if not big else 0.0)
        for s in range(16):                              # light ticking: keeps the tech feel
            tick(b * BAR + s * t16, 0.035 if s % 4 else 0.05)
    roll = np.arange(6 * BAR, 6.5 * BAR, t16 / 2)         # bar 7: roll into the outro
    for i, r0 in enumerate(roll):
        taiko(r0, 0.18 + 0.55 * (i / len(roll)) ** 1.5, big=False, pan=(-0.25, 0.25)[i % 2])
    taiko(6.5 * BAR, 1.1); crash(6.5 * BAR, 0.4)
    for i, r0 in enumerate(np.arange(6.5 * BAR + BEAT / 2, hit - 0.05, BEAT / 2)):
        taiko(r0, 0.45 + 0.1 * i, big=True)
    taiko(hit, 1.4); taiko(hit + 0.012, 0.9); crash(hit, 0.6, 3.2)

    # swells into the transitions
    swell(pop, 0.6, 0.35)
    swell(2 * BAR, 0.9, 0.4)
    swell(hit, 1.1, 0.45)

    # ---------------------------------------------------------------- stem mix
    pad = hp(lp(out["pad"], 2200), 70)
    ost = hp(lp(out["ost"], 2600), 110)
    mel = lp(out["mel"], 3800)
    low = out["low"]
    drm = out["drm"]
    fx = out["fx"]
    t = np.arange(N) / SR
    # gentle pump on the body groove so the drums punch through the strings
    pump = np.ones(N)
    for b in range(2, 7):
        for bt in (0, 2):
            k0 = b * BAR + bt * BEAT
            m = (t >= k0) & (t < k0 + 0.4)
            pump[m] = np.minimum(pump[m], 1 - 0.28 * np.exp(-(t[m] - k0) / 0.12))
    # stem balance (measured per section: drums lead, strings and melody clearly audible underneath)
    parts = {"pad": pad * 3.2 * pump[:, None], "ost": ost * 2.5 * pump[:, None], "mel": mel * 2.8 * pump[:, None],
             "low": low * 0.9, "drm": drm * 0.66, "fx": fx * 0.6}
    if stems:
        return parts
    return sum(parts.values())
