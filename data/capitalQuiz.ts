export type CapitalPair = {
  countryCode: string
  country: string
  capital: string
  countryAliases: string[]
  capitalAliases: string[]
}

// Armenian labels with English aliases for speech recognition and typed answers.
// Country/capital reference: https://github.com/mledoze/countries
const entries: [string, string, string, string][] = [
  ['Հայաստան', 'Երևան', 'Armenia', 'Yerevan'],
  ['Վրաստան', 'Թբիլիսի', 'Georgia', 'Tbilisi'],
  ['Ֆրանսիա', 'Փարիզ', 'France', 'Paris'],
  ['Գերմանիա', 'Բեռլին', 'Germany', 'Berlin'],
  ['Իտալիա', 'Հռոմ', 'Italy', 'Rome'],
  ['Իսպանիա', 'Մադրիդ', 'Spain', 'Madrid'],
  ['Պորտուգալիա', 'Լիսաբոն', 'Portugal', 'Lisbon'],
  ['Հունաստան', 'Աթենք', 'Greece', 'Athens'],
  ['Միացյալ Թագավորություն', 'Լոնդոն', 'United Kingdom', 'London'],
  ['Իռլանդիա', 'Դուբլին', 'Ireland', 'Dublin'],
  ['Ավստրիա', 'Վիեննա', 'Austria', 'Vienna'],
  ['Լեհաստան', 'Վարշավա', 'Poland', 'Warsaw'],
  ['Չեխիա', 'Պրահա', 'Czechia', 'Prague'],
  ['Հունգարիա', 'Բուդապեշտ', 'Hungary', 'Budapest'],
  ['Ռումինիա', 'Բուխարեստ', 'Romania', 'Bucharest'],
  ['Բուլղարիա', 'Սոֆիա', 'Bulgaria', 'Sofia'],
  ['Շվեդիա', 'Ստոկհոլմ', 'Sweden', 'Stockholm'],
  ['Նորվեգիա', 'Օսլո', 'Norway', 'Oslo'],
  ['Ֆինլանդիա', 'Հելսինկի', 'Finland', 'Helsinki'],
  ['Դանիա', 'Կոպենհագեն', 'Denmark', 'Copenhagen'],
  ['Նիդերլանդներ', 'Ամստերդամ', 'Netherlands', 'Amsterdam'],
  ['Կանադա', 'Օտտավա', 'Canada', 'Ottawa'],
  ['ԱՄՆ', 'Վաշինգտոն', 'United States', 'Washington'],
  ['Ճապոնիա', 'Տոկիո', 'Japan', 'Tokyo'],
  ['Չինաստան', 'Պեկին', 'China', 'Beijing'],
  ['Հնդկաստան', 'Նյու Դելի', 'India', 'New Delhi'],
  ['Ավստրալիա', 'Կանբերա', 'Australia', 'Canberra'],
  ['Բրազիլիա', 'Բրազիլիա', 'Brazil', 'Brasilia'],
  ['Արգենտինա', 'Բուենոս Այրես', 'Argentina', 'Buenos Aires'],
  ['Եգիպտոս', 'Կահիրե', 'Egypt', 'Cairo'],
  ['Իրան', 'Թեհրան', 'Iran', 'Tehran'],
  ['Ռուսաստան', 'Մոսկվա', 'Russia', 'Moscow'],
]

const countryCodes = ['ARM', 'GEO', 'FRA', 'DEU', 'ITA', 'ESP', 'PRT', 'GRC', 'GBR', 'IRL', 'AUT', 'POL', 'CZE', 'HUN', 'ROU', 'BGR', 'SWE', 'NOR', 'FIN', 'DNK', 'NLD', 'CAN', 'USA', 'JPN', 'CHN', 'IND', 'AUS', 'BRA', 'ARG', 'EGY', 'IRN', 'RUS']

export const capitalPairs: CapitalPair[] = entries.map(([country, capital, countryEnglish, capitalEnglish], index) => ({
  countryCode: countryCodes[index]!, country, capital, countryAliases: [countryEnglish], capitalAliases: [capitalEnglish],
}))
capitalPairs.find(pair => pair.countryCode === 'ARM')!.capitalAliases.push('Erevan', 'Երեվան')
capitalPairs.find(pair => pair.country === 'ԱՄՆ')!.countryAliases.push('Ամերիկայի Միացյալ Նահանգներ', 'Միացյալ Նահանգներ', 'USA', 'US', 'United States of America')
capitalPairs.find(pair => pair.country === 'ԱՄՆ')!.capitalAliases.push('Washington DC', 'Washington D.C.', 'Վաշինգտոն Դի Սի')
capitalPairs.find(pair => pair.countryCode === 'GBR')!.countryAliases.push('Մեծ Բրիտանիա', 'Մեծ Բրիտանիայի և Հյուսիսային Իռլանդիայի Միացյալ Թագավորություն', 'UK', 'Great Britain')
capitalPairs.find(pair => pair.country === 'Չեխիա')!.countryAliases.push('Չեխիայի Հանրապետություն', 'Czech Republic')
capitalPairs.find(pair => pair.country === 'Բրազիլիա')!.capitalAliases.push('Բրազիլյա', 'Brasília')
capitalPairs.find(pair => pair.country === 'Հնդկաստան')!.capitalAliases.push('Նյու-Դելի')
