#pragma once
#include <juce_audio_basics/juce_audio_basics.h>
#include "MidiTimeline.h"
#include "VirtualPorts.h"

class LiveMidi {
    enum { internal=0, vst=1, external=2 };
    juce::SpinLock lock;
    juce::CriticalSection configurationLock;
    VirtualPorts ports;
    MidiTimeline timeline;
    juce::String lastScore;
    std::array<int,lanes::count> desiredChannels{1,2,3,4,5,10},channels{1,2,3,4,5,10};
    int desired=internal,mode=internal,lastTransport=0;
    bool changed=true;
    double length=0;
    std::array<std::uint64_t,lanes::count> lastStamp{};
    static bool decode(const juce::String& encoded,MidiTimeline& track,double& total) {
        juce::MemoryOutputStream bytes;
        if(encoded.length()>1048576||!juce::Base64::convertFromBase64(bytes,encoded))return false;
        juce::MemoryInputStream in(bytes.getData(),bytes.getDataSize(),false);
        juce::MidiFile file;
        if(!file.readFrom(in,false)||file.getTimeFormat()!=480||file.getNumTracks()!=lanes::count+1)return false;
        for(int r=0;r<lanes::count;++r){
            std::array<double,128> starts;starts.fill(-1);
            std::array<int,128> velocities{};
            for(const auto* item:*file.getTrack(r+1)){
                const auto& m=item->message;const auto tick=m.getTimeStamp();
                if(m.isEndOfTrackMetaEvent())total=std::max(total,tick);
                if(!m.isNoteOn() && !m.isNoteOff())continue;
                const int pitch=m.getNoteNumber(),v=m.isNoteOn()?int(m.getVelocity()):0;
                if(v){starts[pitch]=tick;velocities[pitch]=v;}
                else if(starts[pitch]>=0){
                    track.spans.push_back({starts[pitch],tick,r,pitch,velocities[pitch]});starts[pitch]=-1;
                }
                track.events.push_back({tick,r,pitch,v});
            }
        }
        std::stable_sort(track.events.begin(),track.events.end(),[](const auto& a,const auto& b){
            return a.tick<b.tick || (a.tick==b.tick && a.velocity==0 && b.velocity!=0);});
        std::sort(track.spans.begin(),track.spans.end(),[](const auto& a,const auto& b){return a.begin<b.begin;});
        return total>0;
    }
    void send(int r,int pitch,int v,int offset,juce::MidiBuffer& out,std::uint64_t origin,double rate) {
        if(mode==vst){
            const juce::uint8 data[]={static_cast<juce::uint8>((v?0x90:0x80)+channels[r]-1),
                                      static_cast<juce::uint8>(pitch),static_cast<juce::uint8>(v)};
            out.addEvent(data,3,offset);
        } else if(mode==external){
            auto time=std::max(lastStamp[r],ports.timestamp(origin,offset,rate));
            ports.send(r,channels[r],pitch,v,time);lastStamp[r]=time;
        }
    }
public:
    std::atomic<int> portNumber{0};
    std::atomic<bool> routed{false},portError{false};
    void configure(const juce::var& state) {
        const juce::ScopedLock serial(configurationLock);
        const auto route=state["output"].toString();
        int requested=route=="virtual"?external:(route=="vst"?vst:internal);
        std::array<int,lanes::count> assigned{1,2,3,4,5,10};
        if(const auto* values=state["channels"].getArray(); values && values->size()==lanes::count){
            unsigned used=0;auto candidate=assigned;
            for(int r=0;r<lanes::count;++r){
                const int ch=values->getReference(r);
                if(ch<1||ch>16||(used&(1u<<ch)))break;
                candidate[r]=ch;used|=1u<<ch;
                if(r==lanes::count-1)assigned=candidate;
            }
        }
        if(requested==external && !ports.open(int(state["portSlot"])))requested=internal;
        portNumber.store(ports.slot);portError.store(route=="virtual"&&requested!=external);
        const auto encoded=state["midiData"].toString();
        const bool replace=requested!=internal && encoded!=lastScore;
        MidiTimeline next;double total=0;
        if(replace){if(!decode(encoded,next,total)){next.events.clear();next.spans.clear();total=0;}lastScore=encoded;}
        const juce::SpinLock::ScopedLockType guard(lock);
        if(replace){timeline.events.swap(next.events);timeline.spans.swap(next.spans);length=total;}
        changed|=replace||desired!=requested||desiredChannels!=assigned;
        desired=requested;desiredChannels=assigned;routed.store(desired!=internal);
    }
    // Each block uses either the host's PPQ position or the explicitly requested preview range.
    void block(juce::MidiBuffer& out,int samples,double rate,double bpm,int transport,double tick,double limit,int mask,bool offline){
        const juce::SpinLock::ScopedTryLockType guard(lock);
        if(!guard.isLocked()||rate<=0)return;
        const auto now=mach_absolute_time();
        auto emit=[&](int r,int p,int v,int offset){send(r,p,v,offset,out,now,rate);};
        if(changed||lastTransport!=transport){timeline.release(emit);mode=desired;channels=desiredChannels;changed=false;}
        lastTransport=transport;
        if(!transport||mode==internal||(offline&&mode==external)){timeline.release(emit);return;}
        timeline.render(tick,480.0*bpm/(60.0*rate),samples,std::min(limit,length),mask,emit);
    }
    void suspend(){
        const juce::SpinLock::ScopedLockType guard(lock);
        if(mode==external){
            auto now=mach_absolute_time();
            timeline.release([&](int r,int n,int,int){ports.send(r,channels[r],n,0,std::max(now,lastStamp[r]));});
        }
        // A VST host can only receive its pending releases in a process callback.
        changed=true;
    }
    ~LiveMidi(){suspend();}
};
