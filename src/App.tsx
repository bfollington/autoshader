import React, { useCallback, useState } from 'react';
import ShaderToy from './ShaderToy';
import './App.css';
import { grabGlsl, processUserInput } from './llm';
import TapBPM from './TapBPM';
import { atom } from 'signia';
import { useAtom, useValue } from 'signia-react';


const defaultShader = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
}`;

const webcamShader = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Sample the texture from iChannel0
    vec4 texColor = texture(iChannel0, uv);

    // Output the color
    fragColor = vec4(texColor.rgb, 1.0);
}
`

const shaders = atom('shaders', [webcamShader] as string[])
const MAX_AHEAD = 5;

const App: React.FC = () => {
  const [caption, setCaption] = useState<string>('an infinite dream, ever changing and subtly evolving');
  const [bpm, setBpm] = useState<number>(135);

  const addNewShader = () => {
    shaders.update(s => [...s, webcamShader])
  };

  const shaderValue = useValue(shaders)

  const forkShader = useCallback(async () => {
    const lastShader = shaders.value[shaders.value.length - 1];
    // const input = prompt();
    const userPrompt = `Modify this shader based on the prompt:
      <prompt>${caption}</prompt>

      glsl\`\`\`${lastShader}\`\`\``
    const systemPrompt = `
      you are a webgl creative coding expert

      you are adept in reading the sourcecode of a ShaderToy shader and explaining how it works, considering interesting modifications and applying them to the code. You may only use iChannel0, iTime, iResolution, and iMouse.

      when the code becomes too complex, factor out functions or remove functionality to keep the shader tight and focused. you are in charge.

      when presented with shader code you respond with a modified version of the code that is interesting and creative with no other output. you provide detailed comments in the code documenting your intentions.
`
    // const result = await processUserInput(userPrompt, systemPrompt, {
    //   "think": (v) => console.log('think', v)
    // });

    const results = await Promise.all([
      processUserInput(userPrompt, systemPrompt, { "think": (v) => console.log('think', v) }),
    ])
    console.log(results)


    const added: string[] = []
    for (const result of results) {
      if (result && result.choices[0].message.content) {
        const glsl = grabGlsl(result.choices[0].message.content);
        if (glsl) {
          added.push(glsl)
        } else {
          console.error('Could not find GLSL in response');
        }
      }
    }

    shaders.update(s => [...s, ...added]);
    if (shaders.value.length < MAX_AHEAD) {
      console.log('Forking again');
      forkShader();
    }
  }, [caption]);

  const captionChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaption(e.target.value);
  }

  const bpmChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(parseInt(e.target.value));
  }

  const removeShader = (index: number) => {
    const updatedShaders = [...shaders.value];
    updatedShaders.splice(index, 1);
    shaders.set(updatedShaders);
    if (updatedShaders.length < MAX_AHEAD) {
      console.log('Forking again');
      forkShader();
    }
  }

  return (
    <div className="app">
      <div>
        <input style={{ display: 'block', width: '480px' }} type='text' className="caption" onChange={captionChanged} value={caption}></input>
        {/* <input type='number' className="bpm" onChange={bpmChanged} value={bpm}></input> */}
        <TapBPM onBPMChange={setBpm} />
      </div>
      <div>
        <button className="add-button" onClick={addNewShader}>Add Shader</button>
        <button className="fork-button" onClick={forkShader}>Fork Shader</button>
      </div>
      <div className="shader-grid">
        {shaderValue.map((shader, index) => (
          <div key={index} className="shader-item">
            <textarea
              value={shader}
              onChange={(e) => {
                const updatedShaders = [...shaders.value];
                updatedShaders[index] = e.target.value;
                shaders.set(updatedShaders);
              }}
            />
            <button className='remove-button' onClick={() => removeShader(index)}>Remove</button>
            <ShaderToy fragmentShader={shader} bpm={bpm} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
