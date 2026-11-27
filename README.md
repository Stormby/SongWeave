# Songweave

Songweave 0.2 is a generative MIDI instrument for macOS 13+ and Ableton Live 12. Each composition has melody, chords, bass and arp tracks.

## Play four instruments in Ableton Live

1. Load Songweave on a MIDI track and open its editor. Under **MIDI output**, select **Virtual ports (Ableton Live)**.
2. In Live's MIDI input settings, turn **Track** on for **Songweave Melody**, **Songweave Chords**, **Songweave Bass** and **Songweave Arp**.
3. Create four instrument tracks. On each track select its Songweave port under **MIDI From**, choose **All Channels**, and set **Monitor** to **In**. Avoid monitoring the Songweave generator track from its own ports.
4. Start Live from bar 1. The whole song follows the Arrangement playhead and tempo. With Live stopped, **Preview** plays the selected song or section through the same outputs. To capture clips, arm the receiving tracks and record in Live.
5. The channel selectors default to Melody 1, Chords 2, Bass 3 and Arp 4. Choosing an occupied channel swaps the two assignments. Exported MIDI uses the same channel choices. Additional instances label their ports **Songweave 2 Melody**, etc.

**VST3 MIDI channels** sends the parts on one plug-in MIDI output for hosts that preserve channel separation. **Preview sounds** uses Songweave’s built-in audio audition. Existing 0.1 projects open in this mode. New routing settings are saved with the Set. Virtual MIDI is for real-time playback and recording.
