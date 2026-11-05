import { Color, DataTexture, EquirectangularReflectionMapping, MeshStandardMaterial, RGBAFormat } from 'three'
import type { EarthLayerId } from '../../data/earth/interior'

/** Illustrative material appearance, not observed deep-Earth textures or mineral maps. */
const finishes = {
  crust: { color: '#467c89', cut: '#777263', roughness: .97, metalness: 0, glow: '#35271c', emission: 0 },
  mantle: { color: '#73523d', cut: '#ac6947', roughness: .94, metalness: .01, glow: '#b95124', emission: .09 },
  'outer-core': { color: '#b87942', cut: '#d59855', roughness: .34, metalness: .78, glow: '#ed9439', emission: .28 },
  'inner-core': { color: '#c3b49c', cut: '#dfcda6', roughness: .57, metalness: .62, glow: '#ffc77b', emission: .22 },
} as const
const noiseShader = `
  varying vec3 vEarthPosition;
  uniform float earthKind;
  uniform float earthCutFace;
  uniform vec2 earthRadii;
  float earthCloud(vec3 p) { return 0.5+0.5*sin(p.x*5.1+sin(p.y*8.2))*sin(p.z*6.7+p.y*2.0); }
  float earthHash(vec3 p) { p=fract(p*0.3183099+vec3(0.17,0.31,0.53)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float earthNoise(vec3 p) {
    vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(earthHash(i),earthHash(i+vec3(1,0,0)),f.x),mix(earthHash(i+vec3(0,1,0)),earthHash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(earthHash(i+vec3(0,0,1)),earthHash(i+vec3(1,0,1)),f.x),mix(earthHash(i+vec3(0,1,1)),earthHash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float earthGrain(vec3 p) { return 0.57*earthNoise(p)+0.28*earthNoise(p*2.03)+0.15*earthNoise(p*4.11); }
`
export function createInteriorMaterial(id: EarthLayerId, cutFace: boolean, radii = { inner: 0, outer: 2 }) {
  const finish = finishes[id]
  const material = new MeshStandardMaterial({
    color: id === 'crust' && !cutFace ? '#ffffff' : cutFace ? finish.cut : finish.color, roughness: finish.roughness,
    metalness: cutFace ? finish.metalness * .45 : finish.metalness, emissive: finish.glow, emissiveIntensity: finish.emission,
    envMapIntensity: id.includes('core') ? .95 : .3,
  })
  material.userData.baseEmission = finish.emission
  material.userData.layer = id
  material.userData.cutFace = cutFace
  material.onBeforeCompile = shader => {
    shader.uniforms.earthKind = { value: ['crust', 'mantle', 'outer-core', 'inner-core'].indexOf(id) }
    shader.uniforms.earthCutFace = { value: cutFace ? 1 : 0 }
    shader.uniforms.earthRadii = { value: [radii.inner, radii.outer] }
    shader.vertexShader = 'varying vec3 vEarthPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvEarthPosition=position;')
    shader.fragmentShader = noiseShader + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      vec3 earthWarp=vec3(earthNoise(vEarthPosition*3.1),earthNoise(vEarthPosition*3.1+vec3(7.3,2.1,5.8)),earthNoise(vEarthPosition*3.1+vec3(2.8,9.4,1.7)));
      vec3 earthSample=vEarthPosition+0.16*(earthWarp-0.5);
      float earthScale=earthKind<1.5?18.0:7.0;
      float earthTexture=earthGrain(earthSample*earthScale);
      float earthDetail=earthNoise(earthSample*82.0);
      float earthMineral=earthGrain(earthSample*6.0);
      float earthRadius=length(vEarthPosition);
      float earthDepth=clamp((earthRadii.y-earthRadius)/max(0.001,earthRadii.y-earthRadii.x),0.0,1.0);
      // Domain-warped mineral seams: irregular rock, without invented concentric strata.
      float earthSeam=1.0-smoothstep(0.015,0.075,abs(earthMineral-0.48));
      float earthHeight=earthTexture*(earthKind<1.5?0.008:earthKind<2.5?0.0003:0.0012);
      if(earthKind>0.5&&earthKind<1.5)earthHeight+=earthSeam*0.0015;
      if(earthKind<0.5) {
        diffuseColor.rgb*=0.80+earthTexture*0.32+0.05*(earthDetail-0.5);
        if(earthCutFace>0.5)diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.72,0.76,0.69),earthSeam*0.3);
        if(earthCutFace<0.5) {
          float clouds=smoothstep(0.65,0.82,earthGrain(vEarthPosition*5.2+earthWarp)*0.65+earthCloud(vEarthPosition)*0.35);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.86,0.91,0.94),clouds*0.88);
        }
      } else if(earthKind<1.5) {
        float rockDetail=smoothstep(0.24,0.76,earthTexture*0.65+earthMineral*0.35);
        vec3 earthRock=mix(vec3(0.31,0.34,0.25),vec3(0.67,0.40,0.25),rockDetail);
        vec3 earthHotRock=mix(earthRock,vec3(0.76,0.36,0.18),earthDepth*0.42);
        diffuseColor.rgb*=earthHotRock*1.65;
        diffuseColor.rgb*=0.86+0.20*earthTexture+0.06*earthDetail;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.58,0.62,0.52),earthSeam*0.22);
      } else if(earthKind<2.5) {
        // Smooth irregular tones; no periodic concentric stripes or simulated convection.
        float metalVariation=earthGrain(vEarthPosition*2.6+earthWarp*1.2);
        diffuseColor.rgb*=0.78+0.25*metalVariation+0.04*earthTexture;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,0.97,0.78),earthDepth*0.35);
      } else {
        // Fine subdued grain distinguishes solid metal from the smooth liquid core.
        diffuseColor.rgb*=0.88+0.16*earthTexture+0.025*earthDetail;
        diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.82,0.85,0.87),earthSeam*0.08);
      }`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(earthTexture-0.5)*(earthKind<1.5?0.12:0.05),0.16,1.0);')
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float earthHotGrain=smoothstep(0.28,0.75,earthTexture);
      float earthHeat=earthKind<1.5?mix(0.20,1.1,earthDepth):mix(0.8,1.15,earthDepth);
      totalEmissiveRadiance*=earthKind<0.5?1.0:earthHeat*(0.80+0.22*earthHotGrain);
    `)
    // Surface-gradient bump shading alters lighting only, never PREM geometry or picking.
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec3 earthDx=dFdx(-vViewPosition),earthDy=dFdy(-vViewPosition);
      vec3 earthTangentX=cross(earthDy,normal),earthTangentY=cross(normal,earthDx);
      float earthDet=dot(earthDx,earthTangentX);
      vec3 earthGradient=sign(earthDet)*(dFdx(earthHeight)*earthTangentX+dFdy(earthHeight)*earthTangentY);
      normal=normalize(max(abs(earthDet),0.00000001)*normal-earthGradient);
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <aomap_fragment>', `#include <aomap_fragment>
      float earthEdgeDistance=earthRadii.x>0.001?min(earthRadius-earthRadii.x,earthRadii.y-earthRadius):earthRadii.y-earthRadius;
      float earthEdgeShade=mix(1.0,0.90+0.10*smoothstep(0.0,0.018,max(0.0,earthEdgeDistance)),earthCutFace);
      reflectedLight.indirectDiffuse*=earthEdgeShade;
      reflectedLight.indirectSpecular*=earthEdgeShade;
    `)
  }
  material.customProgramCacheKey = () => `factum-earth-material-v5-mineral-${id}-${cutFace ? 'section' : 'shell'}`
  return material
}
export function selectInteriorMaterial(material: MeshStandardMaterial, selected: boolean) {
  // Selection is a small illumination change, leaving the physical material distinct.
  material.emissiveIntensity = Number(material.userData.baseEmission || 0) + (selected ? .08 : 0)
}
/** Small procedural studio-light environment: no image/network request, allocated once per viewer. */
export function createInteriorEnvironment() {
  const width=128,height=64,pixels=new Uint8Array(width*height*4)
  const cool=new Color('#68717a'),warm=new Color('#d9c9b2'),white=new Color('#fff4e4')
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const u=x/width,v=y/height
    const band=Math.exp(-(((v-.32)/.16)**2))*.5
    const key=Math.exp(-(((u-.24)/.07)**2)-((v-.35)/.15)**2)
    const rim=Math.exp(-(((u-.8)/.12)**2)-((v-.45)/.22)**2)*.45
    const color=cool.clone().multiplyScalar(.23+band).lerp(warm,rim).lerp(white,key)
    const offset=(y*width+x)*4
    pixels[offset]=Math.round(Math.min(1,color.r)*255);pixels[offset+1]=Math.round(Math.min(1,color.g)*255);pixels[offset+2]=Math.round(Math.min(1,color.b)*255);pixels[offset+3]=255
  }
  const texture=new DataTexture(pixels,width,height,RGBAFormat)
  texture.mapping=EquirectangularReflectionMapping
  // Values were constructed in linear space using Three.Color.
  texture.colorSpace=''
  texture.needsUpdate=true
  return texture
}
