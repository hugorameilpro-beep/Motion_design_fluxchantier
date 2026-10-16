"""Synthesises the VigiChantier soundtrack (music bed + sound design) from src/timeline.js.

128 BPM, epic trailer score (scripts/epic_music.py). Every SFX time comes from the same timeline as the visuals,
so clicks, whooshes and impacts land on the frame they illustrate.
Output: build/audio.wav (44.1 kHz, 16-bit stereo).
"""
import json
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "src/timeline.js"), encoding="utf8").read()
TL = json.loads(src[src.index("{"): src.rindex("}") + 1])

SR = 44100
DUR = TL["duration"]
N = int(SR * DUR)
BEAT = 60 / TL["bpm"]
BAR = BEAT * 4
rng = np.random.default_rng(3)

music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
kicks = []


def note(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l, sig * r], axis=1) * np.sqrt(2)
    j = min(N, i + len(sig))
    a = max(0, -i)
    buf[max(i, 0):j] += sig[a:j - i] * gain


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc
        y[k] = acc
    return y


def svf_bp(x, fc, q=1.2):
    """State-variable band-pass with per-sample cutoff array."""
    lp = bp = 0.0
    y = np.empty_like(x)
    for k in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc[k], SR / 6) / SR)
        hp = x[k] - lp - bp / q
        bp += f * hp
        lp += f * bp
        y[k] = bp
    return y


def hp_noise(d, cutoff_mix=0.85):
    n = rng.standard_normal(int(d * SR))
    return n - cutoff_mix * np.concatenate([[0], n[:-1]])


# ------------------------------------------------------------------ instruments
def kick(t0, gain=1.0, big=False):
    t = t_axis(0.55 if big else 0.32)
    f = 46 + 120 * np.exp(-t * (28 if big else 38))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.exp(-t * (6 if big else 11))
    s = np.tanh(2.2 * np.sin(ph) * env)
    click = np.exp(-t * 400) * rng.standard_normal(len(t)) * 0.15
    add(music, t0, (s + click) * 0.9, gain)
    kicks.append(t0)


def hat(t0, gain=0.22, open_=False):
    d = 0.18 if open_ else 0.05
    t = t_axis(d)
    s = hp_noise(d, 0.98) * np.exp(-t * (18 if open_ else 70))
    add(music, t0, s, gain, pan=0.25)


def clap(t0, gain=0.35):
    t = t_axis(0.22)
    n = rng.standard_normal(len(t))
    env = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 60) * (t > 0.012)
    s = svf_bp(n * env, np.full(len(t), 1500.0), 0.9)
    add(music, t0, s * 2.2, gain, pan=-0.1)


def pad_chord(t0, d, notes, gain=0.10):
    t = t_axis(d)
    s = np.zeros(len(t))
    for n in notes:
        for det in (-0.08, 0.0, 0.08):
            f = note(n + det)
            off = rng.uniform(0, 1)
            s += (2 * ((f * t + off) % 1) - 1) * 0.5 + np.sin(2 * np.pi * (f * t + off)) * 0.5
    s = onepole_lp(s / len(notes), 1400)
    env = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.2 + 0.0)
    env = np.clip(env, 0, 1)
    l = s * env
    r = np.roll(s, 220) * env
    add(music, t0, np.stack([l, r], axis=1), gain)


def bass(t0, d, n, gain=0.32):
    t = t_axis(d)
    f = note(n)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.005) * np.exp(-t * 5)
    add(music, t0, np.tanh(1.6 * s * env), gain)


def pluck(t0, n, gain=0.10, pan=0.0):
    t = t_axis(0.35)
    f = note(n)
    tri = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
    s = (tri * 0.7 + np.sin(2 * np.pi * 2 * f * t) * 0.3) * np.exp(-t * 14)
    add(music, t0, s, gain, pan)


def bell(t0, n, gain=0.22, pan=0.0, d=1.6):
    t = t_axis(d)
    f = note(n)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
         + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10))
    s *= np.minimum(1, t / 0.002)
    add(sfx, t0, s, gain, pan)


