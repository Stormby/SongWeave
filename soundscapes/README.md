# SongWave Soundscapes

A universal macOS 13+ VST3 and standalone hour-long MIDI composer for Engine Player 1.7. Choose the library first. Available styles and the instrument list update together. Each named lane maps to a separate Engine instance. Begin with an empty Arrangement and choose Virtual MIDI in SongWave. In Live, enable Track on the corresponding inputs, pick the matching port for each receiving track and set Monitor to In. Select the listed instrument or a patch from the listed category. Save the Live Set to keep the Engine patches. The installer contains SongWave only.

Each full MIDI file lasts 3,600 seconds at its embedded 60 BPM. Select a chapter to audition or drag ten minutes instead. For MIDI imported into Live set the Set to 60 BPM or accept the file tempo. Live transport streaming uses host timeline seconds when available. Sketch preview provides generic tones. Pad and drone expression is sent as CC11. For the tuned lead use equal temperament and a ±2-semitone bend range in Engine. Pitch-wheel bends and expression are carried by exported MIDI and live virtual ports. Select a playable sustain, use a neutral sample ornament setting, and adjust relative levels by ear. A patch that maps the pitch wheel to a different function needs its mapping changed before it can play written bends correctly.

## Palette and performance

| Style | Approach |
|---|---|
| Meditation | A familiar short motif returns with different spacing. Gentle swells and extended rests give it an ebb and flow. |
| Soundscapes | Long single tones leave room for the sampled layers to evolve. |
| Mystery | Close neighbour tones sound against a stable drone at a quiet dynamic. |
| Middle Eastern · Persian colour | Persian ney phrases lean into a lowered second before descending to the tonic. The 150-cent second is a performance approximation. Persian intonation varies by mode and performer. |
| Indian · Bhupali-inspired alap | Indian Low Bansuri plays Sa Re Ga Pa Dha over NADA’s Indian Tanpura Drones. Restricting the opening register and gliding into selected targets gives the piece direction without a beat. |
| Nordic bowed drone | Short bow cycles and a narrow melodic range work with Dark Era’s Big Tagelharpa and bone flute. |
| Irish slow air | A whistle, irregular phrase lengths, a momentary finger cut and a lengthened cadence. |
| Chinese bamboo air | Pentatonic wind phrases, an upper grace and space to breathe on dizi or xiao. |
| Earth & Drum | A cinematic hand-drum pulse gathers in the centre of the hour, leaving a quiet opening and ending. Set the Pulse trigger to a soft single hit in your patch. |
| Medieval chamber | A reed or flute-like line against open intervals, with an answering lute or voice. |
| Wordless vigil | Short repeated vowel lines with breathing rests. Vocal Codex offers Celtia and Bard here, with Medieval Tenor and Heroica for Mystery. |
| Resonant bowls | Long gaps around single strikes give NADA’s crystal bowls time to decay. |
| Woodland dusk | Sparse flute calls, harp and occasional resonant accents. |

The styles are original composition models. Bowing, temperament, ornament and note length are interpreted relative to the chosen instrument. Library or folder descriptions in the instrument list identify timbres to select when a patch family has several suitable options.

## Research behind the presets

The long-form design takes independent layer cycles and repeated material as its starting points. The six chapter markers are navigation points in a continuous score. Read [Brian Eno on generative composition](https://new.tapeop.com/interviews/85/brian-eno).

The Indian profile draws on Bhupali’s lower-register development, resting tones and approach to Ga. Pitch curves are authored approximations of meend. Read [Bhupali in the Hindustani Raga Index](https://ragajunglism.org/ragas/bhupali/) and [Raag Hindustani on ornament](https://raag-hindustani.com/Embellishment.html). For an example of how Persian inflection varies with melodic context, see [Encyclopaedia Iranica on Dašti](https://www.iranicaonline.org/articles/dasti-one-of-the-twelve-modal-systems/). The Persian colour profile does not claim to be a rendition of Dašti.

Library instrument and articulation references: [NADA](https://www.bestservice.com/en/nada.html), [Desert Winds manual](https://ms.bestservice.com/download_files.php/4169/en), [Ancient ERA Persia](https://www.bestservice.com/en/ancient_era_persia.html), [original Dark Era manual](https://www.asoundeffect.com/wp-content/uploads/2020/03/Dark-ERA-Manual.pdf), [Epic World](https://www.bestservice.com/en/epic_world.html), [ERA II Medieval Legends](https://www.bestservice.com/en/era_ii_medieval_legends.html), [Forest Kingdom 3](https://www.bestservice.com/en/forest_kingdom_3.html), and [ERA II Vocal Codex](https://www.bestservice.com/en/era_ii_vocal_codex.html).

## Melody workshop (1.1)

New projects open with a generated lead. Projects saved in 1.0 recall their original lead until a new one is applied. The backing library and style shape the five accompanying lanes. The independent melody-style list offers fourteen palettes with six playable leads each. Every option names the Engine library to load on the Melody track. Some are neighbouring timbres for a cinematic interpretation: for example, NADA’s Ethnic Violin can play a Nordic-inspired tune, alongside the more historically specific Swedish nyckelharpa.

Select a style, playable patch, phrasing and octave. Stop Live’s transport and click **Generate & hear 45 seconds**. Repeated clicks audition independent pitch-and-rhythm themes over the existing backing. **Previous melody** recalls earlier candidates in the session (up to 32). **Use for full hour** accepts the theme, which recurs with answers, rests and variations. Whole-hour playback, drag and export use the accepted version. Save the project or Live Set to recall it. Samples and Engine patch selection are managed inside each Engine instance.

The melody generator uses style-specific tonal anchors, phrase trajectories, cadences, rest distributions and articulations. Pitch bends use a two-semitone receiver range and include centre resets. Fixed neutral-scale-degree offsets (e.g. the lowered second in the Persian and Bayati palettes) are audible even on plucked instruments that receive no expressive scoop. Set Engine’s microtuning to equal temperament for the supplied MIDI tuning. The sizes of neutral intervals are expressive approximations. The Forest Kingdom Xiao uses finger ornaments because its wheel can be assigned to breath intensity. Octave changes transpose only Melody. Manual zones are distinguished from suggested composing registers. An octave override shifts the output beyond the base register when selected, so check the highlighted zone in the loaded patch.

The catalogue was checked against the supplied NADA, Ancient ERA Persia, Desert Winds, Dark ERA, Forest Kingdom 3, Epic World, ERA II Medieval Legends and ERA II Vocal Codex manuals. For Big and Small Tagelharpa it uses the documented legato zone at octave zero. The manuals describe recorded legato, pitch-wheel assignments, velocity layers and playable vs phrase patches. The generator uses sustain/legato patches, short overlaps on compatible neutral pitches, breath breaks and MIDI wheel curves; the written output is a playable interpretation of these instruments.

Musical references include [MaqamWorld on Jins Bayati](https://www.maqamworld.com/en/jins/bayati.php), [the Bhupali Raga Index](https://ragajunglism.org/ragas/bhupali/), [Svenskt visarkiv on pastoral calls and tunes](https://svensktvisarkiv.se/vara-genrer/folkmusik/vallmusik/dokumentation-och-forskning/), [the Irish Traditional Music Archive’s slow-air collection](https://www.itma.ie/scores/pob1246_itma0290337_052/), and [research on dizi fingering and articulation](https://www.bgsu.edu/content/dam/BGSU/musical-arts/documents/dma-documents/Chin-Hongda.pdf). Phrases are newly generated. Performance research informed the writing rules; SongWave does not transcribe or stream these references.
