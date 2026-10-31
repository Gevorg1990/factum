# Live Armenian speech

All published Armenian profiles read their own current biographies on demand through
Azure Speech. Visitors choose Anahit (female) or Hayk (male). No generated MP3
is needed. Audio is requested in short parts as WAV and held only in memory.
The first part is a short sentence to reduce startup delay; subsequent parts
load in advance during playback. The server temporarily caches identical parts
to avoid repeated synthesis.
Switching voices or leaving the page stops playback and cancels pending requests.

The same server-side speech provider also reads questions in both voice games:
country/capital questions on `/globe` and symbol-to-Armenian-name chemical
element questions on `/periodic-table`. Geography retains all three directions;
the periodic-table game offers only symbol → name. Both default to Hayk and offer Anahit,
and stop playback when the microphone starts, a new question begins or the game exits.
Opening the map/table, checking an answer and changing the selected voice leave
the current reading uninterrupted. The selected voice applies on the next read.
Game reading uses a fixed speed; the biography retains its speed selector.
Known speech aliases are displayed in Armenian in Armenian mode (for example,
Erevan and Yerevan become Երևան), while unknown transcripts stay editable.
Both games use Armenian only. After a question finishes reading, its microphone
starts automatically when supported and permitted by the browser. Visitors can
turn this off with the automatic microphone checkbox. A final spoken answer is
checked automatically; correct answers advance after 2.5 seconds, while wrong
answers stay visible until the visitor continues. Microphone recognition
is handled by the browser. The game endpoint resolves questions from stored
country/element IDs rather than accepting arbitrary text.
Checking an answer plays a distinct correct/wrong feedback cue locally; skipping
does not. Feedback stops when moving on, starting the microphone or leaving.

Create an Azure Speech resource, then set these server-only variables in `.env`:

```
NUXT_AZURE_SPEECH_KEY=your-speech-resource-key
NUXT_AZURE_SPEECH_REGION=your-resource-region
```

Restart the Nuxt development server after adding the settings. Use the resource's
actual region. Never put the key in public runtime config or commit `.env`.
Requests accept only published Armenian biographies or valid game questions and the two supported voices.
The biography metadata and audio requests both identify the selected person.
No visitor-supplied text is synthesized. Without credentials the page explicitly
reports that the service is not connected; it does not use the old robotic voice.

Provider documentation:
https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech
https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts

`prepare-biography-audio.mjs` and `npm run voice:prepare` are the earlier offline
experiment. The current player does not use their generated MP3.

Run `npm run test:speech` to verify provider requests, question coverage, playback
cancellation, voice changes and Armenian-only game reading without external calls.
