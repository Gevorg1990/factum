import type {GeoSource} from '~/utils/geography/types'
export const countryGovernments:Record<string,{label:string;reviewed:number;source:GeoSource}>={
 GBR:{label:'Սահմանադրական միապետություն · խորհրդարանական կառավարում',reviewed:2026,source:{name:'Մեծ Բրիտանիայի խորհրդարան',url:'https://www.parliament.uk/about/how/role/relations-with-other-institutions/parliament-crown/'}},
 USA:{label:'Դաշնային հանրապետություն · նախագահական կառավարում',reviewed:2026,source:{name:'USAGov · կառավարման համակարգ',url:'https://www.usa.gov/branches-of-government'}}
}
