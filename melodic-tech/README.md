# SongWave Melodic Tech

An offline generative MIDI instrument and standalone app for macOS 13 and later. The Mac installer includes a universal VST3 for Ableton Live 12 and an application for preview and export.

Choose Anyma, Argy, Loreen, Agents of Time, Miss Monique or Melodic Tech General. Each palette uses original scale-degree examples, a local conditional sequence model, its own sixteenth-note patterns and section orchestration. No artist recordings, vocals or song transcriptions are included.

Preview the arrangement. Use **Variation** for a related take or **New song** for a new starting point. Turn up **Variety** to change the harmony, melody and form. Lock a part to keep its notes. Select **Whole song** or a named section before dragging or exporting MIDI.

The lanes are Melody, Chords, Bass, Arp and Response. Response holds answers to the main hook and accents at builds and drops. The default MIDI channels are 1–5 in that order. In Live, choose **Virtual ports (Ableton Live)** and enable **Track** for the five SongWave Melodic Tech inputs in the MIDI settings. On each receiving instrument track select its matching input and set **Monitor** to **In**. Play the Live Arrangement from bar 1. The standalone app can send the same parts via its Preview transport. Standard MIDI file export works offline and includes section markers, time signature and tempo.

Build using CMake 3.22 or newer and Xcode on macOS. Configure Release with both arm64 and x86_64 architectures, build the MelodicTech_VST3 and MelodicTech_Standalone targets, then run tools/package-for-installer.sh with Bash. The GitHub workflow runs the editor and engine tests, CoreMIDI loopbacks, package installation and pluginval.
