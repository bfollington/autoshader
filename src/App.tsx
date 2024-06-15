import React, { useCallback, useState } from 'react';
import ShaderToy from './ShaderToy';
import './App.css';
import { grabGlsl, processUserInput } from './llm';
import TapBPM from './TapBPM';
import { atom } from 'signia';
import { useAtom, useValue } from 'signia-react';
import SaveShadersButton from './SaveShadersButton';
import LoadShadersButton from './LoadShadersButton';


const defaultShader = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
}`;

const webcamFFtShader = `
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        // create pixel coordinates
        vec2 uv = fragCoord.xy / iResolution.xy;

        // quantize coordinates
        const float bands = 30.0;
        const float segs = 40.0;
        vec2 p;
        p.x = floor(uv.x*bands)/bands;
        p.y = floor(uv.y*segs)/segs;

        // read frequency data from first row of texture
        float fft  = texture( iChannel1, vec2(p.x,0.) ).x; // Evolve over time

        // led color evolving over time
        vec3 color = mix(vec3(0.0, 2.0, 2.0), vec3(2.0, 0.0, 2.0), sin(iTime + uv.y) * 0.5 + 0.5);

        // mask for bar graph
        float mask = (p.y < fft) ? 1.0 : 0.1;

        // led shape
        vec2 d = fract((uv - p) *vec2(bands, segs)) - 0.5;
        float led = smoothstep(0.5, 0.35, abs(d.x)) *
                    smoothstep(0.5, 0.35, abs(d.y));
        vec3 ledColor = led * color * mask;

        // distort iChannel0 texture using the current spectrum
        vec3 distortion = texture(iChannel0, uv + vec2(0.1 * fft, 0.1 * fft)).rgb;

        // apply additional distortion based on spectrum
        float additionalDistortion = texture(iChannel0, uv + vec2(0.05 * fft, 0.05 * fft)).x;
        ledColor = mix(ledColor, distortion, additionalDistortion);

        // subtle evolving background with more dream-like colors
        vec3 bgColor = 0.1 * vec3(sin(iTime + uv.x * 3.0), cos(iTime + uv.y * 3.0), sin(iTime * 0.5 + uv.x + uv.y));
        bgColor += 0.1 * vec3(sin(iTime * 0.3 + uv.y * 2.0), cos(iTime * 0.2 + uv.x * 2.0), sin(iTime * 0.4 + uv.x * uv.y));

        // blend the LED color with the evolving background
        fragColor = vec4(ledColor, 1.0);
    }


  `

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

export const shaders = atom('shaders', [webcamFFtShader] as string[])
const MAX_AHEAD = 5;
const systemPrompt = `Write creative, beautiful, tasteful and terse Shadertoy shaders.

     Reading the sourcecode a ShaderToy shader and explain how it works, consider interesting modifications and apply them to the code.
     YOU MAY ONLY use iChannel0 (webcam), iChannel1 (FFT microphone input, y=0 is frequency, y=1 is wave), iTime, iResolution, and iMouse.

     when the code becomes too complex, factor out functions or remove functionality to keep the shader tight and focused. you are in charge.

     when presented with shader code you respond with a modified version of the code that is interesting and creative with no other output. you provide detailed comments in the code documenting your intentions.
`

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
    const userPrompt = `Consider how to modify the following ShaderToy shader based on the user prompt:
      <prompt>${caption}</prompt>

      Be imaginative, these will be visuals to accompany music at a live event. Interpret the prompt in a way that is visually interesting and engaging without resorting to cheap tricks like rainbows.

      glsl\`\`\`${lastShader}\`\`\`

      First, plan your approach conceptually (recording your thinking using tools) and then write the code.

      Your final message must be only the shader sourcecode.
      `
    // const result = await processUserInput(userPrompt, systemPrompt, {
    //   "think": (v) => console.log('think', v)
    // });

    const results = await Promise.all([
      processUserInput(userPrompt, systemPrompt, {
        "think": (v) => {
          console.log('think', v)
          return "Thought recorded. Pleasure jamming with you."
        },
        "plan": (v) => {
          console.log('plan', v)
          return "Thought recorded. Pleasure jamming with you."
        }
      }),
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

  const mixShaders = useCallback(async () => {
    const lastShaderA = shaders.value[shaders.value.length - 1];
    const lastShaderB = shaders.value[shaders.value.length - 2];
    // const input = prompt();
    const userPrompt = `Consider how to blend the following two ShaderToy shaders based on the user prompt:
      <prompt>${caption}</prompt>

      Do not simply overlay one on the other, try to mix and match functions, effects, variables, and other elements to create a new, interesting, and creative shader.

      # Shader A
      glsl\`\`\`${lastShaderA}\`\`\`

      # Shader B
      glsl\`\`\`${lastShaderB}\`\`\`

      First, plan your approach conceptually (recording your thinking using tools) and then write the code.

      Your final message must be only the shader sourcecode.
      `
    // const result = await processUserInput(userPrompt, systemPrompt, {
    //   "think": (v) => console.log('think', v)
    // });

    const results = await Promise.all([
      processUserInput(userPrompt, systemPrompt, {
        "think": (v) => {
          console.log('think', v)
          return "Thought recorded. Pleasure jamming with you."
        },
        "plan": (v) => {
          console.log('plan', v)
          return "Thought recorded. Pleasure jamming with you."
        }
      }),
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

  }

  return (
    <div className="app">
      <div className="toolbar">
        <TapBPM onBPMChange={setBpm} />
        <button className="add-button" onClick={addNewShader}>Add</button>
        <button className="fork-button" onClick={forkShader}>Generate</button>
        <button className="blend-button" onClick={mixShaders}>Blend</button>
        <SaveShadersButton />
        <LoadShadersButton />
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
      <div className="caption">
        <input type='text' className="caption" onChange={captionChanged} value={caption}></input>
      </div>
    </div>
  );
};

export default App;
