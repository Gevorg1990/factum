export const factCategories = [
  {
    "id": "space",
    "name": "Տիեզերք",
    "symbol": "🌌"
  },
  {
    "id": "planets",
    "name": "Մոլորակներ",
    "symbol": "🪐"
  },
  {
    "id": "animals",
    "name": "Կենդանիներ",
    "symbol": "🐙"
  },
  {
    "id": "oceans",
    "name": "Օվկիանոսներ",
    "symbol": "🌊"
  },
  {
    "id": "plants",
    "name": "Բույսեր",
    "symbol": "🌿"
  },
  {
    "id": "insects",
    "name": "Միջատներ",
    "symbol": "🦋"
  },
  {
    "id": "body",
    "name": "Մարդու մարմին",
    "symbol": "🫀"
  },
  {
    "id": "genetics",
    "name": "Գենետիկա",
    "symbol": "🧬"
  },
  {
    "id": "geology",
    "name": "Երկիր և ապարներ",
    "symbol": "🌍"
  },
  {
    "id": "volcanoes",
    "name": "Հրաբուխներ",
    "symbol": "🌋"
  },
  {
    "id": "weather",
    "name": "Եղանակ",
    "symbol": "🌦️"
  },
  {
    "id": "water",
    "name": "Ջրի աշխարհ",
    "symbol": "💧"
  },
  {
    "id": "physics",
    "name": "Ֆիզիկա",
    "symbol": "⚛️"
  },
  {
    "id": "chemistry",
    "name": "Քիմիա",
    "symbol": "🧪"
  },
  {
    "id": "technology",
    "name": "Տեխնոլոգիա",
    "symbol": "💻"
  },
  {
    "id": "history",
    "name": "Պատմություն",
    "symbol": "🏺"
  },
  {
    "id": "art",
    "name": "Արվեստ",
    "symbol": "🎨"
  },
  {
    "id": "music",
    "name": "Երաժշտություն",
    "symbol": "🎵"
  },
  {
    "id": "language",
    "name": "Լեզու և գիր",
    "symbol": "📚"
  },
  {
    "id": "armenia",
    "name": "Հայկական մշակույթ",
    "symbol": "֎"
  }
] as const

export type FactCategoryId = typeof factCategories[number]['id']
export interface InterestingFact {
  id: string
  category: FactCategoryId
  title: string
  text: string
  image?: string
  source: { name: string; url: string }
}

