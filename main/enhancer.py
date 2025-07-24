print("1: Script started")
from scipy.io import wavfile
print("2: Imported wavfile")
import numpy as np
print("3: Imported numpy")
from scipy.signal import lfilter
print("4: Imported scipy.signal")
import os
print("5: All imports successful")

print("RUNNING")

# -------------------------------------------------------------------
# 🎚️ 1. Studio Biquad EQ (Correct Implementation)
# I'm replacing the original EQ with a standard cascaded biquad filter design.
# This is how most professional digital EQs work. We will define the filter
# types (Low Shelf, Peaking, High Shelf) and chain them together.
# -------------------------------------------------------------------

def _calculate_biquad_coeffs(filter_type, Fs, Fc, Q, gain_dB):
    """Calculates coefficients for a single biquad filter."""
    A = 10**(gain_dB / 40.0)
    w0 = 2 * np.pi * Fc / Fs
    alpha = np.sin(w0) / (2 * Q)
    
    if filter_type == 'peaking':
        b0 = 1 + alpha * A
        b1 = -2 * np.cos(w0)
        b2 = 1 - alpha * A
        a0 = 1 + alpha / A
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha / A
    elif filter_type == 'low_shelf':
        b0 = A * ((A + 1) - (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha)
        b1 = 2 * A * ((A - 1) - (A + 1) * np.cos(w0))
        b2 = A * ((A + 1) - (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha)
        a0 = (A + 1) + (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha
        a1 = -2 * ((A - 1) + (A + 1) * np.cos(w0))
        a2 = (A + 1) + (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha
    elif filter_type == 'high_shelf':
        b0 = A * ((A + 1) + (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha)
        b1 = -2 * A * ((A - 1) + (A + 1) * np.cos(w0))
        b2 = A * ((A + 1) + (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha)
        a0 = (A + 1) - (A - 1) * np.cos(w0) + 2 * np.sqrt(A) * alpha
        a1 = 2 * ((A - 1) - (A + 1) * np.cos(w0))
        a2 = (A + 1) - (A - 1) * np.cos(w0) - 2 * np.sqrt(A) * alpha
    else: # High-pass, useful for a low-cut
        b0 = (1 + np.cos(w0)) / 2
        b1 = -(1 + np.cos(w0))
        b2 = (1 + np.cos(w0)) / 2
        a0 = 1 + alpha
        a1 = -2 * np.cos(w0)
        a2 = 1 - alpha
        
    return np.array([b0, b1, b2]) / a0, np.array([a0, a1, a2]) / a0

def studio_eq(audio, rate):
    """
    Applies a series of subtle mastering EQ adjustments.
    This chain is a common starting point for adding clarity and removing mud.
    """
    # Typical mastering EQ settings:
    # 1. High-pass (low-cut) to remove sub-sonic rumble.
    # 2. Gentle cut in the low-mids to reduce "mud".
    # 3. Gentle boost in the upper-mids for "presence" and "clarity".
    # 4. High-shelf to add "air" and sparkle.
    eq_bands = [
        {'type': 'high_pass',  'freq': 30,    'q': 0.7, 'gain': 0},       # Remove rumble
        {'type': 'peaking',    'freq': 250,   'q': 1.5, 'gain': -1.0},    # Cut mud
        {'type': 'peaking',    'freq': 3000,  'q': 1.5, 'gain': 1.0},     # Add presence
        {'type': 'high_shelf', 'freq': 12000, 'q': 0.7, 'gain': 1.5},     # Add air
    ]

    processed_audio = audio.copy()
    for band in eq_bands:
        b, a = _calculate_biquad_coeffs(band['type'], rate, band['freq'], band['q'], band['gain'])
        processed_audio = lfilter(b, a, processed_audio, axis=0)
        
    return processed_audio

# -------------------------------------------------------------------
# 🔊 2. Dynamic Range Compressor (Proper Implementation)
# This compressor has attack/release to react to audio levels over time.
# It also links the L/R channels to preserve the stereo image.
# -------------------------------------------------------------------

def dynamic_compressor(audio, rate, threshold_db=-18.0, ratio=2.5, attack_ms=5.0, release_ms=100.0, makeup_gain_db=4.0):
    """
    A proper dynamic range compressor.
    - threshold_db: The level above which compression is applied.
    - ratio: The amount of gain reduction. E.g., 2.0 means for every 2dB over the threshold, the output only increases by 1dB.
    - attack_ms/release_ms: How quickly the compressor reacts to loud/soft sounds.
    """
    if audio.ndim == 1:
        left_channel = audio
    else:
        # Stereo linking: use the max of both channels for the envelope detector
        # to prevent the stereo image from shifting.
        left_channel = np.max(np.abs(audio), axis=1)

    threshold = 10**(threshold_db / 20.0)
    makeup_gain = 10**(makeup_gain_db / 20.0)

    attack_coeff = np.exp(-1.0 / (rate * attack_ms / 1000.0))
    release_coeff = np.exp(-1.0 / (rate * release_ms / 1000.0))
    
    envelope = np.zeros_like(left_channel)
    gain = np.ones_like(left_channel)
    
    # Envelope detection and gain computation
    for i in range(1, len(left_channel)):
        # RMS detection is more musical, but peak is simpler and safer here.
        # Use a smooth envelope follower.
        env_val = np.abs(left_channel[i])
        if env_val > envelope[i-1]:
            envelope[i] = attack_coeff * envelope[i-1] + (1 - attack_coeff) * env_val
        else:
            envelope[i] = release_coeff * envelope[i-1] + (1 - release_coeff) * env_val

        if envelope[i] > threshold:
            # We are over the threshold, calculate gain reduction
            gain_reduction = (envelope[i] / threshold)**(1.0 / ratio - 1.0)
            gain[i] = gain_reduction
        else:
            gain[i] = 1.0

    # Apply the computed gain to the original signal
    if audio.ndim > 1:
        gain = np.column_stack((gain, gain)) # Apply same gain to both L/R channels

    return audio * gain * makeup_gain

# -------------------------------------------------------------------
# 🧑‍🤝‍🧑 3. Stereo Widener (New Tool)
# Adds a sense of space and width using Mid/Side processing.
# Use sparingly! Too much can cause phase issues.
# -------------------------------------------------------------------

def stereo_widener(audio, width=1.2):
    """
    Enhances stereo width. width > 1.0 widens, < 1.0 narrows.
    """
    if audio.ndim != 2 or audio.shape[1] != 2:
        return audio # Only works on stereo files

    # Convert to Mid/Side
    mid = (audio[:, 0] + audio[:, 1]) / 2
    side = (audio[:, 0] - audio[:, 1]) / 2

    # Adjust side channel gain
    side *= width

    # Convert back to Left/Right
    left = mid + side
    right = mid - side
    
    return np.stack([left, right], axis=1)

# -------------------------------------------------------------------
# 🧱 4. Peak Limiter (Replaces Normalizer)
# The final stage. This acts as a transparent "brick wall" to prevent
# digital clipping while maximizing loudness.
# -------------------------------------------------------------------

def limiter(audio, rate, ceiling_db=-0.1, lookahead_ms=1.5):
    """
    A simple lookahead peak limiter.
    """
    ceiling = 10**(ceiling_db / 20.0)
    lookahead_samples = int(rate * lookahead_ms / 1000.0)
    
    # Simple RMS-based gain reduction could be used, but for a brickwall
    # limiter, we just find the future peak and prevent it from clipping.
    padded_audio = np.pad(audio, ((0, lookahead_samples), (0, 0)) if audio.ndim > 1 else (0, lookahead_samples))
    
    max_abs = np.max(np.abs(padded_audio))
    if max_abs == 0:
        return audio # Avoid division by zero on silence

    # Calculate the necessary gain reduction to not exceed the ceiling.
    # Add a small epsilon to prevent floating point issues.
    gain = min(1.0, ceiling / (max_abs + 1e-9))
    
    return audio * gain

# -------------------------------------------------------------------
# 🎛️ Master Channel Strip (The Full Chain)
# -------------------------------------------------------------------

def mastering_chain(audio, rate):
    """
    The complete processing chain in a typical mastering order.
    """
    # 1. EQ: Corrective and additive tonal shaping
    audio_eq = studio_eq(audio, rate)
    
    # 2. Compressor: Glue the mix together and control dynamics
    audio_comp = dynamic_compressor(audio_eq, rate)
    
    # 3. Stereo Widener: Add a touch of space (optional)
    audio_wide = stereo_widener(audio_comp, width=1.15)
    
    # 4. Limiter: Final loudness boost and peak prevention
    audio_limited = limiter(audio_wide, rate)
    
    return audio_limited

# -------------------------------------------------------------------
# 🛠️ Main Function
# -------------------------------------------------------------------

def enhance_audio(file_path, output_path):
    """Loads, processes, and saves the audio file using scipy."""
    try:
        # SciPy's read function returns the rate and an integer array
        rate, audio_int = wavfile.read(file_path)
        print(f"💽 Loaded '{file_path}' | Rate: {rate} Hz | Shape: {audio_int.shape}")

        # --- IMPORTANT STEP ---
        # Convert integer audio to float between -1.0 and 1.0 for processing
        if audio_int.dtype == np.int16:
            audio_float = audio_int.astype(np.float32) / 32767.0
        elif audio_int.dtype == np.int32:
            audio_float = audio_int.astype(np.float32) / 2147483647.0
        else:
            audio_float = audio_int.astype(np.float32) # Assume it's already float if not int

        # Run the same mastering chain as before
        enhanced_audio_float = mastering_chain(audio_float, rate)
        
        # --- IMPORTANT STEP ---
        # Convert the processed float audio back to 16-bit integer for saving
        enhanced_audio_int = (enhanced_audio_float * 32767).astype(np.int16)

        # Write the final integer audio to a .wav file
        wavfile.write(output_path, rate, enhanced_audio_int)
        print(f"✅ Enhanced audio saved to: {output_path}")

    except Exception as e:
        print(f"❌ An error occurred: {e}")


print("Rrunning")
input_path = "C:\\Users\\isaac\\AppData\\Roaming\\musicplayer\\playlists\\og\\Million Days - SABAIHoangOlivia Ridgely.wav"
output_path = "C:\\Users\\isaac\\AppData\\Roaming\\musicplayer\\playlists\\og\\enhanced_song_million_days.wav"
enhance_audio(input_path, output_path)
