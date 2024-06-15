# autoshader

<img width="1624" alt="Screenshot 2024-06-15 at 11 46 21 AM" src="https://github.com/bfollington/autoshader/assets/5009316/3e3e4ce5-b6e9-4e08-826b-14c2099d61a3">

Generate, fork and blend ShaderToy compatible shaders using webcam, microphone and mouse input.

BYO OpenAI key. You will be prompted to enter it when you launch the app, it's stored in localstorage.

`npm install`
`npm dev`

## Permissions

Sometimes Chrome will block the microphone and webcam permissions. You can enable them by clicking the lock icon in the address bar and changing the permissions to allow all.

## Usage

You can copy any single-buffer ShaderToy example into the tiny code panel on each shader and it should work. You can copy them back out to ShaderToy too, or save a session to a local .json file.

You can enter or Tap BPM to set the tempo of the music visualiser.

Add: adds a basic webcam shader.
Generate: applies the current prompt to the shader and generate up to 4 new shaders.
Blend: combines the last two shaders in the buffer.
