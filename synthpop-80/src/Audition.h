#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>

// Host-independent preview voice engine. Render is called with exclusive access.
// Notes and lengths use 480 ticks per quarter, as in the exported MIDI file.
struct PreviewNote { double tick, duration; int pitch, velocity, part, drum; };

class Audition {
    struct Voice {
        double phase = 0, step = 0, amp = 0, end = 0, age = 0, release = 1;
        int part = 0;
        bool on = false;
        int drum=0;
    };
    std::array<Voice, 48> voices {};
    std::vector<PreviewNote> score;
    unsigned noise=17771;
    size_t next = 0;
    double length = 0;
    void startVoice(const PreviewNote& note, double rate) {
        auto it = std::find_if(voices.begin(), voices.end(), [](const Voice& v){ return !v.on; });
        if (it == voices.end()) it = std::min_element(voices.begin(), voices.end(),
            [](const Voice& a, const Voice& b){ return a.end < b.end; });
        constexpr double levels[] = {.13,.055,.17,.075,.11,.18};
        *it = {0, 440.0 * std::pow(2.0, (note.pitch-69)/12.0) / rate,
               levels[note.part] * note.velocity / 127., note.tick + note.duration, 0, 1, note.part, true, note.drum};
    }
public:
    bool playing = false;
    double tick = 0;
    void start(std::vector<PreviewNote>& notes, double total) {
        stop(); score.swap(notes); length = total; next = 0; tick = 0; playing = length > 0;
    }
    void stop() { playing = false; for (auto& v : voices) v.on = false; }
    void render(float* left, float* right, int samples, double rate, double bpm, int mask) {
        if (!playing || rate <= 0) return;
        const double ticksPerSample = bpm * 480.0 / (60.0 * rate);
        const double releaseStep = 1.0 / (.045 * rate);
        constexpr double attack[] = {.009, .075, .006, .004, .005,.001};
        constexpr double pans[] = {.5, .43, .50, .37, .67,.50};
        for (int i = 0; i < samples; ++i) {
            while (next < score.size() && score[next].tick <= tick) {
                const auto& n = score[next++];
                if (mask & (1 << n.part)) startVoice(n, rate);
            }
            float l = 0, r = 0;
            bool ringing = false;
            for (auto& v : voices) {
                if (!v.on) continue;
                if (tick >= v.end || !(mask & (1 << v.part)) || v.release < 1) {
                    v.release -= releaseStep;
                    if (v.release <= 0) { v.on = false; continue; }
                }
                ringing = true;
                constexpr double tau=6.283185307179586;
                const auto phase=tau*v.phase;
                const double brightness=std::exp(-v.age*(v.part==3?9.0:3.0));
                const double harmonic=v.part==2?.14:(v.part==4?.58:.32);
                double wave=.78*std::sin(phase)+harmonic*brightness*std::sin(phase*(v.part==4?3:2));
                const double envelope=v.part==3||v.part==4?.35+.65*brightness:1;
                if(v.part==5){
                    const auto a=v.age;
                    if(v.drum==0||v.drum==5||v.drum==6){
                        const double f=v.drum==0?48:(v.drum==5?175:110);
                        wave=std::sin(tau*(f*a+2*(1-std::exp(-28*a))))*std::exp(-17*a);
                    }else{
                        noise=noise*1664525u+1013904223u;
                        wave=(double(noise)/2147483648.0-1)*std::exp(-(v.drum==3?65:v.drum==8?7:20)*a);
                    }
                }
                const double rise=attack[v.part];
                const auto value=wave*v.amp*std::min(1.0,v.age/rise)*envelope*v.release;
                l += float(value * (1-pans[v.part])); r += float(value * pans[v.part]);
                v.phase += v.step; v.phase -= std::floor(v.phase); v.age += 1.0/rate;
            }
            left[i] = l; right[i] = r;
            tick += ticksPerSample;
            if (tick >= length && !ringing) { playing = false; break; }
        }
    }
};
