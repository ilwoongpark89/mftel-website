/* Server context: rack-scale equipment and a cutaway immersion enclosure.
   Server chassis references: GIGABYTE immersion-ready server catalogue.
   Condenser and boiling follow the lab's two-phase research illustration;
   this is not a depiction of GIGABYTE's single-phase cooling circuit. */
window.drawArchiveSystem=(()=>{
 const c=document.querySelector('canvas').getContext('2d'),T=Math.PI*2;
 function path(p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}
 function poly(p,f,s='#8ea2aa66'){path(p);c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=.8;c.stroke()}}
 function rect(x,y,w,h,f,s,r=1){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=.8;c.stroke()}}
 function line(p,s,w=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=s;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke()}
 function dot(x,y,r,f){c.beginPath();c.arc(x,y,r,0,T);c.fillStyle=f;c.fill()}
 function metal(x,w){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#55717d');g.addColorStop(.35,'#a4b4b9');g.addColorStop(1,'#48616e');return g}
 return (kind,time)=>{
  // Rack: repeated server trays, front drive bays, handles and status LEDs.
  poly([[123,81],[160,58],[274,58],[237,81]],'#6b828b');
  poly([[237,81],[274,58],[274,335],[237,359]],'#354d59');
  rect(123,81,114,278,'#425c68','#a9bac18a',3);
  rect(134,93,92,252,'#132a36','#8ca6b277',2);
  for(let j=0;j<9;j++){
   const y=100+j*26;
   rect(140,y,80,22,'#4d6976','#829ca866',1);
   for(let k=0;k<4;k++){rect(146+k*14,y+5,11,11,'#223c49','#8fa5ad55',1);line([[148+k*14,y+13],[154+k*14,y+13]],'#78909b',.7)}
   line([[142,y+6],[142,y+16]],'#becbd0',1.4);line([[217,y+6],[217,y+16]],'#becbd0',1.4);
   dot(209,y+7,1.2,Math.sin(time*1.1+j*2)>.2?'#a4cfbb':'#587d76');
  }
  rect(133,349,13,13,'#526b78');rect(216,349,13,13,'#526b78');
  // Immersion chassis. Back faces first; no translucent foreground veil.
  poly([[290,189],[325,165],[598,165],[563,189]],'#7e959d');
  poly([[325,165],[598,165],[598,315],[325,315]],'#294755');
  poly([[563,189],[598,165],[598,335],[563,359]],metal(563,35));
  poly([[290,338],[325,315],[598,315],[563,338]],'#476a78');
  // Rear fluid and visible free surface behind the upright cartridges.
  poly([[304,260],[334,239],[584,239],[554,260]],'#749aa16b','#a4c7ca88');
  // Two-phase condenser runs across the vapor space, attached to back wall.
  const coil=[[585,185],[338,185],[331,189],[338,196],[574,196],[581,202],[574,208],[337,208]];
  line(coil,'#152f3c',7);line(coil,'#9bb1b9',4.5);line(coil,'#d3dddd77',1);
  for(const x of [363,449,533]){const u=(time*.38+x*.007)%1;dot(x,215+u*23,1.3,'#bfdcdf88')}
  // Three front-facing server cartridges with chips, DIMMs and metal handles.
  for(let j=0;j<3;j++){
   const x=311+j*81,y=239;
   poly([[x,y],[x+9,y-7],[x+72,y-7],[x+63,y]],'#b4c1c4');
   poly([[x+63,y],[x+72,y-7],[x+72,325],[x+63,333]],'#456571');
   rect(x,y,63,94,'#365e59','#a5bab5aa',1);
   line([[x+5,y],[x+5,y-11],[x+57,y-11],[x+57,y]],'#b5c3c7',2.4);
   rect(x+20,y+20,25,25,'#263e43','#9faea7',2);
   rect(x+24,y+24,17,17,metal(x+24,17),'#d1d9d2',1);
   rect(x+20,y+58,25,24,'#263e43','#9faea7',2);
   rect(x+24,y+62,17,16,metal(x+24,17),'#d1d9d2',1);
   for(const dx of [9,50])for(let k=0;k<4;k++)rect(x+dx,y+14+k*17,5,12,'#172f32','#7d9f91',.5);
   for(let k=0;k<6;k++)rect(x+10+k*8,y+87,5,3,'#b9a976');
   for(let k=0;k<6;k++){
    const u=(time*.22+k/6+j*.21)%1;
    const bx=x+22+(k%3)*10+Math.sin(u*5+k)*2,by=y+65-u*64;
    if(by<260)continue;
    c.beginPath();c.arc(bx,by,1.2+u*1.4,0,T);c.strokeStyle='#d3e7dd99';c.lineWidth=.7;c.stroke();
   }
  }
  // Thin liquid surface at the front; the chassis alone closes the bottom.
  line([[301,260],[555,260]],'#b7d6d68c',1);
  rect(290,337,273,22,metal(290,273),'#aec0c38c',2);
  rect(290,189,10,148,metal(290,10),'#9db0b6aa');
  rect(554,189,9,148,metal(554,9),'#9db0b6aa');
  rect(304,360,17,8,'#526b76');rect(536,360,17,8,'#526b76');
 };
})();
