#pragma once
namespace lanes {
    constexpr int count = 6;
    constexpr int all = (1 << count) - 1;
    constexpr const char* names[] = {"Melody","Chords","Bass","Arp","Response","Drums"};
    constexpr int portBase = 0x53500000;
}
