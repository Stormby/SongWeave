#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "Lanes.h"

struct LaneEvent { double tick; int lane, pitch, velocity; };
struct HeldSpan { double begin, end; int lane, pitch, velocity; };

// All tick values are quarter notes * 480. The sink receives lane, pitch,
// velocity (zero means release), and sample index within the current block.
class MidiTimeline {
    std::array<std::array<bool,128>,lanes::count> down {};
    bool running = false;
    double expected = 0;
    size_t cursor = 0;
    int lastMask = lanes::all;
public:
    std::vector<LaneEvent> events;
    std::vector<HeldSpan> spans;

    template<typename Send> void release(Send send, int offset = 0) {
        for (int lane=0; lane<lanes::count; ++lane)
            for (int n=0; n<128; ++n) if (down[lane][n]) {
                send(lane,n,0,offset); down[lane][n]=false;
            }
        running=false;
    }
    template<typename Send> void render(double begin, double step, int samples, double limit, int mask, Send send) {
        if (samples<=0 || step<=0 || begin>=limit) { release(send); return; }
        // Transport jumps, including loop wraps, must release old notes and
        // reconstruct sustained notes at the new position.
        const bool jump=!running || std::abs(begin-expected)>step*1.1;
        if (jump) {
            release(send);
            cursor=size_t(std::lower_bound(events.begin(),events.end(),begin,
                [](const LaneEvent& e,double t){return e.tick<t;})-events.begin());
        } else begin=expected;
        const int chase=jump?mask:(mask & ~lastMask);
        if (!jump && lastMask!=mask) {
            for(int r=0;r<lanes::count;++r) if(!(mask & (1<<r)) && (lastMask & (1<<r)))
                for(int n=0;n<128;++n) if(down[r][n]){send(r,n,0,0);down[r][n]=false;}
        }
        if(chase) for(const auto& n:spans){
            if(n.begin>=begin)break;
            if(n.end>begin && (chase & (1<<n.lane))){
                send(n.lane,n.pitch,n.velocity,0);down[n.lane][n.pitch]=true;
            }
        }
        lastMask=mask;running=true;
        expected=begin+samples*step;
        const double end=std::min(expected,limit);
        while(cursor<events.size() && events[cursor].tick<end){
            const auto& e=events[cursor++]; auto& held=down[e.lane][e.pitch];
            if(!(mask & (1<<e.lane)) || (!e.velocity && !held))continue;
            const auto offset=std::clamp(int(std::llround((e.tick-begin)/step)),0,samples-1);
            send(e.lane,e.pitch,e.velocity,offset); held=e.velocity!=0;
        }
        if(expected>limit)release(send,std::clamp(int(std::ceil((limit-begin)/step)),0,samples-1));
    }
};
