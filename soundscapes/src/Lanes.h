#pragma once
namespace lanes {
    constexpr int count = 6;
    constexpr int all = (1 << count) - 1;
    constexpr const char* names[] = {"Melody","Drone","Pad","Answer","Colour","Pulse"};
    constexpr int portBase = 0x53430000;
}
