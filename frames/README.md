# SongWave Frames

A macOS VST3 instrument and standalone MIDI composer for Void & Vista FRAMES in Kontakt 8. Open the Mac installer, then find SongWave Frames under VST3 in Ableton Live 12. The installer targets Apple silicon and Intel on macOS 13 or later. The app is installed in Applications. Kontakt, FRAMES and an acoustic piano instrument are supplied by the musician.

## Version 1.1

Choose any duration from 1 to 60 minutes. Generate & play starts the built-in soft piano and atmospheric ensemble immediately. The piano roll shows the entire arrangement or one instrument. Choose a section, switch to 4, 16 or 64 bars, and use the arrows to move through it. Lane names select their notes. Empty lanes say No notes and have disabled MIDI export and drag handles.

Sound movement has a musical default on every atmospheric part. Raise it for a wider change of tone. It controls brightness in the built-in instruments and sends CC1 to Kontakt. Switch FRAMES to Snapshot MIDI assignments. Other Kontakt instruments need a patch or modulation assignment that responds to CC1. Piano pedal is automatic. Using Live note names, the drone stays at or above C1 (MIDI 36) and all notes stay at or above C0 (MIDI 24).

The theme menu includes composer inspirations. Each has its own interval choices, harmonic families, attack rhythm and pacing. Orchestration and the proportions of the opening, development and return vary. The Tiersen-inspired setting also exports in 3/4. These profiles use original compositional rules informed by listening descriptions, interviews and score analysis. No model was trained on reference recordings or MIDI.

Research included [Troels Hammer](https://banbantonton.com/2024/06/11/troels-hammer-the-old-north-trail-music-for-dreams/), [Armand Amar](https://www.cinemaradio.net/news/rencontre-avec-armand-amar-le-pouvoir-mystique-de-la-musique-me-fascine-693), [Yann Tiersen](https://www.thepianonotes.com/wp-content/uploads/2022/12/L_autre-valse-d_Amelie-Sheet-Music-Yann-Tiersen-thepianonotes.com_.pdf), [Nils Frahm](https://www.nilsfrahm.com/about/), [Dustin O’Halloran](https://dustinohalloran.com/works/solo/), [Alexandre Desplat](https://laist.com/shows/the-frame/alexandre-desplat-on-scoring-the-imitation-game-and-fighting-composers-block), [Johan Söderqvist](https://www.maintitles.net/features/interviews/johan-soderqvist/), and [Mychael Danna](https://www.popdisciple.com/interviews/mychael-danna).

## First song

1. Select Dark Score, Piano-led, Expressive and a duration. Generate song changes the key, harmony, tempo, phrase material and section lengths according to the theme. A new generation may share individual choices with an earlier one.
2. Click Preview to listen again. Choose a section to hear the development or return. Generate & hear melody auditions up to 30 seconds of a fresh take over the current backing. Previous take and Replay let you compare. Use in song applies the new melody throughout. Undo brings back the previous arrangement.
3. Drag **Piano** from the bottom bar to a piano track in Arrangement View. Drag **Lead, Strings, Pad, Drone and Pulse** to their own Kontakt tracks. **All parts** and **Export full song MIDI** write a Type 1 MIDI file with a tempo track, section markers and six instrument tracks. Stems contain tempo, meter, the full timeline and the original controller events. Use the shown tempo in Live for the selected clock duration.
4. For live listening, choose **Virtual MIDI to Live / Kontakt**. In Live's MIDI settings, enable Track for the six SongWave Frames inputs. Set each instrument track's MIDI From to its corresponding port and Monitor to In. Configure the Kontakt instrument to listen to the incoming channel or Omni. Start Live at bar 1, or stop its transport and audition from the plug-in. Save this routing in your Live Set. Switching to Built-in piano & ensemble stops routed playback when playing imported clips.

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

Set FRAMES MIDI assignments to **Snapshot** to use the designer's CC1 destinations. Each FRAMES lane gets its own mod-wheel curve with a different period and a depth control. The audible change depends on the selected snapshot. Use Kontakt with virtual MIDI to judge the actual sound. The built-in ensemble uses synthesized instruments and room ambience. Save project retains the generator settings and seeds. Save your instrument selections in Kontakt or the Live Set.

FRAMES terminology and control assignments follow the Void & Vista FRAMES User Guide v1.0. The motif and accompaniment workflow was informed by the Piano Motifs developer's description. The generator uses original rules and contains no reference-song MIDI, artist recordings or library samples.

[Void & Vista FRAMES](https://www.voidandvista.com/products/frames) · [Piano Motifs](https://apps.apple.com/gb/app/piano-motifs/id1506065573) · [Bohren interview](https://www.terrarelicta.com/Backup_Folder/index.php/feature-all/interviews/6692-bohren-der-club-of-gore-interview)
