#pragma once
namespace lanes {
    constexpr int count = 5;
    constexpr int all = (1 << count) - 1;
    constexpr const char* names[] = {"Melody","Chords","Bass","Arp","Response"};
    constexpr int portBase = 0x534d0000;
}
