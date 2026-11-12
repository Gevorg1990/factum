<script setup lang="ts">
import {libraryTopics} from '~/data/library/catalog'
import { ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
import { fieldLabels, fieldHints } from '~/shared/cmsEditor'
defineOptions({name:'AdminFields'})
const props=withDefaults(defineProps<{modelValue:any;field?:string;kind?:string;hiddenKeys?:string[];answerOptions?:string[];requiredFields?:string[];disabledFields?:string[]}>(),{hiddenKeys:()=>[],requiredFields:()=>[],disabledFields:()=>[]})
const emit=defineEmits(['update:modelValue'])
const fieldId=useId()
const visibleEntries=computed(()=>{
 const order:Record<string,string[]>={ARTICLE:['subject','answer','detail','video','image','listed','sections','example','takeaway','source'],PERSON:['years','role','category','bio','portrait','isArmenian','biographySections','timeline','works','source','biographyDocument'],FACT:['category','text','image','source'],EVENT:['year','era','details'],GAME:['difficulty','title','answers','correct','explanation','hint','topic'],MONUMENT:['personId','city','location','image','source','installedYear','openedYear','openedDate','sculptor','architect'],WORK:['personId','index','description','significance','type','date','group','sources'],CATEGORY:['image','cardVideo','shortName'],source:['name','url'],image:['src','alt','credit','license','sourceUrl','licenseUrl','fit','position'],details:['intro','sections','facts']}
 const keys=[...(order[props.field||props.kind||'']||[]),'title','heading','date','name','text','body','url']
 const rank=(key:string)=>{const i=keys.indexOf(key);return i<0?1000:i}
 return Object.entries(props.modelValue||{}).filter(([key])=>!props.hiddenKeys.includes(key)).sort(([a],[b])=>rank(a)-rank(b)||a.localeCompare(b,'en'))
})
const isObject=computed(()=>props.modelValue!==null&&typeof props.modelValue==='object'&&!Array.isArray(props.modelValue))
const label=computed(()=>fieldLabels[props.field||'']||'Լրացուցիչ տեղեկություն')
const hint=computed(()=>fieldHints[props.field||''])
const longFields=new Set(['text','detail','answer','bio','explanation','description','significance','example','takeaway','intro','body','hint','statement','question'])
const numberFields=new Set(['openedYear','installedYear','slot','index'])
const imageFields=new Set(['cover','portrait','image','src','preview'])
const personCategories=['Գրականություն','Մշակույթ և պատմություն','Կերպարվեստ և ճարտարապետություն','Երաժշտություն','Կինո և թատրոն','Գիտություն և տեխնոլոգիա','Սպորտ','Պետական և ռազմական գործիչներ','Գործարարներ և բարերարներ']
const options=computed(()=>{
 if(props.field==='topic'&&props.kind==='BOOK')return libraryTopics.map(topic=>({value:topic.id,label:topic.title}))
 if(props.field==='difficulty')return [{value:'easy',label:'Հեշտ'},{value:'medium',label:'Միջին'},{value:'hard',label:'Բարդ'}]
 if(props.field==='category'&&props.kind==='PERSON')return personCategories.map(x=>({value:x,label:x}))
 if(props.field==='fit')return [{value:'contain',label:'Ցույց տալ ամբողջ նկարը'},{value:'cover',label:'Լրացնել նկարի տարածքը'}]
 if(props.field==='portraitLanguage')return [{value:'hy',label:'Հայերեն'},{value:'en',label:'Անգլերեն'}]
 return []
})
function update(key:string|number,value:any){const next=Array.isArray(props.modelValue)?[...props.modelValue]:{...props.modelValue};next[key]=value;if(key==='answers'&&typeof next.correct==='number'){if(value.length<props.modelValue.answers.length)next.correct=Math.max(0,value.indexOf(props.modelValue.answers[next.correct]));else if(next.correct>=value.length)next.correct=0;}emit('update:modelValue',next)}
function add(){
 const defaults:Record<string,any>={sections:props.kind==='EVENT'?{heading:'',body:''}:props.kind==='ARTICLE'?{title:'',text:'',image:''}:{title:'',text:''},biographySections:{title:'',text:''},timeline:{date:'',text:''},sources:{name:'',url:''}}
 const sample=props.modelValue[0]||defaults[props.field||'']
 const empty=(value:any):any=>Array.isArray(value)?[]:value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,entry])=>[key,empty(entry)])):typeof value==='number'?0:typeof value==='boolean'?false:''
 emit('update:modelValue',[...props.modelValue,sample&&typeof sample==='object'?empty(sample):''])
}
</script>
<template>
  <div v-if="isObject" class="fields-grid">
    <div v-if="field" class="object-heading"><strong>{{label}}</strong><p v-if="hint" class="field-hint">{{hint}}</p></div><AdminFields v-for="[key,value] in visibleEntries" :key="key" :model-value="value" :field="String(key)" :kind="kind" :answer-options="modelValue.answers" :required-fields="requiredFields" :disabled-fields="disabledFields" @update:model-value="update(key,$event)"/>
  </div>
  <fieldset v-else-if="Array.isArray(modelValue)" class="array-field">
    <legend>{{label}}</legend><p v-if="hint" class="field-hint">{{hint}}</p>
    <div v-for="(item,i) in modelValue" :key="i" class="array-item">
      <div class="array-item-heading"><span>{{field==='answers'?'Տարբերակ':'Մաս'}} {{i+1}}</span><button type="button" :aria-label="`Հեռացնել ${i+1}-րդ ${field==='answers'?'պատասխանը':'մասը'}`" @click="emit('update:modelValue',modelValue.filter((_:any,n:number)=>n!==i))"><Trash2 :size="14"/>Հեռացնել</button></div>
      <AdminFields :model-value="item" :field="typeof item==='string'?'arrayText':undefined" :kind="kind" @update:model-value="update(i,$event)"/>
    </div>
    <p v-if="!modelValue.length" class="array-empty">Դեռ ավելացված չէ։ Կարող ես լրացնել, եթե անհրաժեշտ է։</p>
    <button type="button" class="array-add" :disabled="field==='answers'&&modelValue.length>=8" @click="add"><Plus :size="15"/>{{field==='answers'?'Ավելացնել պատասխան':field==='works'?'Ավելացնել անվանում':'Ավելացնել մաս'}}</button>
  </fieldset>
  <div v-else-if="field==='correct'" class="cms-field correct-field">
    <span class="field-label">{{label}} <span class="required-dot">*</span></span><p class="field-hint">{{typeof modelValue==='boolean'?'Նշիր՝ պնդումը ճիշտ է, թե սխալ։':'Ընտրիր ճիշտ տարբերակը։ Թվային նշումներ գրել պետք չէ։'}}</p>
    <div class="correct-options"><label v-for="(option,i) in (typeof modelValue==='boolean'?['Ճիշտ է','Սխալ է']:answerOptions||[])" :key="i" :class="{chosen:modelValue===(typeof modelValue==='boolean'?i===0:i)}"><input type="radio" :name="fieldId" :checked="modelValue===(typeof modelValue==='boolean'?i===0:i)" @change="emit('update:modelValue',typeof modelValue==='boolean'?i===0:i)"><span>{{option||`Տարբերակ ${i+1} (դեռ լրացված չէ)`}}</span></label></div>
  </div>
  <label v-else-if="typeof modelValue==='boolean'" class="boolean-field"><input type="checkbox" :checked="modelValue" @change="emit('update:modelValue',($event.target as HTMLInputElement).checked)"><span><strong>{{label}}</strong><small v-if="hint">{{hint}}</small></span></label>
  <div v-else class="cms-field">
    <label v-if="field!=='arrayText'" :for="fieldId" class="field-label">{{label}} <span v-if="requiredFields.includes(field||'')" class="required-dot">*</span><span v-else class="optional-label">ոչ պարտադիր</span></label>
    <AdminReferenceField v-if="field==='subject'||field==='personId'||(field==='category'&&kind==='FACT')" :model-value="modelValue" :kind="field==='subject'?'CATEGORY':field==='category'?'FACT_CATEGORY':'PERSON'" :required="requiredFields.includes(field||'')" :disabled="disabledFields.includes(field||'')" :placeholder="field==='subject'?'Ընտրիր հոդվածի բաժինը':field==='category'?'Ընտրիր փաստի թեման':'Ընտրիր մարդուն'" @update:model-value="emit('update:modelValue',$event||'')"/>
    <LazyAdminVideoField v-else-if="field==='cardVideo'||(field==='video'&&kind==='ARTICLE')" :purpose="field==='video'?'article':'preview'" :model-value="modelValue" @update:model-value="emit('update:modelValue',$event)"/>
    <AdminImageField v-else-if="imageFields.has(field||'')" :model-value="modelValue" :label="label" :fill="kind==='BOOK'&&field==='cover'" @update:model-value="emit('update:modelValue',$event)"/>
    <select v-else-if="options.length" :id="fieldId" :value="modelValue" @change="emit('update:modelValue',($event.target as HTMLSelectElement).value)"><option value="" disabled>Ընտրիր ցանկից</option><option v-if="modelValue&&!options.some(x=>x.value===modelValue)" :value="modelValue">{{modelValue}}</option><option v-for="option in options" :key="option.value" :value="option.value">{{option.label}}</option></select>
    <input v-else-if="typeof modelValue==='number'||numberFields.has(field||'')" :id="fieldId" type="number" :value="field==='index'&&modelValue!==undefined?modelValue+1:modelValue" :min="field==='index'?1:undefined" :disabled="disabledFields.includes(field||'')" :required="requiredFields.includes(field||'')" @input="emit('update:modelValue',($event.target as HTMLInputElement).value===''?undefined:Number(($event.target as HTMLInputElement).value)-(field==='index'?1:0))">
    <LazyAdminBookTextField v-else-if="kind==='BOOK'&&field==='text'" :model-value="modelValue" @update:model-value="emit('update:modelValue',$event)"/>
    <textarea v-else-if="longFields.has(field||'')||(typeof modelValue==='string'&&modelValue.length>160)" :id="fieldId" :value="modelValue??''" :rows="['detail','text','bio','body'].includes(field||'')?6:3" :required="requiredFields.includes(field||'')" :disabled="disabledFields.includes(field||'')" @input="emit('update:modelValue',($event.target as HTMLTextAreaElement).value)"/>
    <input v-else :id="fieldId" :value="modelValue??''" :required="requiredFields.includes(field||'')" :disabled="disabledFields.includes(field||'')" :type="['url','sourceUrl','licenseUrl'].includes(field||'')?'url':'text'" :placeholder="['url','sourceUrl','licenseUrl'].includes(field||'')?'https://…':undefined" @input="emit('update:modelValue',($event.target as HTMLInputElement).value)">
    <p v-if="hint" class="field-hint">{{hint}}</p>
  </div>
