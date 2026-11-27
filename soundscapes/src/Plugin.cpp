#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include <BinaryData.h>
#include <atomic>
#include <cstring>
#include "Audition.h"
#include "LiveMidi.h"

namespace {
using namespace juce;
var object(std::initializer_list<std::pair<Identifier,var>> entries) {
    auto result = std::make_unique<DynamicObject>();
    for (const auto& [key,value] : entries) result->setProperty(key, value);
    return var(result.release());
}

class Composer final : public AudioProcessor {
    SpinLock playbackLock;
    CriticalSection stateLock;
    String savedState;
    Audition audition;
    std::atomic<int> mask {lanes::all};
    double previewBpm = 90, previewFrom = 0, previewEnd = 0;
    bool followHost = true;
public:
    LiveMidi midi;
    std::atomic<double> hostBpm {0}, progress {0};
    std::atomic<bool> active {false};
    std::atomic<unsigned> restored {0};
    File dragFolder = File::getSpecialLocation(File::tempDirectory).getChildFile("SongWave Soundscapes-" + Uuid().toString());

    Composer() : AudioProcessor(BusesProperties().withOutput("Preview", AudioChannelSet::stereo(), true)) {}
    ~Composer() override { dragFolder.deleteRecursively(); }
    const String getName() const override { return "SongWave Soundscapes"; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return true; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return .05; }
    bool isBusesLayoutSupported(const BusesLayout& layout) const override {
        return layout.getMainOutputChannelSet() == AudioChannelSet::stereo();
    }
    void prepareToPlay(double, int) override { stop(); }
    void releaseResources() override { stop(); midi.suspend(); }
    void stop() {
        SpinLock::ScopedLockType guard(playbackLock);
        audition.stop(); active.store(false);
    }
    void start(const var& msg) {
        std::vector<PreviewNote> notes;
        if (const auto* events = msg["events"].getArray()) {
            notes.reserve(size_t(events->size()));
            for (const auto& n : *events) {
                int part = n["r"], pitch = n["n"], velocity = n["v"];
                double t = n["t"], d = n["d"];
                if (isPositiveAndBelow(part, lanes::count) && isPositiveAndBelow(pitch,128) && velocity > 0 &&
                    velocity <= 127 && t >= 0 && d > 0) notes.push_back({t,d,pitch,velocity,part,int(n["k"]),double(n["cents"]),double(n["slide"])});
            }
        }
        std::stable_sort(notes.begin(), notes.end(), [](const auto& a, const auto& b){ return a.tick < b.tick; });
        {
            SpinLock::ScopedLockType guard(playbackLock);
            previewFrom = double(msg["from"]); previewEnd = previewFrom + double(msg["length"]);
            previewBpm = jlimit(20.,400.,double(msg["bpm"])); followHost = bool(msg["sync"]);
            mask.store(int(msg["mask"]) & lanes::all); audition.start(notes, double(msg["length"]));
            progress.store(0); active.store(audition.playing);
        }
    }
    void setMask(int bits) { mask.store(bits & lanes::all); }
    void processBlock(AudioBuffer<float>& output, MidiBuffer& input) override {
        ScopedNoDenormals guard;
        input.clear(); output.clear();
        double tempo=0, hostTick=0;
        bool transport=false;
        if(auto* head=getPlayHead())if(const auto pos=head->getPosition()){
            if(const auto value=pos->getBpm())tempo=*value;
            if(const auto ppq=pos->getPpqPosition()){
                hostTick=*ppq*480.0*60.0/(tempo>0?tempo:60.0);
                if(auto seconds=pos->getTimeInSeconds())hostTick=*seconds*480.0;transport=pos->getIsPlaying() && std::isfinite(hostTick);
            }
        }
        if(!std::isfinite(tempo)||tempo<=0)tempo=0;
        hostBpm.store(tempo);
        int source=0;
        double tick=0,limit=std::numeric_limits<double>::max(),rate=getSampleRate(),speed=60;
        const bool routing=midi.routed.load();
        {
            SpinLock::ScopedTryLockType lock(playbackLock);
            if(lock.isLocked() && transport && routing && audition.playing){audition.stop();active.store(false);}
            if(transport && routing){source=1;tick=hostTick;}
            else if(lock.isLocked() && audition.playing && output.getNumChannels()>=2){
                source=2; tick=previewFrom+audition.tick; limit=previewEnd;
                speed=followHost && tempo>0?tempo:previewBpm;
                audition.render(output.getWritePointer(0),output.getWritePointer(1),output.getNumSamples(),rate,speed,mask.load());
                if(routing)output.clear();
                progress.store(audition.tick);active.store(audition.playing);
            }
        }
        midi.block(input,output.getNumSamples(),rate,speed,source,tick,limit,mask.load(),isNonRealtime());
    }
    String state() { ScopedLock lock(stateLock); return savedState; }
    void edit(const String& value) {
        { ScopedLock lock(stateLock); if (savedState == value) return; savedState = value; }
        const auto parsed=JSON::parse(value);
        configureMidi(parsed);
        updateHostDisplay(ChangeDetails().withNonParameterStateChanged(true));
    }
    void configureMidi(const var& parsed) {
        midi.configure(parsed);
        int bits=lanes::all;
        const auto* solo=parsed["solo"].getArray();const auto* mute=parsed["mute"].getArray();
        if(solo && mute && solo->size()==lanes::count && mute->size()==lanes::count){
            const bool any=std::any_of(solo->begin(),solo->end(),[](const var& v){return bool(v);});
            bits=0;for(int r=0;r<lanes::count;++r)if(!bool(mute->getReference(r))&&(!any||bool(solo->getReference(r))))bits|=1<<r;
        }
        setMask(bits);
    }
    void getStateInformation(MemoryBlock& dest) override {
        auto s = state();
        if(midi.portNumber.load()>0){
            auto parsed=JSON::parse(s);
            if(auto* obj=parsed.getDynamicObject()){obj->setProperty("portSlot",midi.portNumber.load());s=JSON::toString(parsed,true);}
        } dest.setSize(s.getNumBytesAsUTF8());
        if (dest.getSize()) std::memcpy(dest.getData(), s.toRawUTF8(), dest.getSize());
    }
    void setStateInformation(const void* data, int size) override {
        if (size <= 0 || size > 2097152) return;
        const auto s = String::fromUTF8(static_cast<const char*>(data),size);
        const auto parsed=JSON::parse(s); if (!parsed.isObject()) return;
        stop();
        { ScopedLock lock(stateLock); savedState = s; ++restored; }
        configureMidi(parsed);
    }
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const String getProgramName(int) override { return {}; }
    void changeProgramName(int,const String&) override {}
    bool hasEditor() const override { return true; }
    AudioProcessorEditor* createEditor() override;
};

class LocalView final : public WebBrowserComponent {
public:
    using WebBrowserComponent::WebBrowserComponent;
    bool pageAboutToLoad(const String& url) override {
        return url == "about:blank" || url == getResourceProviderRoot();
    }
};

struct ExportFile { String name; MemoryBlock bytes; };

class DragHandle final : public TextButton {
    bool started = false;
public:
    std::function<void(Component*)> drag;
    void mouseDown(const MouseEvent& e) override { started = false; TextButton::mouseDown(e); }
    void mouseDrag(const MouseEvent& e) override {
        if (!started && isEnabled() && e.getDistanceFromDragStart() >= 4) {
            started = true; if (drag) drag(this);
        }
    }
};

class Editor final : public AudioProcessorEditor, private Timer {
    Composer& proc;
    std::array<ExportFile,lanes::count+1> cache;
    std::array<DragHandle,lanes::count+1> handles;
    Label dragLabel;
    std::unique_ptr<FileChooser> chooser;
    unsigned seen = 0;
    bool ready = false, initialised = false;
    LocalView web;

