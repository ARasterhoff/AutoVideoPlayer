# AutoVideoPlayer

A BetterDiscord plugin that automatically plays videos when they scroll into view.

## Why This Exists

This plugin was born from a conversation with my friend Callum, who pointed out the cruel irony of media formats: GIFs loop endlessly but have no sound, while MP4s have sound but won't autoplay. It seemed only fair to fix at least half of that problem.

Now your Discord videos play automatically as you scroll — like GIFs, but with sound.

## What It Does

AutoVideoPlayer watches for videos in your Discord chat and automatically plays them when they enter your viewport. When you scroll past, they pause. Simple as that.

**Features:**
- Viewport-based autoplay — videos play when visible, pause when not
- Respects manual pauses — if you pause a video, it stays paused
- Configurable visibility threshold — set how much of a video must be visible before it plays
- Optional mute mode — autoplay videos silently if you prefer
- Auto-replay options — loop videos continuously or replay when scrolling back

## Requirements

- [BetterDiscord](https://betterdiscord.app/) installed and running
- Discord desktop client

## Installation

1. Download `AutoVideoPlayer.plugin.js`
2. Open Discord and go to **User Settings** → **BetterDiscord** → **Plugins**
3. Click **Open Plugins Folder**
4. Move `AutoVideoPlayer.plugin.js` into the plugins folder
5. Enable the plugin in BetterDiscord settings

## Configuration

Once enabled, click the settings icon next to the plugin to configure:

**Playback Settings:**
- Enable/disable autoplay
- Mute videos on autoplay
- Viewport threshold (1-100%)

**Behavior Settings:**
- Respect manual pause
- Replay finished videos on scroll-back
- Continuous auto-replay loop

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
