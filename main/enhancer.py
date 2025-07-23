import soundfile as sf
import numpy as np
import scipy.signal

# ------------------------
# 🎚️ Multiband EQ
# ------------------------
def multiband_eq(audio, rate):
    bands = [
        (80, 0.7, 'highpass'),                  # Low-cut
        ((2000, 4000), 1.2, 'bandpass'),        # Presence boost range
        (10000, 1.3, 'highpass')                # Air/high-end boost
    ]

    output = audio.copy()
    for freq, gain, btype in bands:
        if btype == 'bandpass' or btype == 'bandstop':
            wn = [f / (rate / 2) for f in freq]  # freq is a tuple
        else:
            wn = freq / (rate / 2)              # freq is a single value

        b, a = scipy.signal.iirfilter(N=2, Wn=wn, btype=btype, ftype='butter')
        filtered = scipy.signal.lfilter(b, a, audio)
        output += gain * filtered
    return output


# ------------------------
# 🔊 Light Compression
# ------------------------
def apply_compression(audio, threshold_db=-20, ratio=4.0):
    rms = np.sqrt(np.mean(audio**2))
    db = 20 * np.log10(rms + 1e-6)
    if db < threshold_db:
        return audio
    gain_reduction = 1 - (1 / ratio)
    return audio * (1 - gain_reduction)

# ------------------------
# 🔉 Normalize to ~-1 dBFS
# ------------------------
def normalize_audio(audio):
    peak = np.max(np.abs(audio))
    if peak == 0:
        return audio
    return audio * (0.9 / peak)

# ------------------------
# 🔁 Optional Light Reverb (optional polish)
# ------------------------
def fake_reverb(audio, rate, delay_ms=50, decay=0.4):
    delay_samples = int(rate * delay_ms / 1000)
    padded = np.pad(audio, (delay_samples, 0))
    reverb = decay * padded[:-delay_samples]
    return audio + reverb[:len(audio)]

# ------------------------
# 🎛️ Channel Processing
# ------------------------
def enhance_channel(audio, rate):
    eq = multiband_eq(audio, rate)
    comp = apply_compression(eq)
    reverb = fake_reverb(comp, rate)
    norm = normalize_audio(reverb)
    return norm

# ------------------------
# 🧑‍🤝‍🧑 Stereo-Safe Processing
# ------------------------
def process_stereo(audio, rate):
    if audio.ndim == 1:
        return enhance_channel(audio, rate)
    left = enhance_channel(audio[:, 0], rate)
    right = enhance_channel(audio[:, 1], rate)
    return np.stack([left, right], axis=1)

# ------------------------
# 🛠️ Main Enhancement Function
# ------------------------
def enhance_audio(file_path, output_path):
    audio, rate = sf.read(file_path)
    enhanced_audio = process_stereo(audio, rate)
    sf.write(output_path, enhanced_audio, rate)
    print(f"✅ Enhanced audio saved to: {output_path}")

# ------------------------
# 🧪 Example Usage
# ------------------------
if __name__ == "__main__":
    input_path = "C:\\Users\\isaac\\AppData\\Roaming\\musicplayer\\playlists\\og\\Million Days - SABAIHoangOlivia Ridgely.wav"
    output_path = "C:\\Users\\isaac\\AppData\\Roaming\\musicplayer\\playlists\\og\\enhanced_song_million_days.wav"
    enhance_audio(input_path, output_path)
