cmake_minimum_required(VERSION 3.22)
project(Songweave VERSION 0.3.0 LANGUAGES C CXX)
if(NOT APPLE)
    message(FATAL_ERROR "The plug-in target is macOS. The offline edition runs in a browser.")
endif()
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(SONGWEAVE_JUCE "" CACHE PATH "Optional local JUCE 8.0.8 source directory")
if(SONGWEAVE_JUCE)
    add_subdirectory("${SONGWEAVE_JUCE}" juce)
else()
    include(FetchContent)
    FetchContent_Declare(JUCE GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
        GIT_TAG 8.0.8 GIT_SHALLOW TRUE)
    FetchContent_MakeAvailable(JUCE)
endif()

set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS
    web/engine.js web/app.js web/template.html)
file(READ "${CMAKE_CURRENT_SOURCE_DIR}/web/template.html" page)
file(READ "${CMAKE_CURRENT_SOURCE_DIR}/web/engine.js" engine)
file(READ "${CMAKE_CURRENT_SOURCE_DIR}/web/app.js" app)
string(REPLACE "/*ENGINE*/" "${engine}" page "${page}")
string(REPLACE "/*APP*/" "${app}" page "${page}")
file(WRITE "${CMAKE_CURRENT_BINARY_DIR}/Songweave.html" "${page}")
juce_add_binary_data(SongweaveWeb NAMESPACE BinaryData SOURCES "${CMAKE_CURRENT_BINARY_DIR}/Songweave.html")
juce_add_plugin(Songweave
    COMPANY_NAME "Songweave"
    BUNDLE_ID "music.songweave.composer"
    PLUGIN_MANUFACTURER_CODE Swve
    PLUGIN_CODE Swg1
    PRODUCT_NAME "Songweave"
    FORMATS VST3
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT TRUE
    NEEDS_WEB_BROWSER TRUE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE
    COPY_PLUGIN_AFTER_BUILD FALSE)
target_sources(Songweave PRIVATE src/Plugin.cpp)
target_compile_definitions(Songweave PUBLIC JUCE_WEB_BROWSER=1 JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0)
target_link_libraries(Songweave PRIVATE SongweaveWeb "-framework CoreMIDI" juce::juce_audio_utils juce::juce_gui_extra
    PUBLIC juce::juce_recommended_config_flags)

option(SONGWEAVE_ROUTING_TEST "Build the macOS MIDI routing integration test" OFF)
if(SONGWEAVE_ROUTING_TEST)
    add_executable(SongweaveRoutingTest tests/midi-routing.cpp)
    target_include_directories(SongweaveRoutingTest PRIVATE "$<TARGET_PROPERTY:Songweave,INCLUDE_DIRECTORIES>")
    target_compile_definitions(SongweaveRoutingTest PRIVATE "$<TARGET_PROPERTY:Songweave,COMPILE_DEFINITIONS>")
    target_link_libraries(SongweaveRoutingTest PRIVATE Songweave "-framework CoreMIDI" "-framework CoreFoundation")
endif()
