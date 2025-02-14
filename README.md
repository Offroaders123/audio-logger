# audio-logger

Debugging audio bitrate inconsistencies throughout my music library!

Started to realize my Bandcamp downloads weren't encoding in the highest of resolution, compared to other songs in my 'iTunes' library (I still sync my music, I don't use Apple Music in terms of streaming, just the 'Music' app itself on macOS).

## Install

```sh
npm install --global git+https://github.com/Offroaders123/audio-logger.git
```

## Usage

There are two arguments you can pass into this script, the first one is required, it's the path of files you'd like to traverse for logging. The second is a boolean flag for whether you want to pretty-print this output, and whether it will be logged incrementally as it is parsed (niced for debugging before waiting for the entire output of big datasets like an entire music library). By default, the script will be blocking and will output the data as plain JSON.

```sh
audio-logger ~/Music/Music/Media/Music/ -p
```

There is also a JS API that you can call too, if you were to import this script as a module inside of your own JS code. The helper function `getMetadataList()` works the easiest, it simply accepts a single path string.

## Background

I discovered that some of the bitrates might be lower than I would like, and it's not necessarily `aac`/`.m4a` that's the issue, as I have essentially been happy with the quality of iTunes Store downloads for the longest time. I can definitely notice the different in quality for high dynamic range content I've downloaded from Bandcamp though, and I think I simply just need to download the lossless copies, then re-encode them on my own to either `alac` or `aac` with a higher bitrate than what it currently uses. I noticed this over the last while with:

- Illegal Aliens - Demiurgs of Plancklengthville
- Andy Kodiwein - UpSessions
- Devin Townsend - Infinity (Remastered 2023)
- Lifesigns - Lifesigns
- Devin Townsend - Terria

There may be others I haven't thought of yet, but when I downloaded my local copies of them initially, I thought something was wrong with the masters themselves, and now it makes much more sense that the download itself was the issue, I hadn't properly tested `.flac` or `.wav` to know how much better it was. I think the issue was mainly my lack of knowledge for the extent to how `aac` can vary in quality based on the bitrate, as well as how much more quality lossless encodings potentially can have (for songs that utilize it; do all songs utilize it?).

I initially thought I was getting imposter syndrome in that I had been building my library incorrectly over all these years, and maybe just now my ear had started to noticed the quality compared to lossless. This makes more sense though, as my iTunes Store downloads as of lately haven't seemed to have had this problem for me. So it's not as big of a concern as I initially thought it was going to be (I thought all of my songs from the iTunes Store over the years were going to need to be replaced by CD copies, or with full on lossless from Bandcamp).

I definitely notice the difference between lossless stems and a lossy bounce from the DAW, if anything I don't mind it when it is high enough quality though. I put some of the songs above into a spectrogram to see if the quality was indeed missing, and it was. For Terria, lots of the bandwidth above 18khz was chopped off, hence why I thought something was wrong with the audio of the 'album', it was just my copy afterall though. I am so much more thankful this is the case though, I was very bummed how many great songs were sounding like this. This was also the case for the projects Marco M and Andy K did together, I thought the master was bad (was mindblowing to me), but turns out it makes much more sense that my copy must be bad. And with playback on the Bandcamp website being in `mp3` 128kbps, that didn't help either because I thought that was how it sounded on there too, so I thought that it sounded less than good either way, hence my misunderstanding in thinking it was the source material.

Okay, back to the goal of the project. Here's what I put into GPT just to initially get started:

```
I want to write a JS script that will output ffprobe metadata for the file encodings for my music library on my Mac.

Essentially, I want to create a log that lists every single song, with each entry including:
- File extension
- Codec
- kbps (bitrate; are these the same thing?)
- Sample rate
```

I want to debug what songs appear to have less encoding quality throughout my library, and discern the correlations to whether those were the ones that I audibly noticed didn't sound as great. I hope this lines up with only being the Bandcamp ones mainly. We'll see!

Also, with the songs noted above, those were with me not having heard the complete quality versions before, so I noticed it without needing to have heard the lossless versions. That's where I felt things were missing, and why I need to fix it. For lots of my songs, I think they are probably `aac` at `44.1khz / 256kbps`, since that's what the iTunes Store provides (source for most of my earlier music downloads). I do love the sound of lossless, I do think the quality that the iTunes Store is 'just as good' too though, at least for the circumstances I find myself listening to music in.

I might also do this specifically for albums that have an intentionally great dynamic range, I noticed that a Snarky Puppy album I have went well above the 18khz threshold in the spectrogram, but those were `aac` files too. So it definitely seems to be a bitrate issue I think, not the compression itself. Just the extent that it compresses things to. Empath for example has a good deal of frequencies up high, so I do want to make sure that one gets a better bitrate too. I hadn't noticed any issues with playing that one though. Maybe with 'Hear Me', but the other songs not so much. Now knowing that the bitrate isn't as high as some of my other media, it seems obvious why I would notice it sounding different. It's not 'new music' or 'digital', it's the lossy format that you downloaded it it!

Wow I am an audio nerd now, who'da thunk?

If a song or album absolutely needs lossless though (I love it too much), then I think I'll go with `alac` for the time being. I like that it works with the same features as `.m4a` already provides, just with a different source material (since it's the internal codec, and not a change in container format as well). `.flac` seems great, but I don't currently want to deal with lack of iTunes support too. Maybe we'll cross that bridge in the event I become less of an Apple user. I understand the usage of `.flac` over `.m4a`/`alac`, but right now those don't warrant anything that will help me, it will only make it harder for me to move to lossless material. In doing a big change like this, I don't want to have to change library programs too, just to fix this.