    WebBrowserComponent::Options options() {
        using Web = WebBrowserComponent;
        return Web::Options().withNativeIntegrationEnabled().withKeepPageLoadedWhenBrowserIsHidden()
            .withEventListener("songweave", [this](var msg) { receive(msg); })
            .withResourceProvider([](const String& path) -> std::optional<Web::Resource> {
                if (path != "/" && path != "/index.html") return {};
                std::vector<std::byte> bytes(static_cast<std::size_t>(BinaryData::Soundscapes_htmlSize));
                std::memcpy(bytes.data(), BinaryData::Soundscapes_html, bytes.size());
                return Web::Resource{std::move(bytes), "text/html"};
            });
    }
    void send(const Identifier& id, const var& msg) { web.emitEventIfBrowserIsVisible(id,msg); }
    void message(const String& s) { send("swMessage",object({{"text",s}})); }
    void init() {
        seen = proc.restored.load();
        initialised = false;
        send("swInit",object({{"state",proc.state()},{"bpm",proc.hostBpm.load()},{"epoch",static_cast<int>(seen)}}));
    }
    static ExportFile decode(const var& data) {
        ExportFile out;
        out.name = File::createLegalFileName(data["name"].toString());
        MemoryOutputStream stream(out.bytes, false);
        if (!Base64::convertFromBase64(stream,data["data"].toString())) return {};
        stream.flush(); return out;
    }
    void dragFile(size_t index, Component* source) {
        const auto& item = cache[index];
        if (item.bytes.getSize() == 0) return;
        if (proc.dragFolder.createDirectory().failed()) { message("Could not create a MIDI drag file."); return; }
        const auto file = proc.dragFolder.getNonexistentChildFile(item.name.upToLastOccurrenceOf(".", false, false), ".mid", true);
        if (!file.replaceWithData(item.bytes.getData(), item.bytes.getSize())) { message("Could not write the drag file."); return; }
        if (!DragAndDropContainer::performExternalDragDropOfFiles({file.getFullPathName()}, false, source))
            message("Drag could not start. Use Export MIDI to save the same notes.");
    }
    void save(ExportFile item) {
        if (item.name.isEmpty() || !item.bytes.getSize()) return;
        const bool midi = item.name.endsWithIgnoreCase(".mid");
        chooser = std::make_unique<FileChooser>("Save " + item.name,
            File::getSpecialLocation(File::userDocumentsDirectory).getChildFile(item.name),
            midi ? "*.mid" : "*.swscape");
        Component::SafePointer<Editor> safe(this);
        chooser->launchAsync(FileBrowserComponent::saveMode | FileBrowserComponent::canSelectFiles |
                             FileBrowserComponent::warnAboutOverwriting,
            [safe,item=std::move(item)](const FileChooser& result) {
                if (safe == nullptr) return;
                auto file = result.getResult();
                if (file == File{}) return;
                if (!file.replaceWithData(item.bytes.getData(),item.bytes.getSize()))
                    safe->message("Save failed. Check the destination folder.");
                else safe->message("Saved " + file.getFileName());
            });
    }
    void open() {
        chooser = std::make_unique<FileChooser>("Open SongWave Soundscapes project",File{}, "*.swscape;*.json");
        Component::SafePointer<Editor> safe(this);
        chooser->launchAsync(FileBrowserComponent::openMode | FileBrowserComponent::canSelectFiles,
            [safe](const FileChooser& result) {
                if (safe == nullptr) return;
                const auto file = result.getResult();
                if (file == File{}) return;
                if (file.getSize() > 1048576) { safe->message("Project file is too large."); return; }
                safe->send("swFile",object({{"data",file.loadFileAsString()}}));
            });
    }
    void receive(const var& msg) {
        const auto type = msg["type"].toString();
        if (type == "ready") { ready = true; init(); }
        else if (type == "state" && static_cast<unsigned>(int(msg["epoch"])) == proc.restored.load()) {
            initialised = true; proc.edit(msg["json"].toString());
        }
        else if (type == "play") { proc.start(msg); send("swStarted",var{}); }
        else if (type == "stop") proc.stop();
        else if (type == "mask") proc.setMask(int(msg["mask"]));
        else if (type == "save") save(decode(msg));
        else if (type == "open") open();
        else if (type == "clearDrags") { for (auto& h : handles) h.setEnabled(false); }
        else if (type == "cache") {
            if (const auto* arr = msg["files"].getArray(); arr != nullptr && arr->size() == int(cache.size()))
                for (size_t i=0;i<cache.size();++i) {
                    cache[i] = decode(arr->getReference(int(i)));
                    handles[i].setEnabled(cache[i].bytes.getSize() > 0);
                }
        }
    }
    void timerCallback() override {
        if (!ready) return;
        if (!initialised || seen != proc.restored.load()) { init(); return; }
        send("swClock",object({{"tick",proc.progress.load()},{"bpm",proc.hostBpm.load()},{"playing",proc.active.load()},{"portSlot",proc.midi.portNumber.load()},{"portError",proc.midi.portError.load()}}));
    }
public:
    explicit Editor(Composer& p) : AudioProcessorEditor(p), proc(p), web(options()) {
        addAndMakeVisible(web);
        dragLabel.setText("Drag MIDI to Live",dontSendNotification);
        addAndMakeVisible(dragLabel);
        
        for (size_t i=0;i<handles.size();++i) {
            auto& h = handles[i];
            h.setButtonText(i==0?"All parts":lanes::names[i-1]); h.setEnabled(false); addAndMakeVisible(h);
            h.drag = [this,i](Component* source){ dragFile(i,source); };
        }
        setResizable(true,false);setResizeLimits(760,620,1440,1000);setSize(985,760);
        web.goToURL(WebBrowserComponent::getResourceProviderRoot());startTimerHz(8);
    }
    ~Editor() override { stopTimer(); proc.stop(); }
    void resized() override {
        auto bounds = getLocalBounds(); auto bar = bounds.removeFromBottom(43).reduced(9,5);
        web.setBounds(bounds);dragLabel.setBounds(bar.removeFromLeft(140));
        const int width = bar.getWidth()/int(handles.size());
        for (auto& h : handles) h.setBounds(bar.removeFromLeft(width).reduced(3,1));
    }
    void paint(Graphics& g) override { g.fillAll(Colour(0xff161c29)); }
};
AudioProcessorEditor* Composer::createEditor() { return new Editor(*this); }
} // namespace

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new Composer(); }
