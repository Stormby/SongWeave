# Songweave

Songweave 0.3 is a generative MIDI instrument for macOS 13+ and Ableton Live 12. Each composition has melody, chords, bass and arp tracks.

## Play four instruments in Ableton Live

1. Load Songweave on a MIDI track and open its editor. Under **MIDI output**, select **Virtual ports (Ableton Live)**.
2. In Live's MIDI input settings, turn **Track** on for **Songweave Melody**, **Songweave Chords**, **Songweave Bass** and **Songweave Arp**.
3. Create four instrument tracks. On each track select its Songweave port under **MIDI From**, choose **All Channels**, and set **Monitor** to **In**. Avoid monitoring the Songweave generator track from its own ports.
4. Start Live from bar 1. The whole song follows the Arrangement playhead and tempo. With Live stopped, **Preview** plays the selected song or section through the same outputs. To capture clips, arm the receiving tracks and record in Live.
5. The channel selectors default to Melody 1, Chords 2, Bass 3 and Arp 4. Choosing an occupied channel swaps the two assignments. Exported MIDI uses the same channel choices. Additional instances label their ports **Songweave 2 Melody**, etc.

**VST3 MIDI channels** sends the parts on one plug-in MIDI output for hosts that preserve channel separation. **Preview sounds** uses Songweave’s built-in audio audition. Existing 0.1 projects open in this mode. New routing settings are saved with the Set. Virtual MIDI is for real-time playback and recording.

## Composer presets

Choose **Style → Composer presets** and select a name. Each preset generates original themes from its own phrase and harmony examples.

| Composer | Musical choices | Suggested Live instruments, Melody / Chords / Bass / Arp |
| --- | --- | --- |
| Angelo Badalamenti | Sustained low pedal, chromatic tension in the synth pad and a warmer, higher answering theme. | Soft analog lead / slow saw pad / sub bass / distant electric piano |
| Ólafur Arnalds | A small piano cell with breathing room and slight timing variation, underlaid with sustained strings and an offset electronic pulse. | Felt piano / muted strings / cello / filtered pluck |
| Max Richter | A slow upper string line, sustained bass and a moving inner voice on the Arp lane. | Violin / string ensemble / low cello / viola |

The built-in audition gives these palettes different attacks, harmonic colours and envelopes. Virtual MIDI sends the written performance to the instruments you choose in Live.

## Variety

The slider affects the next **Variation**, **Vary section** or **New song**. Close takes retain the motif and chord plan and vary performance details. Higher settings replace more melodic and harmonic material, alter the rate of chord changes and reshape the timing and space in each lane. A variation stays in the current key and layout. At 70% or higher **New song** can choose a different key and rebalance section lengths, and above 85% it can reorder middle sections. **Keep key** holds the tonal centre. Choosing a key manually enables it. Hand-edited layouts are retained. Locking a part holds the shared harmonic plan and form so the other instruments still fit.

| Additional composer preset | Musical character |
| --- | --- |
| Johnny Jewel | Late-entering analog lead, shadowed organ chords and fading echoes over a low pedal. |
| Cliff Martinez | Short, gated bass pulses and offbeat metallic mallets beneath a floating synth line. |
| Alexandre Desplat | A chamber suite weaving suspense, nimble woodwind phrases and lilting harp figures in triple time. |
| Hans Zimmer | A spacious slow ascent with organ, sustained strings and a restrained repeating piano figure. |
| Thomas Newman | Fragmented piano phrases and asymmetrical mallet patterns, with room between the attacks. |
