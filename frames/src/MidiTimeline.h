#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "Lanes.h"

namespace performance {
    constexpr int bend=128, expression=129, wheel=130, pedal=131;
    constexpr int initial(int type){return type==bend?8192:type==expression?127:0;}
}
struct LaneEvent { double tick; int lane, pitch, velocity; };
struct HeldSpan { double begin, end; int lane, pitch, velocity; };

// All tick values are quarter notes * 480. The sink receives lane, pitch,
// velocity (zero means release), and sample index within the current block.
class MidiTimeline {
    std::array<std::array<bool,128>,lanes::count> down {};
    std::array<std::array<int,4>,lanes::count> controller{};
    bool running = false;
    double expected = 0;
    size_t cursor = 0;
    int lastMask = lanes::all;
public:
    MidiTimeline(){for(auto& c:controller)c={8192,127,0,0};}
    template<typename Send> void resetControl(int lane,Send send,int offset){
        for(int k=0;k<4;++k){
            const int id=performance::bend+k, initial=performance::initial(id);
            if(controller[lane][k]!=initial){send(lane,id,initial,offset);controller[lane][k]=initial;}
        }
    }
    std::vector<LaneEvent> events;
    std::vector<HeldSpan> spans;

    template<typename Send> void release(Send send, int offset = 0) {
        for (int lane=0; lane<lanes::count; ++lane)
            for (int n=0; n<128; ++n) if (down[lane][n]) {
                send(lane,n,0,offset); down[lane][n]=false;
            }
        for(int r=0;r<lanes::count;++r)resetControl(r,send,offset);
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
        if(!jump&&lastMask!=mask)for(int r=0;r<lanes::count;++r)
            if((lastMask&~mask)&(1<<r))resetControl(r,send,0);
        if(chase){
            unsigned need[lanes::count]{};
            for(int r=0;r<lanes::count;++r)if(chase&(1<<r))need[r]=15;
            for(size_t j=cursor;j>0;--j){
                const auto& e=events[j-1];if(e.pitch<performance::bend)continue;
                const int k=e.pitch-performance::bend;
                if(need[e.lane]&(1u<<k)){
                    send(e.lane,e.pitch,e.velocity,0);controller[e.lane][k]=e.velocity;
                    need[e.lane]&=~(1u<<k);
                }
            }
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
            const auto& e=events[cursor++];
            if(!(mask & (1<<e.lane)))continue;
            const auto offset=std::clamp(int(std::llround((e.tick-begin)/step)),0,samples-1);
            if(e.pitch>=performance::bend)controller[e.lane][e.pitch-performance::bend]=e.velocity;
            else{
                auto& held=down[e.lane][e.pitch];
                if(!e.velocity&&!held)continue;
                held=e.velocity!=0;
            }
            send(e.lane,e.pitch,e.velocity,offset);
        }
        if(expected>limit)release(send,std::clamp(int(std::ceil((limit-begin)/step)),0,samples-1));
    }
};
