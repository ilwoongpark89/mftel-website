/* Integral PWR module cutaway; structural reference: NuScale WP-178373,
   Fig. 1. Simplified research illustration, not an exact vendor drawing.
   Liquid primary coolant rises through the core/riser, returns outside it.
   Steam generation belongs to the separate helical secondary tubes. */
window.drawSelectedPlant=(()=>{
 const c=document.querySelector('canvas').getContext('2d'),T=Math.PI*2;
 function line(p,s,w=1){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=s;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke()}
 function oval(x,y,rx,ry,f,s){c.beginPath();c.ellipse(x,y,rx,ry,0,0,T);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=.8;c.stroke()}}
 function rect(x,y,w,h,f,s,r=0){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=.8;c.stroke()}}
 function metal(x,w){const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#4b6471');g.addColorStop(.26,'#a6b8bd');g.addColorStop(.6,'#6d8793');g.addColorStop(1,'#334f5f');return g}
 function vessel(x,y,w,h,f,s){c.beginPath();c.moveTo(x,y+35);c.bezierCurveTo(x,y-12,x+w,y-12,x+w,y+35);c.lineTo(x+w,y+h-22);c.bezierCurveTo(x+w,y+h+9,x,y+h+9,x,y+h-22);c.closePath();c.fillStyle=f;c.fill();if(s){c.strokeStyle=s;c.lineWidth=1;c.stroke()}}
 return time=>{
  // A single tall containment; broad metal shoulders surround a cut section.
  const x=251,y=54,w=211,h=318;
  oval(356,371,109,17,'#38515f','#879da777');
  vessel(x,y,w,h,metal(x,w),'#b0c2c8aa');
  // Upper service connections attach directly to the domed head.
  for(const dx of [-26,0,26]){
   rect(350+dx,35,9,32,metal(350+dx,9),'#b1c2c7aa',2);
   oval(354.5+dx,35,4.5,2,'#c3cdd0','#9bafb9');
  }
  oval(356,101,105,15,null,'#d4dedd70');
  oval(356,107,105,15,null,'#233d4d99');
  // Fasteners on the containment head flange, all on the same ellipse.
  for(let i=0;i<13;i++){const a=i*Math.PI/12;oval(356+98*Math.cos(a),104+14*Math.sin(a),2,2.6,'#bccace','#344e5e')}
  vessel(272,120,169,235,'#17313f','#c1d0ceaa');
  // Distinct inner pressure boundary, separated from containment by a dark gap.
  vessel(290,132,134,211,metal(290,134),'#c5d3d4b3');
  vessel(301,143,112,188,'#284d61','#96b3b9aa');
  // Pressurizer region and the upper separator inside the pressure vessel.
  oval(357,168,50,10,'#375d70','#9ab7c188');
  line([[309,183],[404,183]],'#a2b9c066',1);
  // Helical steam-generator sections flank the central hot riser.
  for(const cx of [324,391]){
   for(let j=0;j<9;j++)oval(cx,197+j*9,12,4.1,null,'#aa8b6099');
  }
  // Central riser has its own cylindrical edges, rather than a loose arrow.
  rect(345,184,25,105,'#416b7d','#9ab9c277',9);
  const hot=c.createLinearGradient(345,0,370,0);hot.addColorStop(0,'#315267');hot.addColorStop(.5,'#729ca9');hot.addColorStop(1,'#365d72');
  rect(348,187,19,98,hot,null,5);
  // Core barrel and fuel bundle, seated in the lower pressure-vessel head.
  oval(357,318,28,7,'#647f88','#acbfc088');
  rect(328,286,58,31,'#6c644e','#a6b5af66',4);
  for(let j=0;j<8;j++){
   line([[333+j*6.5,289],[333+j*6.5,315]],'#524936',4);
   line([[332.5+j*6.5,289],[332.5+j*6.5,315]],'#d2b17b',2.2);
  }
  oval(357,286,29,6,'#829395','#c3cdca88');
  for(let j=0;j<6;j++)oval(337+j*8,286,1.8,1.4,'#384f56');
  // Draw near halves of coil turns after the riser: consistent depth order.
  for(const cx of [324,391])for(let j=0;j<9;j++){
   c.beginPath();c.ellipse(cx,197+j*9,12,4.1,0,0,Math.PI);
   c.strokeStyle='#d2b98d';c.lineWidth=1.5;c.stroke();
  }
  // Small moving liquid streaks explain circulation without boiling the primary.
  for(let j=0;j<5;j++){
   const u=(time*.10+j/5)%1;
   line([[357,277-u*86],[357,271-u*86]],'#c3dde199',1.5);
   for(const xx of [307,407])line([[xx,190+u*114],[xx,195+u*114]],'#97c9d899',1.2);
  }
  // Two short secondary connections terminate at the containment boundary.
  for(const [yy,col] of [[197,'#d2ae7d'],[265,'#8fbdcf']]){
   line([[403,yy],[469,yy],[483,yy-9]],'#233e4d',8);
   line([[403,yy],[469,yy],[483,yy-9]],'#a3b6ba',5.5);
   line([[403,yy],[469,yy],[483,yy-9]],col,2.3);
   oval(483,yy-9,3.4,5,'#536e7a','#becdce99');
  }
  // Cut faces and lower mounting ring close the assembly, with no floating base.
  line([[278,145],[278,330]],'#c9d2ce88',2);
  line([[436,145],[436,330]],'#6e8a9677',2);
  oval(356,363,103,14,null,'#a7bac199');
 };
})();
