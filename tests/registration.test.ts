import {test} from 'node:test'
import assert from 'node:assert/strict'
import {registrationSchema} from '../shared/registration'
const valid={name:'Անի',email:'ani@example.com',password:'correct password 123',passwordConfirmation:'correct password 123'}
test('registration validates email, password length and matching confirmation on the server',()=>{
 for(const email of ['not-an-email','ani@','@example.com','ani example.com'])assert.equal(registrationSchema.safeParse({...valid,email}).success,false)
 assert.equal(registrationSchema.safeParse({...valid,password:'short',passwordConfirmation:'short'}).success,false)
 assert.equal(registrationSchema.safeParse({...valid,passwordConfirmation:'different password'}).success,false)
 const {passwordConfirmation,...missing}=valid
 assert.equal(registrationSchema.safeParse(missing).success,false)
 assert.equal(registrationSchema.parse({...valid,email:'  ANI@Example.com  '}).email,'ani@example.com')
})
