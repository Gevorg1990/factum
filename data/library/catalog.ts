export const libraryTopics = [
 {id:'prose',title:'Պատմվածքներ',short:'Պատմվածքներ',shelf:0,color:'#7092a5'},
 {id:'tales',title:'Հեքիաթներ',short:'Հեքիաթներ',shelf:1,color:'#ab8caa'},
 {id:'poetry',title:'Պոեմներ',short:'Պոեմներ',shelf:2,color:'#b89964'},
 {id:'novels',title:'Վեպեր',short:'Վեպեր',shelf:3,color:'#72a897'},
 {id:'verse',title:'Բանաստեղծություններ',short:'Բանաստեղծություններ',shelf:4,color:'#a798bf'},
 {id:'history',title:'Պատմություն',short:'Պատմություն',shelf:5,color:'#b89c75'},
 {id:'science',title:'Գիտություն',short:'Գիտություն',shelf:6,color:'#7ca7b4'},
 {id:'biography',title:'Կենսագրություններ',short:'Կենսագրություններ',shelf:7,color:'#90a878'},
 {id:'detective',title:'Դետեկտիվ',short:'Դետեկտիվ',shelf:8,color:'#a88d78'},
] as const
export interface LibraryBook {
 id:string;title:string;originalTitle:string;author:string;topic:string;shelf:number;color:string;language:'Հայերեն';description:string;file:string;source:string;cover:string;coverSource:string;coverCredit:string;coverLicense:string;edition:string;textLicense:string
}
const author='Հովհաննես Թումանյան'
export const libraryBooks:readonly LibraryBook[] = [
 {id:'gikor',title:'Գիքորը',originalTitle:'Գիքորը',author,topic:'prose',shelf:0,color:'#375e78',language:'Հայերեն',description:'Գյուղացի Համբոյի և քաղաքում ծառա տրված նրա որդու՝ Գիքորի պատմությունը։ Ընթերցման տեքստը՝ Վիքիդարանի հայերեն բնագրից։',file:'/books/gikor-hy.txt',source:'https://hy.wikisource.org/wiki/Գիքորը',cover:'/images/library/gikor-hy.webp',coverSource:'https://www.pik.am/giqor-hovhannes-tumanyan-girq.html',coverCredit:'«Հաշ ընդ Հաշ» հրատարակության կազմ · PIK գրախանութի կատալոգ',coverLicense:'Կազմի իրավունքները՝ համապատասխան իրավատիրոջը',edition:'«Հաշ ընդ Հաշ» · հայերեն կազմ',textLicense:'Հանրային սեփականության ստեղծագործություն · Վիքիդարանի արտագրություն՝ CC BY-SA'},
 {id:'qaj-nazar',title:'Քաջ Նազարը',originalTitle:'Քաջ Նազարը',author,topic:'tales',shelf:1,color:'#47745c',language:'Հայերեն',description:'Վախկոտ ու պարծենկոտ Նազարի մասին հեքիաթը։ Ընթերցման տեքստը՝ Վիքիդարանի հայերեն բնագրից։',file:'/books/qaj-nazar-hy.txt',source:'https://hy.wikisource.org/wiki/Քաջ_Նազարը',cover:'/images/library/qaj-nazar-hy.webp',coverSource:'https://www.pik.am/qaj-nazary-hovhannes-tumanyan.html',coverCredit:'«Քաջ Նազարը» հայերեն հրատարակության կազմ · PIK գրախանութի կատալոգ',coverLicense:'Կազմի իրավունքները՝ համապատասխան իրավատիրոջը',edition:'«Քաջ Նազարը» · հայերեն կազմ',textLicense:'Հանրային սեփականության ստեղծագործություն · Վիքիդարանի արտագրություն՝ CC BY-SA'},
 {id:'sasuntsi-davit',title:'Սասունցի Դավիթը',originalTitle:'Սասունցի Դավիթը',author,topic:'poetry',shelf:2,color:'#846644',language:'Հայերեն',description:'Հովհաննես Թումանյանի պոեմը՝ հայ ժողովրդական էպոսի Դավթի ճյուղի գրական մշակումը։ Ընթերցման տեքստը՝ Վիքիդարանի հայերեն բնագրից։',file:'/books/sasuntsi-davit-hy.txt',source:'https://hy.wikisource.org/wiki/Սասունցի_Դավիթը_(Հովհաննես_Թումանյան)',cover:'/images/library/sasuntsi-davit-hy.webp',coverSource:'https://www.pik.am/sasunci-davity-hovhannes-tumanyan-papuk.html',coverCredit:'«Սասունցի Դավիթը» հայերեն հրատարակության կազմ · PIK գրախանութի կատալոգ',coverLicense:'Կազմի իրավունքները՝ համապատասխան իրավատիրոջը',edition:'«Սասունցի Դավիթը» · հայերեն կազմ',textLicense:'Հանրային սեփականության ստեղծագործություն · Վիքիդարանի արտագրություն՝ CC BY-SA'},
]