def whoosh(t0, d=0.55, gain=0.5, f0=300, f1=4500, rev=False):
    t = t_axis(d)
    k = t / d
    fc = f0 * (f1 / f0) ** (k if not rev else 1 - k)
    env = np.sin(np.pi * k) ** 2
    l = svf_bp(rng.standard_normal(len(t)) * env, fc, 1.6)
    r = svf_bp(rng.standard_normal(len(t)) * env, fc * 1.08, 1.6)
    pan = np.linspace(-0.8, 0.8, len(t))
    add(sfx, t0 - d * 0.55, np.stack([l * (1 - pan) , r * (1 + pan)], axis=1) * 0.9, gain)


def click(t0, gain=0.45):
    t = t_axis(0.06)
    s = np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 180) + 0.8 * np.sin(2 * np.pi * 900 * t) * np.exp(-t * 90)
    s += rng.standard_normal(len(t)) * np.exp(-t * 600) * 0.4
    add(sfx, t0, s, gain, 0.1)


def tick(t0, gain=0.12):
    t = t_axis(0.03)
    f = rng.uniform(3000, 4200)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 300) + rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.6
    add(sfx, t0, s, gain, rng.uniform(-0.3, 0.3))


def impact(t0, gain=0.9, crash=True):
    t = t_axis(1.6)
    f = 38 + 60 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.6)
    add(sfx, t0, np.tanh(1.8 * sub), gain)
    if crash:
        c = hp_noise(1.6, 0.97) * np.exp(-t * 2.4) * 0.5
        add(sfx, t0, np.stack([c, np.roll(c, 300)], axis=1), gain * 0.55)


def riser(t0, t1, gain=0.35):
    d = t1 - t0
    t = t_axis(d)
    k = t / d
    fc = 400 * (9000 / 400) ** (k ** 1.5)
    n = svf_bp(rng.standard_normal(len(t)), fc, 2.0) * k ** 2
    f = note(50) * 2 ** (k * 1.0)
    saw = (2 * ((np.cumsum(f) / SR) % 1) - 1) * 0.25 * k ** 2
    add(sfx, t0, n + saw, gain)


def swell(t0, d, gain=0.35):
    t = t_axis(d)
    k = t / d
    n = svf_bp(rng.standard_normal(len(t)), 300 * (6000 / 300) ** k, 1.4) * k ** 3
    add(sfx, t0, n, gain)


# ------------------------------------------------------------------ arrangement
# Epic trailer-style score (taiko, string ostinato, strings pad, braams), shared by both videos.
import sys
sys.path.insert(0, os.path.join(ROOT, "../scripts"))
from epic_music import compose  # noqa: E402

S = TL["scenes"]
roots = {"D": 38, "A": 33, "Bm": 35, "G": 31}  # used by the signature sound design below
music += compose(TL, SR)

# ------------------------------------------------------------------ sound design
swell(0.0, TL["logoPop"], 0.45)
impact(TL["logoPop"], 0.55, crash=False)
bell(TL["logoPop"], 86, 0.12, 0.2)
bell(TL["logoPop"] + 0.08, 93, 0.08, -0.2)
for w in TL["whoosh"]:
    big = abs(w - TL["wipe"]) < 0.01
    whoosh(w + (0.25 if big else 0.18), d=0.7 if big else 0.5, gain=0.7 if big else 0.42)
impact(TL["slam"], 0.75)

u = TL["url"]
for i in range(len(u["text"])):
    tick(u["t0"] + i / u["cps"], 0.1)
tick(u["t0"] + len(u["text"]) / u["cps"] + 0.05, 0.2)  # enter
for f in TL["fields"]:
    for i in range(len(f["text"])):
        tick(f["t0"] + i / TL["fieldsCps"], 0.08)
for c in TL["clicks"]:
    click(c)

# the four weather tiles land on the beat
for i, tt in enumerate(TL.get("tiles", [])):
    pluck(tt, [74, 78, 81, 86][i] + 12, 0.16, pan=-0.45 + 0.3 * i)
    pluck(tt, [74, 78, 81, 86][i], 0.1)

# VigiPluie flips to "Averse imminente": short warning blip
fl = TL["okBox"]
for i in range(2):
    bell(fl + i * 0.12, 84 - 5 * i, 0.12, 0.2, 0.5)

# GO / VIGILANCE / NO-GO verdicts: VIGILANCE sits higher than NO-GO
for i, tt in enumerate(TL.get("selects", [])):
    pluck(tt, 69 if i == 1 else 62, 0.2, pan=0.2)
    click(tt, 0.12)

