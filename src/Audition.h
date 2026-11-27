#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>

// Host-independent preview voice engine. Render is called with exclusive access.
// Notes and lengths use 480 ticks per quarter, as in the exported MIDI file.
struct PreviewNote { double tick, duration; int pitch, velocity, part; };

class Audition {
    struct Voice {
        double phase = 0, step = 0, amp = 0, end = 0, age = 0, release = 1;
        int part = 0;
        bool on = false;
    };
    std::array<Voice, 48> voices {};
    std::vector<PreviewNote> score;
    size_t next = 0;
    double length = 0;
    void startVoice(const PreviewNote& note, double rate) {
        auto it = std::find_if(voices.begin(), voices.end(), [](const Voice& v){ return !v.on; });
        if (it == voices.end()) it = std::min_element(voices.begin(), voices.end(),
            [](const Voice& a, const Voice& b){ return a.end < b.end; });
        constexpr double levels[] = {.13,.066,.13,.081};
        *it = {0, 440.0 * std::pow(2.0, (note.pitch-69)/12.0) / rate,
               levels[note.part] * note.velocity / 127., note.tick + note.duration, 0, 1, note.part, true};
    }
public:
    enum class Colour { plain, noir, piano, strings };
    Colour colour = Colour::plain;
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
        constexpr double attack[] = {.012, .08, .014, .005};
        constexpr double pans[] = {.52, .43, .50, .62};
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
                const auto sine = std::sin(v.phase * 6.283185307179586);
                double wave = (v.part == 0 || v.part == 2)
                    ? .76*sine + .24*(1.0 - 4.0*std::abs(v.phase-.5)) : sine;
                double rise=attack[v.part], envelope=1;
                constexpr double tau=6.283185307179586;
                if(colour==Colour::noir){
                    const double phase=v.phase*tau;
                    wave=.72*sine+.19*std::sin(2*phase)+.09*std::sin(3*phase);
                    rise=v.part==3?.012:(v.part==2?.09:.27);
                    envelope=v.part==3?std::exp(-2.8*v.age):.90+.10*std::sin(1.8*v.age);
                }else if(colour==Colour::piano){
                    if(v.part==0||v.part==3){
                        const double partial=std::exp(-5*v.age);
                        wave=sine+.28*partial*std::sin(2*tau*v.phase)+.12*partial*std::sin(3*tau*v.phase);
                        envelope=std::exp(-(v.part==3?6.0:1.45)*v.age);
                        rise=.006;
                    }else rise=.20;
                }else if(colour==Colour::strings){
                    const double phase=tau*v.phase+.019*std::sin(30*v.age);
                    wave=.63*std::sin(phase)+.24*std::sin(2*phase)+.13*std::sin(3*phase);
                    rise=v.part==2?.16:.24;
                    envelope=.83+.17*std::min(1.0,v.age/.85);
                }
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
