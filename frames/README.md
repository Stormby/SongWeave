# SongWave Frames

A macOS VST3 instrument and standalone MIDI composer for Void & Vista FRAMES in Kontakt 8. Open the Mac installer, then find SongWave Frames under VST3 in Ableton Live 12. The installer targets Apple silicon and Intel on macOS 13 or later. The app is installed in Applications. Kontakt, FRAMES and an acoustic piano instrument are supplied by the musician.

## First song

1. Select Dark Score, Piano-led, Expressive and a duration. Generate song changes the key, harmony, tempo, phrase material and section lengths according to the theme. A new generation may share individual choices with an earlier one.
2. Click Preview for sketch sounds. Choose a section to hear the development or return. Generate & hear melody auditions up to 30 seconds of a fresh take over the current backing. Previous take and Replay let you compare. Use in song applies the new melody throughout. Undo brings back the previous arrangement.
3. Drag **Piano** from the bottom bar to a piano track in Arrangement View. Drag **Lead, Strings, Pad, Drone and Pulse** to their own Kontakt tracks. **All parts** and **Export full song MIDI** write a Type 1 MIDI file with a tempo track, section markers and six instrument tracks. Stems contain tempo, meter, the full timeline and the original controller events. Use the shown tempo in Live for the selected clock duration.
4. For live listening, choose **Virtual MIDI to Live / Kontakt**. In Live's MIDI settings, enable Track for the six SongWave Frames inputs. Set each instrument track's MIDI From to its corresponding port and Monitor to In. Configure the Kontakt instrument to listen to the incoming channel or Omni. Start Live at bar 1, or stop its transport and audition from the plug-in. Save this routing in your Live Set. Switching to Sketch sounds stops routed playback when playing imported clips.

## Writing for each mood

| Theme | Piano and arrangement |
|---|---|
| Dark Score | Slow low pedal notes, restless minor harmony and ninths, slightly late answers, and space for a sustained lead. The dark-jazz and film-score references inform the pacing and orchestration. |
| Intimate Piano | Singing right hand over a close broken-chord figure. |
| Melancholic Strings | Chordal piano, falling answers and long upper string entries. |
| Nordic Suspense | Repeated bass notes, uneven gaps and short high replies. |
| Dreamlike Ambient | Suspended voicings and rising phrases against drifting textures. |
| Hypnotic Pulse | Asymmetric ostinato and selectively shortened pedalling. |
| Meditative Drift | Separated single notes and open bass intervals over slow harmony. |
| Cinematic Ascent | Wide broken figures, a gradual build, higher return and quieter coda. |

Simple, Expressive and Intricate alter the accompaniment, right-hand subdivision, and inner voices. Sparse piano leaves most bars to the other parts. No piano moves the melodic role to Lead. Each song starts from generated motifs, introduces a contrasting idea, and recalls the opening. Phrase timing, dynamics, note lengths and chord rolls are written into the MIDI. The offline engine uses compositional rules and separate random seeds for song and melody. It has no account, generation quota or model download.

## Sounds and performance

| Channel | Role | Start here |
|---|---|---|
| 1 | Piano | Pedal-responsive felt piano or soft upright. CC64 controls sustain and clears before changes and at the ending. |
| 2 | Lead | A playable Foundations source with a distinct attack. Try a breathy tone for Dark Score. |
| 3 | Strings | A sustained bowed sound or bowed texture from FRAMES. |
| 4 | Pad | A Designed snapshot with a slow attack and an audible mod-wheel transition. |
| 5 | Drone | A dark low sustained texture. Keep the movement restrained while the piano speaks. |
| 6 | Pulse | For a snapshot with its own movement, leave Hold notes enabled. Turn it off for short written notes on a static pluck. |

Set FRAMES MIDI assignments to **Snapshot** to use the designer's CC1 destinations. Each FRAMES lane gets its own mod-wheel curve with a different period and a depth control. The audible change depends on the selected snapshot. Use Kontakt with virtual MIDI to judge the actual sound. The internal sketch voice is a reference for notes and timing. Save project retains the generator settings and seeds. Save your instrument selections in Kontakt or the Live Set.

FRAMES terminology and control assignments follow the Void & Vista FRAMES User Guide v1.0. The motif and accompaniment workflow was informed by the Piano Motifs developer's description. The generator uses original rules and contains no reference-song MIDI, artist recordings or library samples.

[Void & Vista FRAMES](https://www.voidandvista.com/products/frames) · [Piano Motifs](https://apps.apple.com/gb/app/piano-motifs/id1506065573) · [Bohren interview](https://www.terrarelicta.com/Backup_Folder/index.php/feature-all/interviews/6692-bohren-der-club-of-gore-interview)