# push alert: impact + two-tone alert ping, then the notification chime
ts = TL["success"]
impact(ts, 0.5, crash=False)
for i, n in enumerate([88, 81, 88, 81]):
    bell(ts + 0.02 + i * 0.11, n, 0.11, 0.3 if i % 2 else -0.3, 0.45)
bell(TL["notif"], 81, 0.16, 0.4, 0.9)
bell(TL["notif"] + 0.11, 88, 0.14, 0.4, 1.1)

# NFC scans: short confirmation beeps, rising
for i, tt in enumerate(TL.get("scans", [])):
    tb = t_axis(0.09)
    f = note(84 + (i % 4))
    add(sfx, tt, np.sin(2 * np.pi * f * tb) * np.exp(-tb * 40) * np.minimum(1, tb / 0.003), 0.16, 0.35)

# round complete: "Chantier 100 % Sécurisé !"
impact(TL["stamp"], 0.4, crash=False)
for i, n in enumerate([74, 78, 81, 86]):
    bell(TL["stamp"] + i * 0.07, n + 12, 0.15, -0.3 + 0.2 * i, 1.4)

# rain ambience following the on-screen storm
storm_k = [(0, 0.7), (1.8, 0.45), (3.8, 0.25), (9.2, 0.25), (9.45, 1.5), (11.8, 1.2), (12.4, 0.5), (15, 0.4), (15.4, 0)]
tt_all = np.arange(N) / SR
env = np.interp(tt_all, [k[0] for k in storm_k], [k[1] for k in storm_k])
rainL = rng.standard_normal(N); rainR = rng.standard_normal(N)
rainL = rainL - 0.92 * np.concatenate([[0], rainL[:-1]])
rainR = rainR - 0.92 * np.concatenate([[0], rainR[:-1]])
add(sfx, 0, np.stack([rainL * env, rainR * env], axis=1), 0.035)
riser(11.25, S["outro"][0], 0.32)
impact(S["outro"][0], 0.6)
for i, r in enumerate(TL["recap"]):
    pluck(r, [74, 78, 81][i] + 12, 0.18, pan=-0.4 + 0.4 * i)
    pluck(r, [74, 78, 81][i], 0.12)
impact(TL["logoHit"], 1.0)
for i, n in enumerate([62, 66, 69, 74, 78]):
    bell(TL["logoHit"] + 0.02 * i, n + 12, 0.08, -0.4 + 0.2 * i, 2.2)

# Synapsis signature: soft landing on the logo, then the name and the URL
if "sig" in TL:
    g = TL["sig"]
    l0 = g["logo"][0]
    impact(l0, 0.35, crash=False)
    for i, n in enumerate([67, 71, 74, 79, 83]):
        bell(l0 + 0.05 * i, n + 12, 0.07, -0.4 + 0.2 * i, 2.6)
    bell(g["name"], 86, 0.06, -0.2, 1.8)
    bell(g["url"], 90, 0.05, 0.2, 1.8)
    bass(l0, 3.0, roots["G"], 0.16)

# ------------------------------------------------------------------ mix
tt = np.arange(N) / SR
duck = np.ones(N)
for k in kicks:
    m = tt >= k
    duck[m] = np.minimum(duck[m], 1 - 0.55 * np.exp(-(tt[m] - k) / 0.11))
music *= duck[:, None]

mix = music + sfx

# synthetic convolution reverb
ir_t = t_axis(1.9)
ir = np.stack([rng.standard_normal(len(ir_t)), rng.standard_normal(len(ir_t))], axis=1)
ir *= np.exp(-ir_t * 3.4)[:, None]
ir[: int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=0))
L = N + len(ir_t)
nfft = 1 << (L - 1).bit_length()
wet = np.stack([np.fft.irfft(np.fft.rfft(mix[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:N] for c in range(2)], axis=1)
mix = mix + 0.22 * wet

# fade the tail into the last frame
fade = np.clip((DUR - tt) / 0.9, 0, 1) ** 1.5
mix *= fade[:, None]
mix[: int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))[:, None]

mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 10 ** (-6.5 / 20) / np.max(np.abs(mix))  # leaves true-peak headroom, ~-14 LUFS

os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
out = os.path.join(ROOT, "build/audio.wav")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print(f"wrote {out} ({DUR:.2f} s)")
