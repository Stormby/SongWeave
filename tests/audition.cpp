#include "../src/Audition.h"
#include <cassert>
int main() {
    Audition synth;
    std::vector<PreviewNote> score{{480,480,69,100,0}};
    std::vector<float> left(51000),right(51000);
    synth.start(score,960);
    synth.render(left.data(),right.data(),51000,48000,120,15);
    assert(std::all_of(left.begin(),left.begin()+23999,[](float n){return n==0;}));
    assert(*std::max_element(left.begin()+24010,left.begin()+47000)>.01f);
    assert(*std::max_element(left.begin(),left.end())<1.f);
    assert(!synth.playing);
    score={{0,480,60,127,2}};synth.start(score,480);
    std::fill(left.begin(),left.end(),0);synth.render(left.data(),right.data(),51000,48000,120,1);
    assert(*std::max_element(left.begin(),left.end())==0.f);
}
