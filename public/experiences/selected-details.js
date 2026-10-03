/* Heated tube cutaway; preserved round50 five-channel detail. */
/* Fixed axonometric research sections. Motion illustrates phenomena, not measured data. */
window.drawArchiveDetail=(()=>{
 const c=document.querySelector('canvas').getContext('2d'),tau=Math.PI*2;
 // Same projection and scale as the approved chip-cooling scene.
 const project=(x,y,z=0)=>[360+(x*.92-y*.64)*1.03,245+(x*.32+y*.53-z)*1.03];
 function path(points,close=false){c.beginPath();points.forEach((p,i)=>{const [x,y]=project(...p);i?c.lineTo(x,y):c.moveTo(x,y)});if(close)c.closePath()}
 function poly(p,fill,stroke){path(p,true);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.7;c.stroke()}}
 function line(p,color,width=1){path(p);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
 function box(x,y,w,d,z,h,top,front,side,stroke='#91a4ae66'){
  poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],side);
  poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],front);
  poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top,stroke);
 }
 function dot(p,r,color){const [x,y]=project(...p);c.beginPath();c.arc(x,y,r,0,tau);c.fillStyle=color;c.fill()}
 function tube(p,w=9){line(p,'#17262f',w+2);line(p,'#9cabb1',w);line(p,'#526873',w-2);line(p,'#7c91994d',w-5)}
 const mix=(a,b,u)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*u)).join(',')})`;
 function storage(time){
  // Longitudinal cutaway of a heated tube. The lower surface is the tube wall,
  // not a separate support. Fixed geometry; only the internal fluid moves.
  const start=[146,286],end=[574,137];
  const angle=Math.atan2(end[1]-start[1],end[0]-start[0]);
  const L=Math.hypot(end[0]-start[0],end[1]-start[1]),R=37,inner=28;
  c.save();c.translate(...start);c.rotate(angle);
  const shape=(x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r)};
  const metal=c.createLinearGradient(0,-R,0,R);
  metal.addColorStop(0,'#c2cdd0');metal.addColorStop(.13,'#6b828c');
  metal.addColorStop(.47,'#344f5c');metal.addColorStop(.78,'#81989c');metal.addColorStop(1,'#364b52');
  shape(0,-R,L,R*2,7);c.fillStyle=metal;c.fill();
  // Dark interior and a warm, continuous lower wall convey the cut depth.
  const fluid=c.createLinearGradient(0,0,L,0);
  fluid.addColorStop(0,'#255b78');fluid.addColorStop(.38,'#497d90');fluid.addColorStop(1,'#9faeaa');
  shape(10,-inner,L-20,inner*2,3);c.fillStyle=fluid;c.fill();
  c.save();c.clip();
  const depth=c.createLinearGradient(0,-inner,0,inner);
  depth.addColorStop(0,'#122b394d');depth.addColorStop(.45,'#a8d0d20d');depth.addColorStop(1,'#122c3d66');
  c.fillStyle=depth;c.fillRect(0,-inner,L,inner*2);
  // Thin liquid streaks continue beneath the increasingly vapor-rich core.
  for(let j=0;j<4;j++){
   c.beginPath();for(let x=9;x<L-8;x+=4){const y=19+j*1.6+Math.sin(x*.027-time*1.7+j)*.9;x===9?c.moveTo(x,y):c.lineTo(x,y)}
   c.strokeStyle='#d0e0d02b';c.lineWidth=.7;c.stroke();
  }
  for(let j=0;j<38;j++){
   const u=(time*.052+j/38)%1,x=9+u*(L-18);
   const grow=Math.max(0,(u-.18)/.82),lane=Math.sin(j*2.399);
   if(grow===0){
    c.beginPath();c.moveTo(x-6,lane*16);c.lineTo(x+3,lane*16);
    c.strokeStyle='#b5d8e77d';c.lineWidth=.85;c.stroke();continue;
   }
   const rx=1+grow*17,ry=1+grow*7.3;
   const y=lane*(17-grow*6)-grow*4;
   c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);
   c.fillStyle='#e9eee31c';c.fill();c.strokeStyle='#e3eee0ae';c.lineWidth=.85;c.stroke();
   c.beginPath();c.ellipse(x-1,y-1,rx*.72,ry*.63,0,Math.PI*1.1,Math.PI*1.8);
   c.strokeStyle='#f4f8e84d';c.lineWidth=.65;c.stroke();
  }
  // Discrete wall nucleation sites feed the same downstream flow.
  for(let j=0;j<9;j++){
   const age=(time*.75+j*.37)%1,x=L*(.28+j*.067)+age*11;
   c.beginPath();c.arc(x,25-age*10,.7+age*2.1,0,tau);
   c.strokeStyle=`rgba(226,230,207,${.6*(1-age)})`;c.lineWidth=.8;c.stroke();
  }
  c.restore();
  const warm=c.createLinearGradient(0,0,L,0);
  warm.addColorStop(0,'#849a9e');warm.addColorStop(.35,'#b8a17a');warm.addColorStop(.8,'#d0ac75');warm.addColorStop(1,'#93a5a5');
  c.fillStyle=warm;c.fillRect(10,29,L-20,4);
  c.beginPath();c.moveTo(10,-29);c.lineTo(L-10,-29);
  c.strokeStyle='#d4dfe1a8';c.lineWidth=1.2;c.stroke();
  // Open annular ends make wall thickness and hollow bore unambiguous.
  for(const x of [0,L]){
   c.beginPath();c.ellipse(x,0,8,R,0,0,tau);c.fillStyle='#98adb3';c.fill();
   c.strokeStyle='#d0daddb3';c.lineWidth=.9;c.stroke();
   c.beginPath();c.ellipse(x,0,5,inner,0,0,tau);
   c.fillStyle=x?'#a7b9b2':'#2e6078';c.fill();c.strokeStyle='#294653';c.stroke();
   c.beginPath();c.ellipse(x-1,0,7,R-2,0,Math.PI*.55,Math.PI*1.48);
   c.strokeStyle='#e0e7e57d';c.lineWidth=.8;c.stroke();
  }
  c.restore();
 }
 function channels(time){
  // The vertical five-channel section follows smr-channels-modern-v5.webp.
  const q=(x,y)=>[238+x*.88,65+y+x*.16];
  const face=(points,fill,edge)=>{c.beginPath();points.forEach(([x,y],i)=>{const p=q(x,y);i?c.lineTo(...p):c.moveTo(...p)});c.closePath();c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=.9;c.stroke()}};
  // A single thin plate, with modest depth on the right edge.
  const a=q(264,0),b=q(264,287);c.beginPath();c.moveTo(...a);c.lineTo(a[0]+21,a[1]-12);c.lineTo(b[0]+21,b[1]-12);c.lineTo(...b);c.closePath();c.fillStyle='#3c5768';c.fill();
  const top=q(0,0);c.beginPath();c.moveTo(...top);c.lineTo(top[0]+21,top[1]-12);c.lineTo(a[0]+21,a[1]-12);c.lineTo(...a);c.closePath();c.fillStyle='#7c929e';c.fill();
  face([[0,0],[264,0],[264,287],[0,287]],'#728995','#b5c7d088');
  face([[14,18],[250,18],[250,42],[14,42]],'#456d83','#a0c0ce77');
  face([[14,244],[250,244],[250,269],[14,269]],'#426f88','#a0c0ce77');
  for(let j=0;j<5;j++){
   const x=34+j*48;
   face([[x-9,42],[x+9,42],[x+9,244],[x-9,244]],'#3f728e','#b2cbd599');
   const p=q(x-12,45),r=q(x-12,241);c.beginPath();c.moveTo(...p);c.lineTo(...r);c.strokeStyle='#c3a476';c.lineWidth=2;c.stroke();
   // Only velocity and void fraction vary; the channel walls remain fixed.
   const phase=j*tau/5,velocity=time*.065-.027*Math.cos(time*.65+phase),onset=.3+.08*Math.sin(time*.65+phase);
   for(let k=0;k<11;k++){
    const u=(velocity+k/11+10)%1,v=Math.max(0,(u-onset)/(1-onset)),p=q(x,239-u*190);
    c.beginPath();c.ellipse(p[0],p[1],v?1.3+v*3.1:.8,v?1.6+v*6:.8,0,0,tau);c.fillStyle=v?'#d9e5df20':'#a4c9dc88';c.fill();if(v){c.strokeStyle='#cee3e8b3';c.lineWidth=.7;c.stroke()}
   }
  }
  // Shared upper outlet and lower inlet meet the open headers.
  for(const [y,other] of [[18,-16],[269,308]]){const p=q(132,y),r=q(132,other);c.beginPath();c.moveTo(...p);c.lineTo(...r);c.strokeStyle='#9fb4bf';c.lineWidth=13;c.stroke();c.strokeStyle='#476b7f';c.lineWidth=8;c.stroke()}
 }
 return time=>document.body.dataset.scene==='tes'?storage(time):channels(time);
})();