export const facts: InterestingFact[] = [
  {
    "id": "fact-space-1",
    "category": "space",
    "title": "Լուսինը միշտ գրեթե նույն կողմով է նայում Երկրին",
    "text": "Նրա առանցքային պտույտի և Երկրի շուրջ պտույտի ժամանակահատվածները համընկնում են։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/moon/facts/"
    },
    "image": "/images/facts/moon.jpg"
  },
  {
    "id": "fact-space-2",
    "category": "space",
    "title": "Լուսինն աստիճանաբար հեռանում է Երկրից",
    "text": "Տարեկան միջին հեռացումը մոտ 3,8 սանտիմետր է՝ լազերային չափումների համաձայն։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/moon/facts/"
    }
  },
  {
    "id": "fact-space-3",
    "category": "space",
    "title": "Լուսինն ունի շատ նոսր գազային թաղանթ",
    "text": "Այն կոչվում է էկզոսֆերա և էապես տարբերվում է Երկրի խիտ մթնոլորտից։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/moon/facts/"
    }
  },
  {
    "id": "fact-space-4",
    "category": "space",
    "title": "Լուսնի վրա նույնպես երկրաշարժեր են լինում",
    "text": "Ապոլոն առաքելությունների տեղադրած սեյսմաչափերը գրանցել են լուսնաշարժեր։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/moon/facts/"
    }
  },
  {
    "id": "fact-space-5",
    "category": "space",
    "title": "Լուսինը Երկրի միակ բնական արբանյակն է",
    "text": "Այն Արեգակնային համակարգի հինգերորդ ամենամեծ բնական արբանյակն է։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/moon/facts/"
    }
  },
  {
    "id": "f2",
    "category": "planets",
    "title": "Վեներայի առանցքային պտույտը երկար է նրա տարուց",
    "text": "Առանցքային պտույտը տևում է մոտ 243 երկրային օր, իսկ Արեգակի շուրջ պտույտը՝ մոտ 225 օր։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/venus/venus-facts/"
    },
    "image": "/images/facts/venus.jpg"
  },
  {
    "id": "fact-planets-2",
    "category": "planets",
    "title": "Վեներան ամենաշոգ մոլորակն է",
    "text": "Նրա խիտ մթնոլորտի ուժեղ ջերմոցային ազդեցությունը մակերևույթը պահում է մոտ 467°C ջերմաստիճանում։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/venus/venus-facts/"
    }
  },
  {
    "id": "fact-planets-3",
    "category": "planets",
    "title": "Վեներան պտտվում է մոլորակների մեծ մասի հակառակ ուղղությամբ",
    "text": "Այդ պատճառով մակերևույթից Արեգակը կերևար արևմուտքից ծագելիս և արևելքում մայր մտնելիս։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/venus/venus-facts/"
    }
  },
  {
    "id": "fact-planets-4",
    "category": "planets",
    "title": "Վեներան բնական արբանյակ չունի",
    "text": "Երկրի այս հարևանի շուրջ Լուսնի նման բնական ուղեկից չի պտտվում։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/venus/venus-facts/"
    }
  },
  {
    "id": "f3",
    "category": "planets",
    "title": "Սատուրնի միջին խտությունը փոքր է ջրի խտությունից",
    "text": "Մոլորակի միջին խտությունը մոտ 0,69 գ/սմ³ է։ Սա միջին ցուցանիշ է, ոչ բոլոր շերտերի խտությունը։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/saturn/facts/"
    },
    "image": "/images/facts/saturn.jpg"
  },
  {
    "id": "f1",
    "category": "animals",
    "title": "Ութոտնուկն ունի երեք սիրտ",
    "text": "Երկու սիրտը արյուն են մղում դեպի խռիկները, իսկ երրորդը՝ դեպի մարմնի մյուս մասերը։",
    "source": {
      "name": "Բնագիտության թանգարան, Լոնդոն",
      "url": "https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html"
    },
    "image": "/images/facts/octopus.jpg"
  },
  {
    "id": "fact-animals-2",
    "category": "animals",
    "title": "Ութոտնուկի արյունը կապտավուն է",
    "text": "Թթվածին տեղափոխող հեմոցիանին սպիտակուցը պարունակում է պղինձ։",
    "source": {
      "name": "Բնագիտության թանգարան, Լոնդոն",
      "url": "https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html"
    }
  },
  {
    "id": "fact-animals-3",
    "category": "animals",
    "title": "Ութոտնուկի նեյրոնների մեծ մասը նրա գլխում չէ",
    "text": "Նեյրոնների մեծ մասը գտնվում է թևերում, որոնք կարող են տեղային կերպով մշակել տեղեկությունը։",
    "source": {
      "name": "Բնագիտության թանգարան, Լոնդոն",
      "url": "https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html"
    }
  },
  {
    "id": "fact-animals-4",
    "category": "animals",
    "title": "Ութոտնուկները կարող են գործիք օգտագործել",
    "text": "Դիտարկվել են ութոտնուկներ, որոնք կոկոսի կեղևները տեղափոխում և օգտագործում են որպես ապաստարան։",
    "source": {
      "name": "Բնագիտության թանգարան, Լոնդոն",
      "url": "https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html"
    }
  },
  {
    "id": "fact-animals-5",
    "category": "animals",
    "title": "Ութոտնուկները կարող են արագ փոխել մաշկի գույնը",
    "text": "Գունափոխությունը օգնում է քողարկվել․ որոշ տեսակներ փոխում են նաև մաշկի մակերևույթի տեսքը։",
    "source": {
      "name": "Բնագիտության թանգարան, Լոնդոն",
      "url": "https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html"
    }
  },
  {
    "id": "fact-oceans-1",
    "category": "oceans",
    "title": "Օվկիանոսի աղերի մի մասը գալիս է ցամաքի ապարներից",
    "text": "Անձրևաջուրը քայքայում է ապարները, իսկ գետերը լուծված իոնները տեղափոխում են դեպի օվկիանոս։",
    "source": {
      "name": "NOAA",
      "url": "https://oceanservice.noaa.gov/facts/whysalty.html"
    }
  },
  {
    "id": "fact-oceans-2",
    "category": "oceans",
    "title": "Օվկիանոսի հատակի աղբյուրները նույնպես աղեր են մատակարարում",
    "text": "Տաքացած ջուրը փոխազդում է ապարների հետ և ծով է վերադառնում լուծված նյութերով։",
    "source": {
      "name": "NOAA",
      "url": "https://oceanservice.noaa.gov/facts/whysalty.html"
    }
  },
  {
    "id": "fact-oceans-3",
    "category": "oceans",
    "title": "Երկրի ջրի մոտ 97 տոկոսն օվկիանոսում է",
    "text": "Այս մեծ մասը աղի ջուր է և անմիջապես խմելու համար պիտանի չէ։",
    "source": {
      "name": "NOAA",
      "url": "https://oceanservice.noaa.gov/facts/oceanwater.html"
    }
  },
  {
    "id": "fact-oceans-4",
    "category": "oceans",
    "title": "Ճնշումն աճում է ծովի խորության հետ",
    "text": "Յուրաքանչյուր մոտ 10 մետր իջնելիս ջրի ճնշումն ավելանում է մոտ մեկ մթնոլորտով։",
    "source": {
      "name": "NOAA",
      "url": "https://oceanservice.noaa.gov/facts/pressure.html"
    }
  },
  {
    "id": "fact-oceans-5",
    "category": "oceans",
    "title": "Մարջանները կենդանիներ են",
    "text": "Դրանք բույսերի նման կարող են անշարժ մնալ, բայց կազմված են կենդանի պոլիպներից։",
    "source": {
      "name": "NOAA",
      "url": "https://oceanservice.noaa.gov/facts/coral.html"
    },
    "image": "/images/facts/coral.jpg"
  },
  {
    "id": "fact-plants-1",
    "category": "plants",
    "title": "Որոշ բույսեր փոշոտվում են քամու միջոցով",
    "text": "Ծաղկափոշին տեղափոխելու համար բոլոր բույսերին միջատներ պետք չեն։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/pollinators/what-is-a-pollinator.htm"
    }
  },
  {
    "id": "fact-plants-2",
    "category": "plants",
    "title": "Ջուրը նույնպես կարող է փոշոտման միջոց լինել",
    "text": "Որոշ բույսերի ծաղկափոշին տեղափոխվում է ջրի օգնությամբ։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/pollinators/what-is-a-pollinator.htm"
    }
  },
  {
    "id": "fact-plants-3",
    "category": "plants",
    "title": "Որոշ բույսեր կարող են ինքնափոշոտվել",
    "text": "Այդ դեպքում ծաղկափոշու տեղափոխման համար մեկ այլ բույսի մասնակցությունը պարտադիր չէ։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/pollinators/what-is-a-pollinator.htm"
    }
  },
  {
    "id": "fact-plants-4",
    "category": "plants",
    "title": "Փոշոտումն օգնում է սերմերի առաջացմանը",
    "text": "Ծաղկափոշու տեղափոխումը բույսի բեղմնավորման և հետագա բազմացման կարևոր փուլերից է։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/pollinators/what-is-a-pollinator.htm"
    }
  },
  {
    "id": "fact-plants-5",
    "category": "plants",
    "title": "Չղջիկներն էլ կարող են փոշոտել բույսերը",
    "text": "Բույսերի փոշոտմանը մասնակցում են նաև թռչուններ և որոշ փոքր կաթնասուններ։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/pollinators/what-is-a-pollinator.htm"
    }
  },
  {
    "id": "fact-insects-1",
    "category": "insects",
    "title": "Մեղուները միակ փոշոտող միջատները չեն",
    "text": "Բույսերի ծաղկափոշին տեղափոխում են նաև թիթեռները, բզեզները, ճանճերն ու այլ միջատներ։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/grsm/learn/nature/pollinators.htm"
    }
  },
  {
    "id": "fact-insects-2",
    "category": "insects",
    "title": "Գիշերային թիթեռները նույնպես փոշոտողներ են",
    "text": "Փոշոտումը չի սահմանափակվում միայն ցերեկով ակտիվ կենդանիներով։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/grsm/learn/nature/pollinators.htm"
    }
  },
  {
    "id": "fact-insects-3",
    "category": "insects",
    "title": "Որոշ ճանճեր օգտակար են ծաղիկներին",
    "text": "Ծաղիկների վրա սնվելիս դրանք կարող են ծաղկափոշի տեղափոխել այլ ծաղիկների վրա։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/grsm/learn/nature/pollinators.htm"
    }
  },
  {
    "id": "fact-insects-4",
    "category": "insects",
    "title": "Բզեզները ևս կարող են փոշոտել",
    "text": "Ծաղիկներ այցելող բզեզների մարմնին կպած ծաղկափոշին տեղափոխվում է հաջորդ ծաղիկը։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/grsm/learn/nature/pollinators.htm"
    }
  },
  {
    "id": "fact-insects-5",
    "category": "insects",
    "title": "Փոշոտող միջատների աշխատանքը կապված է մեր սննդի հետ",
    "text": "Բազմաթիվ պտուղների և սերմերի ստացումը կախված է կենդանիների միջոցով փոշոտումից։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/grsm/learn/nature/pollinators.htm"
    }
  },
  {
    "id": "fact-body-1",
    "category": "body",
    "title": "Մարսողությունը սկսվում է բերանում",
    "text": "Ատամները մանրացնում են սնունդը, իսկ թքի ֆերմենտները սկսում են քայքայել օսլան։",
    "source": {
      "name": "NIH · NIDDK",
      "url": "https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works"
    }
  },
  {
    "id": "fact-body-2",
    "category": "body",
    "title": "Սնունդը կերակրափողով շարժվում է մկանների օգնությամբ",
    "text": "Ալիքաձև կծկումները՝ պերիստալտիկան, սնունդը մղում են առաջ։",
    "source": {
      "name": "NIH · NIDDK",
      "url": "https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works"
    }
  },
  {
    "id": "fact-body-3",
    "category": "body",
    "title": "Սննդանյութերի մեծ մասը ներծծվում է բարակ աղիքում",
    "text": "Դրանք անցնում են արյան կամ ավշային համակարգի մեջ և հասնում մարմնի տարբեր մասեր։",
    "source": {
      "name": "NIH · NIDDK",
      "url": "https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works"
    }
  },
  {
    "id": "fact-body-4",
    "category": "body",
    "title": "Լյարդը մասնակցում է ճարպերի մարսողությանը",
    "text": "Այն արտադրում է լեղի, որն օգնում է ճարպերի մարսման գործընթացին։",
    "source": {
      "name": "NIH · NIDDK",
      "url": "https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works"
    }
  },
  {
    "id": "fact-body-5",
    "category": "body",
    "title": "Աղիքների մանրէները մասնակցում են մարսողությանը",
    "text": "Հաստ աղիքի որոշ բակտերիաներ քայքայում են մնացած նյութերը և արտադրում որոշ վիտամիններ։",
    "source": {
      "name": "NIH · NIDDK",
      "url": "https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works"
    }
  },
  {
    "id": "fact-genetics-1",
    "category": "genetics",
    "title": "ԴՆԹ-ն ունի չորս տեսակի հիմք",
    "text": "Ադենինը, թիմինը, գուանինը և ցիտոզինը սովորաբար նշվում են A, T, G և C տառերով։",
    "source": {
      "name": "NIH · NHGRI",
      "url": "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet"
    }
  },
  {
    "id": "fact-genetics-2",
    "category": "genetics",
    "title": "ԴՆԹ կա նաև միտոքոնդրիումներում",
    "text": "Մարդու ԴՆԹ-ն ամբողջությամբ չի սահմանափակվում բջջի կորիզով։",
    "source": {
      "name": "NIH · NHGRI",
      "url": "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet"
    }
  },
  {
    "id": "fact-genetics-3",
    "category": "genetics",
    "title": "ԴՆԹ-ի ձևը հիշեցնում է ոլորված սանդուղք",
    "text": "Երկու շղթաները կազմում են կրկնակի պարույր, իսկ հիմքերի զույգերը՝ դրա աստիճանները։",
    "source": {
      "name": "NIH · NHGRI",
      "url": "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet"
    },
    "image": "/images/facts/dna.jpg"
  },
  {
    "id": "fact-genetics-4",
    "category": "genetics",
    "title": "Մարդու գենոմն ունի մոտ երեք միլիարդ հիմք",
    "text": "Այս երկար հաջորդականությունը պարունակում է բջիջների աշխատանքի ժառանգական հրահանգները։",
    "source": {
      "name": "NIH · NHGRI",
      "url": "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet"
    }
  },
  {
    "id": "fact-genetics-5",
    "category": "genetics",
    "title": "ԴՆԹ-ն բջջում խիտ փաթեթավորվում է",
    "text": "Փաթեթավորված ԴՆԹ-ն կազմում է քրոմոսոմներ, ինչի շնորհիվ երկար մոլեկուլները տեղավորվում են բջջում։",
    "source": {
      "name": "NIH · NHGRI",
      "url": "https://www.genome.gov/about-genomics/fact-sheets/Deoxyribonucleic-Acid-Fact-Sheet"
    }
  },
  {
    "id": "fact-geology-1",
    "category": "geology",
    "title": "Երկրի արտաքին պինդ շերտը բաժանված է սալերի",
    "text": "Տեկտոնական սալերը շատ դանդաղ շարժվում են միմյանց նկատմամբ։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/geology/plate-tectonics.htm"
    }
  },
  {
    "id": "fact-geology-2",
    "category": "geology",
    "title": "Մայրցամաքների դիրքը մշտական չէ",
    "text": "Սալերի շարժումը միլիոնավոր տարիների ընթացքում փոխում է ցամաքների դասավորությունը։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/geology/plate-tectonics.htm"
    }
  },
  {
    "id": "fact-geology-3",
    "category": "geology",
    "title": "Սալերի բախումը կարող է լեռներ առաջացնել",
    "text": "Բախման ժամանակ երկրակեղևը սեղմվում և բարձրանում է։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/geology/plate-tectonics.htm"
    }
  },
  {
    "id": "fact-geology-4",
    "category": "geology",
    "title": "Սալերը կարող են նաև հեռանալ իրարից",
    "text": "Տարամիտվող սահմաններում կարող են ձևավորվել նոր երկրակեղև և խզվածքային իջվածքներ։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/geology/plate-tectonics.htm"
    }
  },
  {
    "id": "fact-geology-5",
    "category": "geology",
    "title": "Սալերի սահմանները տարբեր կերպ են շարժվում",
    "text": "Դրանք կարող են մոտենալ, հեռանալ կամ սահել իրար կողքով։",
    "source": {
      "name": "ԱՄՆ ազգային պարկերի ծառայություն",
      "url": "https://www.nps.gov/subjects/geology/plate-tectonics.htm"
    }
  },
  {
    "id": "fact-volcanoes-1",
    "category": "volcanoes",
    "title": "Մագման ու լավան տարբեր տեղերում են գտնվում",
    "text": "Հալված ապարը գետնի տակ կոչվում է մագմա, իսկ մակերևույթ դուրս գալուց հետո՝ լավա։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/programs/VHP/about-volcanoes"
    },
    "image": "/images/facts/lava.jpg"
  },
  {
    "id": "fact-volcanoes-2",
    "category": "volcanoes",
    "title": "Մագման միայն հեղուկ ապար չէ",
    "text": "Այն կարող է պարունակել նաև բյուրեղներ և լուծված գազեր։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/programs/VHP/about-volcanoes"
    }
  },
  {
    "id": "fact-volcanoes-3",
    "category": "volcanoes",
    "title": "Հրաբխային մոխիրը այրված փայտի մոխիր չէ",
    "text": "Այն բաղկացած է ապարի և հրաբխային ապակու շատ փոքր բեկորներից։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/programs/VHP/about-volcanoes"
    }
  },
  {
    "id": "fact-volcanoes-4",
    "category": "volcanoes",
    "title": "Բոլոր ժայթքումները պայթյունային չեն",
    "text": "Որոշ դեպքերում լավան համեմատաբար հանգիստ հոսում է հրաբխային անցքից։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/programs/VHP/about-volcanoes"
    }
  },
  {
    "id": "fact-volcanoes-5",
    "category": "volcanoes",
    "title": "Հրաբխային մոխիրը կարող է շատ հեռու հասնել",
    "text": "Մանր մասնիկները քամիներով տեղափոխվում են ժայթքման վայրից մեծ հեռավորությունների վրա։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/programs/VHP/about-volcanoes"
    }
  },
  {
    "id": "fact-weather-1",
    "category": "weather",
    "title": "Գոլորշիացումը ջուրը վերադարձնում է մթնոլորտ",
    "text": "Հեղուկ ջուրը վերածվում է ջրային գոլորշու և տեղափոխվում օդ։",
    "source": {
      "name": "ԱՄՆ ազգային եղանակային ծառայություն",
      "url": "https://www.weather.gov/lot/hydrology_education_watercycle"
    }
  },
  {
    "id": "fact-weather-2",
    "category": "weather",
    "title": "Խտացումը ջրային գոլորշին դարձնում է կաթիլներ",
    "text": "Սառչելիս գոլորշին կարող է վերածվել հեղուկ ջրի և մասնակցել ամպերի ձևավորմանը։",
    "source": {
      "name": "ԱՄՆ ազգային եղանակային ծառայություն",
      "url": "https://www.weather.gov/lot/hydrology_education_watercycle"
    }
  },
  {
    "id": "fact-weather-3",
    "category": "weather",
    "title": "Տեղումները ջրի շրջապտույտի մաս են",
    "text": "Անձրևը և ձյունը ջուրը մթնոլորտից վերադարձնում են Երկրի մակերևույթ։",
    "source": {
      "name": "ԱՄՆ ազգային եղանակային ծառայություն",
      "url": "https://www.weather.gov/lot/hydrology_education_watercycle"
    }
  },
  {
    "id": "fact-weather-4",
    "category": "weather",
    "title": "Բույսերը ջուր են արձակում մթնոլորտ",
    "text": "Տրանսպիրացիայի ընթացքում ջուրը գոլորշիանում է բույսերից, հատկապես տերևներից։",
    "source": {
      "name": "ԱՄՆ ազգային եղանակային ծառայություն",
      "url": "https://www.weather.gov/lot/hydrology_education_watercycle"
    }
  },
  {
    "id": "fact-weather-5",
    "category": "weather",
    "title": "Անձրևաջրի մի մասը հողի մեջ է ներծծվում",
    "text": "Այդ գործընթացը կոչվում է ինֆիլտրացիա և կարող է լրացնել ստորերկրյա ջրերը։",
    "source": {
      "name": "ԱՄՆ ազգային եղանակային ծառայություն",
      "url": "https://www.weather.gov/lot/hydrology_education_watercycle"
    }
  },
  {
    "id": "fact-water-1",
    "category": "water",
    "title": "Սառույցը լողում է ջրի վրա",
    "text": "Սովորական սառույցի խտությունն ավելի փոքր է, քան հեղուկ ջրինը։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/water-science-school/science/water-density"
    },
    "image": "/images/facts/ice.jpg"
  },
  {
    "id": "fact-water-2",
    "category": "water",
    "title": "Քաղցրահամ ջուրն ամենախիտն է մոտ 4°C-ում",
    "text": "Այդ ջերմաստիճանից ավելի սառչելիս հեղուկ ջրի խտությունը սկսում է նվազել։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/water-science-school/science/water-density"
    }
  },
  {
    "id": "fact-water-3",
    "category": "water",
    "title": "Սառչելիս ջուրը կարող է ընդարձակվել",
    "text": "Այդ պատճառով ջրով լի փակ տարան կարող է վնասվել սառցակալման ժամանակ։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/water-science-school/science/water-density"
    }
  },
  {
    "id": "fact-water-4",
    "category": "water",
    "title": "Ջրի խտությունը կախված է լուծված նյութերից",
    "text": "Աղերի և այլ նյութերի առկայությունը փոխում է նույն ծավալի ջրի զանգվածը։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/water-science-school/science/water-density"
    }
  },
  {
    "id": "fact-water-5",
    "category": "water",
    "title": "Մեկ միլիլիտր ջրի զանգվածը մոտ մեկ գրամ է",
    "text": "Սա հարմար մոտարկում է․ ճշգրիտ արժեքը կախված է ջերմաստիճանից և ջրի բաղադրությունից։",
    "source": {
      "name": "ԱՄՆ երկրաբանական ծառայություն",
      "url": "https://www.usgs.gov/water-science-school/science/water-density"
    }
  },
  {
    "id": "fact-physics-1",
    "category": "physics",
    "title": "Տեսանելի լույսը մեծ սպեկտրի փոքր մասն է",
    "text": "Էլեկտրամագնիսական սպեկտրը ներառում է նաև ռադիոալիքներ, ինֆրակարմիր և ռենտգենյան ճառագայթում։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/ems/"
    }
  },
  {
    "id": "fact-physics-2",
    "category": "physics",
    "title": "Ռադիոալիքներն ու լույսը նույն ընտանիքից են",
    "text": "Երկուսն էլ էլեկտրամագնիսական ալիքներ են, բայց ունեն տարբեր ալիքի երկարություններ։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/ems/"
    }
  },
  {
    "id": "fact-physics-3",
    "category": "physics",
    "title": "Ինֆրակարմիր ճառագայթումը մեր աչքը չի տեսնում",
    "text": "Այն կարելի է գրանցել հատուկ սարքերով, այդ թվում՝ ջերմային պատկերահանմամբ։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/ems/"
    }
  },
  {
    "id": "fact-physics-4",
    "category": "physics",
    "title": "Ռենտգենյան ալիքներն ավելի կարճ են, քան տեսանելի լույսինը",
    "text": "Էլեկտրամագնիսական սպեկտրում դրանք ունեն նաև ավելի բարձր հաճախականություն։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/ems/"
    }
  },
  {
    "id": "fact-physics-5",
    "category": "physics",
    "title": "Ալիքի երկարությունն ու հաճախականությունը կապված են",
    "text": "Նույն միջավայրում ավելի կարճ ալիքին համապատասխանում է ավելի բարձր հաճախականություն։",
    "source": {
      "name": "NASA",
      "url": "https://science.nasa.gov/ems/"
    }
  },
  {
    "id": "fact-chemistry-1",
    "category": "chemistry",
    "title": "Էլեկտրոնները բացասական լիցք ունեն",
    "text": "Դրանք էլեկտրական փոխազդեցությամբ կապված են ատոմի դրական լիցքավորված միջուկին։",
    "source": {
      "name": "ԱՄՆ էներգետիկայի նախարարություն",
      "url": "https://www.energy.gov/science/doe-explainselectrons"
    }
  },
  {
    "id": "fact-chemistry-2",
    "category": "chemistry",
    "title": "Չեզոք ատոմի լիցքերը հավասարակշռված են",
    "text": "Էլեկտրոնների թիվը հավասար է միջուկի դրական լիցքերի՝ պրոտոնների թվին։",
    "source": {
      "name": "ԱՄՆ էներգետիկայի նախարարություն",
      "url": "https://www.energy.gov/science/doe-explainselectrons"
    }
  },
  {
    "id": "fact-chemistry-3",
    "category": "chemistry",
    "title": "Ատոմը կարող է դառնալ իոն",
    "text": "Էլեկտրոն կորցնելիս կամ ձեռք բերելիս ատոմը ստանում է ընդհանուր էլեկտրական լիցք։",
    "source": {
      "name": "ԱՄՆ էներգետիկայի նախարարություն",
      "url": "https://www.energy.gov/science/doe-explainselectrons"
    }
  },
  {
    "id": "fact-chemistry-4",
    "category": "chemistry",
    "title": "Էլեկտրոնները չեն պտտվում փոքր մոլորակների նման",
    "text": "Քվանտային նկարագրությունը ցույց է տալիս տարածքներ, որտեղ էլեկտրոնին հանդիպելու հավանականությունը տարբեր է։",
    "source": {
      "name": "ԱՄՆ էներգետիկայի նախարարություն",
      "url": "https://www.energy.gov/science/doe-explainselectrons"
    }
  },
  {
    "id": "fact-chemistry-5",
    "category": "chemistry",
    "title": "Ատոմները կարող են լույս արձակել էներգիա կորցնելիս",
    "text": "Էլեկտրոնի բարձր էներգիական վիճակից ավելի ցածրին անցումը կարող է ուղեկցվել ֆոտոնի արձակմամբ։",
    "source": {
      "name": "ԱՄՆ էներգետիկայի նախարարություն",
      "url": "https://www.energy.gov/science/doe-explainselectrons"
    }
  },
  {
    "id": "fact-technology-1",
    "category": "technology",
    "title": "Համաշխարհային սարդոստայնը ստեղծվել է CERN-ում",
    "text": "Թիմ Բեռներս-Լին այն առաջարկեց 1989 թվականին՝ գիտնականների միջև տեղեկության փոխանակումը հեշտացնելու համար։",
    "source": {
      "name": "CERN",
      "url": "https://home.cern/science/computing/the-birth-of-the-web"
    }
  },
  {
    "id": "fact-technology-2",
    "category": "technology",
    "title": "Առաջին կայքը պատմում էր հենց վեբի մասին",
    "text": "Այն բացատրում էր World Wide Web նախագիծը և աշխատում էր Բեռներս-Լիի NeXT համակարգչում։",
    "source": {
      "name": "CERN",
      "url": "https://home.cern/science/computing/the-birth-of-the-web"
    }
  },
  {
    "id": "fact-technology-3",
    "category": "technology",
    "title": "Վեբի ծրագրակազմը հանրային դարձավ 1993 թվականին",
    "text": "Ապրիլի 30-ին CERN-ը այն տրամադրեց հանրային օգտագործման՝ նպաստելով տարածմանը։",
    "source": {
      "name": "CERN",
      "url": "https://home.cern/science/computing/the-birth-of-the-web"
    }
  },
  {
    "id": "fact-technology-4",
    "category": "technology",
    "title": "Առաջին վեբ համակարգը նաև խմբագրիչ ուներ",
    "text": "Բեռներս-Լիի ստեղծած WorldWideWeb ծրագիրը նախատեսված էր էջերը ոչ միայն դիտելու, այլև խմբագրելու համար։",
    "source": {
      "name": "CERN",
      "url": "https://home.cern/world-wide-web-35/"
    }
  },
  {
    "id": "fact-technology-5",
    "category": "technology",
    "title": "Առաջին կայքի հասցեն կարելի է այցելել նաև այսօր",
    "text": "CERN-ը 2013 թվականին սկսեց վերականգնել առաջին կայքը՝ info.cern.ch հասցեում։",
    "source": {
      "name": "CERN",
      "url": "https://home.cern/science/computing/the-birth-of-the-web"
    }
  },
  {
    "id": "fact-history-1",
    "category": "history",
    "title": "Պապիրուսը պատրաստում էին բույսի ցողունից",
    "text": "Ցողունի միջուկից կտրում էին երկար ու բարակ շերտեր՝ գրելու մակերես ստանալու համար։",
    "source": {
      "name": "Մետրոպոլիտեն թանգարան",
      "url": "https://www.metmuseum.org/art/collection/search/544847"
    }
  },
  {
    "id": "fact-history-2",
    "category": "history",
    "title": "Պապիրուսի թերթերն ունեին խաչվող շերտեր",
    "text": "Մի շերտի վրայով երկրորդ շերտը դասավորում էին ուղղահայաց, հետո սեղմում և չորացնում։",
    "source": {
      "name": "Մետրոպոլիտեն թանգարան",
      "url": "https://www.metmuseum.org/art/collection/search/544847"
    }
  },
  {
    "id": "fact-history-3",
    "category": "history",
    "title": "Հին գրքերը հաճախ գլանափաթեթներ էին",
    "text": "Երկար պապիրուսե գլանափաթեթներ ստանում էին մի քանի թերթերի ծայրերը միացնելով։",
    "source": {
      "name": "Մետրոպոլիտեն թանգարան",
      "url": "https://www.metmuseum.org/art/collection/search/544847"
    }
  },
  {
    "id": "fact-history-4",
    "category": "history",
    "title": "Մագաղաթը պատրաստում էին կենդանու մաշկից",
    "text": "Այն հետագայում դարձավ պապիրուսի մրցակից գրանյութերից մեկը։",
    "source": {
      "name": "Մետրոպոլիտեն թանգարան",
      "url": "https://www.metmuseum.org/art/collection/search/544847"
    }
  },
  {
    "id": "fact-history-5",
    "category": "history",
    "title": "Հին նամակն էլ կարող էր հասցե ունենալ հետևի կողմում",
    "text": "Մետրոպոլիտենի եգիպտական նամակի օրինակը ծալված էր, իսկ հասցեն գրված էր դարձերեսին։",
    "source": {
      "name": "Մետրոպոլիտեն թանգարան",
      "url": "https://www.metmuseum.org/art/collection/search/544847"
    }
  },
  {
    "id": "fact-art-1",
    "category": "art",
    "title": "Հայկական տառերը կարող են թռչունների տեսք ստանալ",
    "text": "Հայկական տառարվեստում զարդագրերը կարող են կազմվել թռչունների ու այլ կենդանիների պատկերներից։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-art-2",
    "category": "art",
    "title": "Տառարվեստը միայն ձեռագրերում չի հանդիպում",
    "text": "Այն կիրառվում է նաև գորգագործության, ասեղնագործության և այլ արհեստների մեջ։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-art-3",
    "category": "art",
    "title": "Տառը կարող է միաժամանակ պատկեր լինել",
    "text": "Զարդագրերում տառաձևը համադրվում է մարդու կամ երևակայական էակի կերպարի հետ։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-art-4",
    "category": "art",
    "title": "Տառարվեստով զբաղվում են տարբեր մասնագետներ",
    "text": "Դրա կրողներից են գեղագիրները, քանդակագործները, ոսկերիչներն ու գորգագործները։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-art-5",
    "category": "art",
    "title": "Հայկական տառարվեստն ունի միջազգային ճանաչում",
    "text": "Այն 2019 թվականին ընդգրկվել է UNESCO-ի մարդկության ոչ նյութական մշակութային ժառանգության ներկայացուցչական ցանկում։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-music-1",
    "category": "music",
    "title": "Դուդուկը սովորաբար պատրաստում են ծիրանենու փայտից",
    "text": "Այդ փայտը գործիքի պատրաստման ավանդական նյութն է։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/duduk-and-its-music-00092"
    }
  },
  {
    "id": "fact-music-2",
    "category": "music",
    "title": "Դուդուկը կրկնակի եղեգնալեզվակով գործիք է",
    "text": "Նրա ձայնն առաջանում է լեզվակի թրթռումից, երբ երաժիշտը օդ է փչում։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/duduk-and-its-music-00092"
    }
  },
  {
    "id": "fact-music-3",
    "category": "music",
    "title": "Դուդուկահարները հաճախ նվագում են զույգով",
    "text": "Մեկը կատարում է մեղեդին, իսկ մյուսը պահում է շարունակական ուղեկցող հնչյունը։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/duduk-and-its-music-00092"
    }
  },
  {
    "id": "fact-music-4",
    "category": "music",
    "title": "Դուդուկը հնչում է կյանքի տարբեր առիթներով",
    "text": "Դրա ավանդական երաժշտությունը կապվում է թե՛ տոնակատարությունների, թե՛ սգո արարողությունների հետ։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/duduk-and-its-music-00092"
    }
  },
  {
    "id": "fact-music-5",
    "category": "music",
    "title": "Դուդուկի համար կան տարբեր չափերի գործիքներ",
    "text": "Գործիքի չափը փոխվում է՝ կախված կատարումից և ցանկալի հնչողությունից։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/duduk-and-its-music-00092"
    }
  },
  {
    "id": "fact-language-1",
    "category": "language",
    "title": "Հայոց գրերի ստեղծումը թվագրվում է 405 թվականով",
    "text": "UNESCO-ի նկարագրությունը այբուբենի ստեղծումը կապում է Մեսրոպ Մաշտոցի հետ։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-language-2",
    "category": "language",
    "title": "Հայկական տառերը ծառայել են նաև որպես թվեր",
    "text": "Գրելուց բացի դրանք կիրառվել են թվային արժեքներ արտահայտելու համար։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-language-3",
    "category": "language",
    "title": "Տառերը կարող են գործածվել գաղտնագրության մեջ",
    "text": "Հայկական գրային մշակույթում դրանք օգտագործվել են նաև գաղտնագրերի և հանելուկների համար։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-language-4",
    "category": "language",
    "title": "Մաշտոցյան այբուբենի հիմքում հնչյունային սկզբունքն է",
    "text": "UNESCO-ի նկարագրությունը դրա կառուցվածքը ներկայացնում է «մեկ տառ՝ մեկ հնչյուն» սկզբունքով։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-language-5",
    "category": "language",
    "title": "Տառարվեստի հմտությունները փոխանցվում են ուսուցմամբ",
    "text": "Դպրոցները, կրթական հաստատությունները և մշակութային կենտրոնները մասնակցում են այդ ավանդույթի պահպանմանը։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/RL/armenian-letter-art-and-its-cultural-expressions-01513"
    }
  },
  {
    "id": "fact-armenia-1",
    "category": "armenia",
    "title": "Հայկական խաչքարագործությունն ընդգրկված է UNESCO-ի ցանկում",
    "text": "Խաչքարերի խորհրդաբանությունն ու պատրաստման արհեստը ցանկում գրանցվել են 2010 թվականին։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/state/armenia-AM?info=elements-on-the-lists"
    }
  },
  {
    "id": "fact-armenia-2",
    "category": "armenia",
    "title": "Քոչարին UNESCO-ի ցանկում է 2017 թվականից",
    "text": "Այն ներկայացված է որպես հայկական ավանդական խմբային պար։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/state/armenia-AM?info=elements-on-the-lists"
    }
  },
  {
    "id": "fact-armenia-3",
    "category": "armenia",
    "title": "Լավաշի պատրաստման ավանդույթը ճանաչվել է UNESCO-ի կողմից",
    "text": "Հայաստանում լավաշի պատրաստումն ու մշակութային նշանակությունը ցանկում ընդգրկվել են 2014 թվականին։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/state/armenia-AM?info=elements-on-the-lists"
    }
  },
  {
    "id": "fact-armenia-4",
    "category": "armenia",
    "title": "Սասունցի Դավթի էպոսի կատարումն ունի միջազգային ճանաչում",
    "text": "Հայկական էպոսի կատարողական ավանդույթը UNESCO-ի ցանկում ընդգրկվել է 2012 թվականին։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/state/armenia-AM?info=elements-on-the-lists"
    }
  },
  {
    "id": "fact-armenia-5",
    "category": "armenia",
    "title": "Գյումրու դարբնագործության ավանդույթը պահպանվող ժառանգություն է",
    "text": "Այն UNESCO-ի ներկայացուցչական ցանկում ընդգրկվել է 2023 թվականին։",
    "source": {
      "name": "UNESCO",
      "url": "https://ich.unesco.org/en/state/armenia-AM?info=elements-on-the-lists"
    }
  }
]
