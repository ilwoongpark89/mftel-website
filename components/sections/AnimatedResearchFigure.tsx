"use client";
import { useEffect, useRef } from "react";

export default function AnimatedResearchFigure({kind,index,title,isKR}:{kind:"tes"|"cooling"|"smr";index:0|1;title:string;isKR:boolean}){
 const ref=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;let visible=false;
  const send=()=>el.contentWindow?.postMessage({type:"lab-visibility",visible},location.origin);
  const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;send()},{threshold:.05});
  io.observe(el);el.addEventListener("load",send);
  return()=>{io.disconnect();el.removeEventListener("load",send)};
 },[]);
 return <iframe ref={ref} src={`/experiences/${kind}.html?figure=${index}&lang=${isKR?"ko":"en"}`} title={title} loading="lazy" style={{display:"block",width:"100%",aspectRatio:"3 / 2",border:0}} />;
}
