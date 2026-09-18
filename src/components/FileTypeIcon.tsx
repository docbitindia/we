import React from 'react';
export type FileType='excel'|'csv'|'json';
interface Props{type:FileType;size?:number;className?:string;}
export function FileTypeIcon({type,size=28,className=''}:Props){
  const src = type==='excel' ? '/file-icons/excel.svg' : type==='csv' ? '/file-icons/csv.svg' : '/file-icons/json.svg';
  return <img src={src} width={size} height={size} className={`shrink-0 object-contain ${className}`} alt={`${type.toUpperCase()} file`} loading="lazy" decoding="async"/>;
}
export function fileTypeFromName(name:string):FileType{const lower=name.toLowerCase();if(lower.endsWith('.csv'))return'csv';if(lower.endsWith('.json'))return'json';return'excel';}