</template>
<style scoped>.fields-grid{display:grid;gap:23px}.fields-grid:has(>.object-heading){border:1px solid #2b405a;border-radius:13px;padding:18px}.object-heading strong{display:block;font-size:12px;color:#dce6f3;margin-bottom:6px}.cms-field{display:grid;gap:9px;min-width:0}.field-label,.array-field legend{color:#dce6f3;font-size:12px;font-weight:650}.optional-label{color:#7189a7;font-size:10px;font-weight:400;margin-left:6px}.required-dot{color:#ebc986}.field-hint{font-size:11px;line-height:1.9;color:#8da2be;margin:0}.cms-field input,.cms-field textarea,.cms-field select{width:100%;min-width:0;padding:12px 14px;background:#071426;border:1px solid #304661;border-radius:10px;color:#edf3fc;font:inherit;font-size:13px;line-height:1.8}.cms-field textarea{resize:vertical}.cms-field :is(input,textarea,select):focus{outline:2px solid #ebc98655;outline-offset:2px;border-color:#b49d78}.cms-field input:disabled{opacity:.55}.array-field{min-width:0;border:1px solid #2b405a;padding:18px;border-radius:13px;display:grid;gap:14px}.array-field legend{padding:0 7px}.array-item{background:#0b1b2e;border:1px solid #273e59;border-radius:10px;padding:15px;display:grid;gap:14px}.array-item-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.array-item-heading>span{color:#91a6c2;font-size:10px}.array-item-heading button{display:flex;gap:6px;align-items:center;color:#b58b8f;font-size:10px}.array-add{display:flex;gap:7px;align-items:center;color:#e7c789;font-size:11px;padding:8px 0;justify-self:start}.array-empty{font-size:11px;color:#7e95b3}.boolean-field{display:flex;align-items:flex-start;gap:12px;background:#e7c78906;border:1px solid #e7c78922;border-radius:10px;padding:15px;cursor:pointer}.boolean-field>input{margin-top:3px;accent-color:#e7c789;width:16px;height:16px;flex-shrink:0}.boolean-field strong{display:block;color:#dae4f2;font-size:12px;font-weight:550}.boolean-field small{display:block;color:#8da2be;font-size:10px;line-height:1.9;margin-top:5px}.correct-options{display:grid;gap:9px}.correct-options>label{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid #304661;border-radius:10px;background:#071426;cursor:pointer;font-size:12px;line-height:1.8}.correct-options>label.chosen{border-color:#6db69a;background:#6db69a0a;color:#b0dfca}.correct-options input{width:16px;height:16px;accent-color:#83c7a9;flex-shrink:0}button:disabled{opacity:.4}</style>
