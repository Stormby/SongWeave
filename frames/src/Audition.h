#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>

// Host-independent preview voice engine. Render is called with exclusive access.
// Notes and lengths use 480 ticks per quarter, as in the exported MIDI file.
struct PreviewNote { double tick, duration; int pitch, velocity, part, drum; double cents,slide; };

struct ToneChange { double tick; int lane; double value; };

class Audition {
    struct Voice {
        double phase = 0, step = 0, amp = 0, end = 0, age = 0, release = 1;
        int part = 0;
        bool on = false;
        int drum=0; double slide=0,glideTime=.65;
    };
    std::array<Voice, 48> voices {};
    std::vector<PreviewNote> score;
    std::array<double,6> movement{};
    std::vector<ToneChange> changes;
    size_t nextChange=0;
    std::array<float,2049> sine{};
    double tone(double phase) const {
        const double index=(phase-std::floor(phase))*2048;
        const auto i=static_cast<size_t>(index);
        return sine[i]+(index-i)*(sine[i+1]-sine[i]);
    }
    size_t next = 0;
    double length = 0;
    void startVoice(const PreviewNote& note, double rate) {
        auto it = std::find_if(voices.begin(), voices.end(), [](const Voice& v){ return !v.on; });
        if (it == voices.end()) it = std::min_element(voices.begin(), voices.end(),
            [](const Voice& a, const Voice& b){ return a.end < b.end; });
        constexpr double levels[] = {.29,.14,.15,.11,.12,.16};
        *it = {0, 440.0 * std::pow(2.0, (note.pitch-69+note.cents/100)/12.0) / rate,
               levels[note.part] * note.velocity / 127., note.tick + note.duration, 0, 1, note.part, true, note.drum,note.slide,std::min(.65,note.duration*.45/480.0)};
    }
public:
    Audition(){for(size_t i=0;i<sine.size();++i)sine[i]=float(std::sin(i*6.283185307179586/2048));}
    bool playing = false;
    double tick = 0;
    void start(std::vector<PreviewNote>& notes, double total, std::vector<ToneChange>& controls) {
        stop(); changes.swap(controls); nextChange=0; movement.fill(0); score.swap(notes); length = total; next = 0; tick = 0; playing = length > 0;
    }
    void stop() { playing = false; for (auto& v : voices) v.on = false; }
    void render(float* left, float* right, int samples, double rate, double bpm, int mask) {
        if (!playing || rate <= 0) return;
        const double ticksPerSample = bpm * 480.0 / (60.0 * rate);
        const double releaseSeconds[]={.22,.16,.32,.48,.37,.12};
        constexpr double attack[] = {.004,.10,.22,.42,.32,.012};
        constexpr double pans[] = {.5, .43, .50, .37, .67,.50};
        for (int i = 0; i < samples; ++i) {
            while(nextChange<changes.size()&&changes[nextChange].tick<=tick){
                const auto& c=changes[nextChange++];movement[c.lane]=c.value;
            }
            while (next < score.size() && score[next].tick <= tick) {
                const auto& n = score[next++];
                if (mask & (1 << n.part)) startVoice(n, rate);
            }
            float l = 0, r = 0;
            bool ringing = false;
            for (auto& v : voices) {
                if (!v.on) continue;
                if (tick >= v.end || !(mask & (1 << v.part)) || v.release < 1) {
                    v.release -= 1.0/(releaseSeconds[v.part]*rate);
                    if (v.release <= 0) { v.on = false; continue; }
                }
                ringing = true;
                const double phase=v.phase, colour=movement[v.part], fundamental=tone(phase);
                double wave=fundamental, envelope=1;
                if(v.part==0){
                    const double hammer=std::exp(-v.age*5.3);
                    wave=.76*fundamental+.23*tone(2.001*phase+v.age*.14)+.10*hammer*tone(3*phase)+.045*hammer*tone(5*phase);
                    envelope=.62*std::exp(-v.age*2.2)+.38*std::exp(-v.age*.46);
                }else if(v.part==5){
                    wave=.74*fundamental+(.12+.2*colour)*tone(phase*3)+.12*tone(phase*4);
                    envelope=.88*std::exp(-v.age*3.4)+.12*std::exp(-v.age*.8);
                }else{
                    const double spread=v.part==2?.37:v.part==3?.21:.10;
                    const double drift=phase+.007*tone(v.age*(v.part==1?4.2:.56));
                    wave=.54*tone(drift)+.26*tone(drift+v.age*spread)
                        +(.10+.18*colour)*tone(2*drift)+(.035+.11*colour)*tone(3*drift);
                    envelope=.86+.14*tone(v.age*.24+v.part*.17);
                }
                const double rise=attack[v.part];
                const auto value=wave*v.amp*std::min(1.0,v.age/rise)*envelope*v.release;
                l += float(value * (1-pans[v.part])); r += float(value * pans[v.part]);
                const auto remain=std::max(0.0,1.0-v.age/v.glideTime);
                v.phase += v.step*(v.slide&&remain?std::exp2(v.slide*remain*remain/1200.):1.); v.phase -= std::floor(v.phase); v.age += 1.0/rate;
            }
            left[i] = l; right[i] = r;
            tick += ticksPerSample;
            if (tick >= length && !ringing) { playing = false; break; }
        }
    }
};
