// This runs against the plug-in's shared processor code on a real macOS runner.
#include <juce_audio_processors/juce_audio_processors.h>
#include "../src/VirtualPorts.h"
#include <atomic>
#include <iostream>
#include <stdexcept>

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter();
static void check(bool ok,const char* msg){if(!ok)throw std::runtime_error(msg);}

struct Transport final : juce::AudioPlayHead {
    PositionInfo position;
    juce::Optional<PositionInfo> getPosition() const override {return position;}
};
static juce::var state(const char* mode){
    using namespace juce;
    MidiFile file;file.setTicksPerQuarterNote(480);
    for(int i=-1;i<6;++i){
        MidiMessageSequence t;
        if(i>=0){
            t.addEvent(MidiMessage::noteOn(i+1,60+i,(uint8)100).withTimeStamp(1+i));
            t.addEvent(MidiMessage::noteOff(i+1,60+i).withTimeStamp(48));
        }
        t.addEvent(MidiMessage::endOfTrack().withTimeStamp(1920));file.addTrack(t);
    }
    MemoryOutputStream bytes;check(file.writeTo(bytes),"write fixture MIDI");
    auto v=JSON::parse(R"({"channels":[8,9,10,11,12,13],"mute":[false,false,false,false,false,false],"solo":[false,false,false,false,false,false]})");
    v.getDynamicObject()->setProperty("output",mode);
    v.getDynamicObject()->setProperty("midiData",Base64::toBase64(bytes.getData(),bytes.getDataSize()));
    return v;
}
static void restore(juce::AudioProcessor& p,const juce::var& state){
    const auto s=juce::JSON::toString(state,true);
    p.setStateInformation(s.toRawUTF8(),int(s.getNumBytesAsUTF8()));
}
struct MidiReader {
    MIDIClientRef client=0;MIDIPortRef input=0;
    std::atomic<unsigned> on{0},off{0},wrong{0};
    static void receive(const MIDIPacketList* packets,void* context,void* source){
        auto& self=*static_cast<MidiReader*>(context);
        const int lane=int(reinterpret_cast<intptr_t>(source))-1;
        auto* packet=&packets->packet[0];
        for(UInt32 i=0;i<packets->numPackets;i++,packet=MIDIPacketNext(packet)){
            for(unsigned j=0;j+2<packet->length;j+=3){
                const auto* d=packet->data+j;
                if((d[0]&15)!=lane+7 || d[1]!=60+lane){self.wrong.fetch_or(1u<<lane);continue;}
                if((d[0]&0xf0)==0x90 && d[2]==100)self.on.fetch_or(1u<<lane);
                if((d[0]&0xf0)==0x80 || ((d[0]&0xf0)==0x90 && !d[2]))self.off.fetch_or(1u<<lane);
            }
        }
    }
    explicit MidiReader(int slot){
        check(MIDIClientCreate(CFSTR("Songweave routing test receiver"),nullptr,nullptr,&client)==noErr,"receiver client");
        check(MIDIInputPortCreate(client,CFSTR("Read notes"),receive,this,&input)==noErr,"receiver port");
        const char* parts[]={"Melody","Chords","Bass","Arp","Response","Drums"};
        for(int r=0;r<6;++r){
            MIDIObjectRef ref=0;MIDIObjectType type=kMIDIObjectType_Other;
            check(MIDIObjectFindByUniqueID(0x53500000+slot*6+r,&ref,&type)==noErr,"published endpoint ID");
            CFStringRef name=nullptr;
            check(MIDIObjectGetStringProperty(ref,kMIDIPropertyDisplayName,&name)==noErr && name,"endpoint display name");
            char buf[512]{};CFStringGetCString(name,buf,sizeof(buf),kCFStringEncodingUTF8);CFRelease(name);
            check(VirtualPorts::prefix(slot)+" "+parts[r]==buf,"named port");
            check(MIDIPortConnectSource(input,ref,reinterpret_cast<void*>(intptr_t(r+1)))==noErr,"attach receiver");
        }
    }
    ~MidiReader(){if(input)MIDIPortDispose(input);if(client)MIDIClientDispose(client);}
    void wait(const std::atomic<unsigned>& bits){
        for(int i=0;i<100 && bits.load()!=63;++i)CFRunLoopRunInMode(kCFRunLoopDefaultMode,.01,false);
        check(bits.load()==63 && !wrong.load(),"all six lanes received on correct port/channel/pitch");
    }
};
int main(){
    using namespace juce;
    try{
        ScopedJuceInitialiser_GUI gui;
        Transport host;host.position.setBpm(120);
        std::unique_ptr<AudioProcessor> processor(createPluginFilter());
        processor->setPlayHead(&host);processor->setRateAndBufferSizeDetails(48000,512);processor->prepareToPlay(48000,512);
        check(processor->producesMidi(),"VST3 MIDI output advertised");
        MidiBuffer output;AudioBuffer<float> audio(2,512);
        auto block=[&](double tick,bool play){
            host.position.setPpqPosition(tick/480.);host.position.setIsPlaying(play);
            output.clear();processor->processBlock(audio,output);
        };
        auto notes=[&](bool on,bool exactOffsets){
            unsigned lanes=0;
            for(auto e:output){auto m=e.getMessage();check(on?m.isNoteOn():m.isNoteOff(),"correct event kind");
                int r=m.getChannel()-8;check(r>=0 && r<6 && m.getNoteNumber()==60+r,"independent channel assignment");
                if(exactOffsets)check(e.samplePosition==(r+1)*50,"sample accurate VST3 start");
                lanes|=1u<<r;
            }
            check(lanes==63 && output.getNumEvents()==6,"exactly one event per lane");
        };
        restore(*processor,state("vst"));
        block(0,true);notes(true,true);block(10.24,false);notes(false,false);
        block(22,true);notes(true,false);block(0,true);
        check(output.getNumEvents()==12,"loop sends releases before new notes");
        block(10.24,false);notes(false,false);
        restore(*processor,state("virtual"));
        MemoryBlock saved;processor->getStateInformation(saved);
        auto persisted=JSON::parse(String::fromUTF8((const char*)saved.getData(),int(saved.getSize())));
        const int slot=persisted["portSlot"];check(slot>0,"virtual port slot saved");
        MidiReader reader(slot);
        VirtualPorts second;check(second.open(slot)&&second.slot!=slot,"duplicate instances have separate port names");
        block(0,true);check(output.isEmpty(),"virtual mode does not double-send VST notes");reader.wait(reader.on);
        block(10.24,false);reader.wait(reader.off);
        processor->releaseResources();processor.reset();
        std::unique_ptr<AudioProcessor> recalled(createPluginFilter());restore(*recalled,persisted);
        MemoryBlock again;recalled->getStateInformation(again);
        check(int(JSON::parse(String::fromUTF8((const char*)again.getData(),int(again.getSize())))["portSlot"])==slot,"port identity survives Set restore");
        std::cout<<"PASS: VST3 channel mapping, sample offsets, transport stop/seek/loop, editor-closed playback, six named CoreMIDI loopbacks, unique instances and port recall.\n";
    } catch(const std::exception& e){std::cerr<<e.what()<<"\n";return 1;}
}
