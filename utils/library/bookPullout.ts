import * as THREE from 'three'

/** Animate only the picked copy; instanced shelf neighbours retain their matrices. */
export function createBookPullout(mesh:THREE.Mesh,instanceId?:number){
 const instanced=mesh instanceof THREE.InstancedMesh
 if(instanced&&(instanceId===undefined||instanceId<0||instanceId>=mesh.count))throw new Error('Missing book instance')
 const restMatrix=new THREE.Matrix4()
 if(instanced)mesh.getMatrixAt(instanceId!,restMatrix)
 else restMatrix.copy(mesh.matrix)
 const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3()
 restMatrix.decompose(position,rotation,scale)
 const outward=new THREE.Vector3(0,0,1).applyQuaternion(rotation)
 const nextPosition=new THREE.Vector3(),nextRotation=new THREE.Quaternion(),matrix=new THREE.Matrix4()
 const turn=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2)
 let progress=0,open=true
 const ease=(t:number)=>t*t*(3-2*t)
 function apply(){
  nextPosition.copy(position).addScaledVector(outward,.95*ease(Math.min(1,progress/.7)))
  nextRotation.copy(rotation)
  if(instanced)nextRotation.multiply(new THREE.Quaternion().slerp(turn,ease(Math.max(0,(progress-.45)/.55))))
  matrix.compose(nextPosition,nextRotation,scale)
  if(instanced){mesh.setMatrixAt(instanceId!,matrix);mesh.instanceMatrix.needsUpdate=true}
  else{mesh.position.copy(nextPosition);mesh.quaternion.copy(nextRotation)}
 }
 function restore(){if(instanced){mesh.setMatrixAt(instanceId!,restMatrix);mesh.instanceMatrix.needsUpdate=true}else{mesh.position.copy(position);mesh.quaternion.copy(rotation);mesh.scale.copy(scale)}}
 return {
  key:mesh.uuid+':'+(instanceId??'single'),mesh,instanceId,
  setOpen(value:boolean){open=value},
  update(dt:number){const step=Math.min(Math.max(dt,0),.1)/.7;progress=THREE.MathUtils.clamp(progress+(open?step:-step),0,1);apply();if(!open&&progress===0){restore();return false}return true},
  restore,
 }
}
