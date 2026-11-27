#pragma once
#include <CoreMIDI/CoreMIDI.h>
#include <mach/mach_time.h>
#include <array>
#include <cstdint>
#include <cstdio>
#include <string>
#include "Lanes.h"

// Five real CoreMIDI sources. Stable endpoint IDs let Live reconnect after
// reopening a Set. Concurrent instances claim independent sets of IDs.
class VirtualPorts {
    MIDIClientRef client=0;
    std::array<MIDIEndpointRef,lanes::count> sources{};
    double ticksPerSecond=0;
    void discardSources() {
        for(auto& source:sources)if(source){MIDIEndpointDispose(source);source=0;}
    }
public:
    int slot=0;
    VirtualPorts() {
        mach_timebase_info_data_t timebase{};
        mach_timebase_info(&timebase);
        ticksPerSecond=1.0e9*timebase.denom/timebase.numer;
    }
    VirtualPorts(const VirtualPorts&)=delete;
    ~VirtualPorts(){discardSources();if(client)MIDIClientDispose(client);}
    static std::string prefix(int index) {return index<=1?"SongWave Synthpop 80":"SongWave Synthpop 80 "+std::to_string(index);}
    bool open(int preferred=1) {
        if(slot)return true;
        if(!client){
            const auto status=MIDIClientCreate(CFSTR("SongWave Synthpop 80 MIDI"),nullptr,nullptr,&client);
            if(status!=noErr){std::fprintf(stderr,"SongWave Synthpop 80 MIDI client: %d\n",int(status));return false;}
        }
        if(preferred<1||preferred>128)preferred=1;
        for(int pass=0;pass<=128;++pass){
            const int number=pass==0?preferred:pass;
            if(pass!=0&&number==preferred)continue;
            const MIDIUniqueID base=lanes::portBase+number*lanes::count;
            bool free=true;
            for(int r=0;r<lanes::count;++r){MIDIObjectRef ref=0;MIDIObjectType type=kMIDIObjectType_Other;
                if(MIDIObjectFindByUniqueID(base+r,&ref,&type)==noErr)free=false;}
            if(!free)continue;
            for(int r=0;r<lanes::count;++r){
                const auto name=prefix(number)+" "+lanes::names[r];
                const auto cf=CFStringCreateWithCString(nullptr,name.c_str(),kCFStringEncodingUTF8);
                auto err=MIDISourceCreateWithProtocol(client,cf,kMIDIProtocol_1_0,&sources[r]);
                const char* operation="create source";
                if(err==noErr){
                    operation="set endpoint ID";err=MIDIObjectSetIntegerProperty(sources[r],kMIDIPropertyUniqueID,base+r);
                }
                // CoreMIDI derives displayName from the endpoint name. Some servers expose it read-only.
                if(err==noErr)MIDIObjectSetStringProperty(sources[r],kMIDIPropertyName,cf);
                CFRelease(cf);
                if(err!=noErr){std::fprintf(stderr,"SongWave Synthpop 80 %s (%s): %d\n",operation,name.c_str(),int(err));discardSources();return false;}
            }
            slot=number;return true;
        }
        std::fprintf(stderr,"SongWave Synthpop 80: no free MIDI port IDs.\n");return false;
    }
    MIDIEndpointRef endpoint(int lane) const {return sources[lane];}
    std::uint64_t timestamp(std::uint64_t origin,int offset,double rate) const {
        return origin+static_cast<std::uint64_t>(offset*ticksPerSecond/rate);
    }
    void send(int lane,int channel,int pitch,int velocity,std::uint64_t time) const {
        if(!sources[lane])return;
        MIDIEventList list{};
        auto* packet=MIDIEventListInit(&list,kMIDIProtocol_1_0);
        const UInt32 word=0x20000000u | (UInt32((velocity?0x90:0x80)+channel-1)<<16)
                          | (UInt32(pitch)<<8) | UInt32(velocity);
        MIDIEventListAdd(&list,sizeof(list),packet,time,1,&word);
        MIDIReceivedEventList(sources[lane],&list);
    }
};
