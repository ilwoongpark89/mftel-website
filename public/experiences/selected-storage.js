/* Selected from round08. Original geometry/materials retained; shared lifecycle, no embedded labels, continuous charge/recovery cycle. */
window.drawArchiveStorage = (() => {
 const tr=s=>s;
 const kind=document.body.dataset.scene,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),pause=document.getElementById('pause'),copy=document.getElementById('description');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let mode=0,blend=0,targetBlend=0,narrativeProgress=0,time=0,age=0,visible=false,enabled=!reduced.matches,raf=0,last=0,w=0,h=0,dpr=1,mobile=false;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 function line(p,c='#827666',width=1,dash=[]){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=c;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
 function text(){} // Labels belong to the surrounding page in the paired layout.
 function box(x,y,ww,hh,fill,stroke,r=0){ctx.beginPath();ctx.roundRect(x,y,ww,hh,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
 function ellipse(x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
 function arrow(x,y,dir,color){ctx.save();ctx.translate(x,y);ctx.rotate(dir);line([[-5,-4],[0,0],[-5,4]],color,1.2);ctx.restore()}
 function paths(p,color,speed=24){const lengths=p.slice(1).map((q,i)=>Math.hypot(q[0]-p[i][0],q[1]-p[i][1])),total=lengths.reduce((a,b)=>a+b,0);for(let n=0;n<6;n++){let d=(time*speed+n*total/6)%total,j=0;while(d>lengths[j]&&j<lengths.length-1){d-=lengths[j];j++}const f=d/lengths[j],x=p[j][0]+(p[j+1][0]-p[j][0])*f,y=p[j][1]+(p[j+1][1]-p[j][1])*f;arrow(x,y,Math.atan2(p[j+1][1]-p[j][1],p[j+1][0]-p[j][0]),color)}}
 let seed=47389;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}const grains=Array.from({length:2600},()=>({x:rand(),y:rand(),r:.5+rand()*1.15,c:rand()}));
 const grainTexture=document.createElement('canvas');grainTexture.width=488;grainTexture.height=470;
 const grainCtx=grainTexture.getContext('2d');grainCtx.scale(2,2);
 for(const g of grains){grainCtx.fillStyle=`rgba(238,205,145,${.08+g.c*.31})`;grainCtx.beginPath();grainCtx.ellipse(g.x*244,g.y*235,g.r,g.r*.65,g.c*3,0,Math.PI*2);grainCtx.fill();}

 function sand(recover=false){
  const hot=.45+.38*(1-Math.exp(-age/8));
  // Insulated cylindrical store, with a section through the packed sand bed.
  const shell=ctx.createLinearGradient(221,0,497,0);shell.addColorStop(0,'#232a29');shell.addColorStop(.5,'#4b514b');shell.addColorStop(1,'#242b28');
  box(222,90,277,260,shell,'#74776a');ellipse(360,350,138,27,'#212825','#74776a');ellipse(360,90,138,27,'#363e36','#9c9c86');
  ellipse(360,95,122,20,'#292b24','#a39a7a');
  ctx.save();ctx.beginPath();ctx.rect(238,107,244,237);ctx.clip();
  const fill=ctx.createLinearGradient(0,108,0,345);
  if(recover){const discharge=clamp((narrativeProgress-.5)*2);fill.addColorStop(0,`rgb(${150-30*discharge},${118-14*discharge},79)`);fill.addColorStop(.5,`rgb(${175-28*discharge},${133-18*discharge},86)`);fill.addColorStop(1,'#b18150');}
  else{fill.addColorStop(0,'#8c724e');fill.addColorStop(.6,'#a27849');fill.addColorStop(1,`rgb(${155+Math.round(hot*51)},${101+Math.round(hot*30)},64)`);}
  ctx.fillStyle=fill;ctx.fillRect(238,107,244,237);
  ctx.drawImage(grainTexture,238,108,244,235);
  // The sand and water stay separated by the tube wall.
  const tube=[[222,145],[459,145],[459,202],[255,202],[255,259],[459,259],[459,316],[499,316]];
  line(tube,'#222b2b',13);line(tube,'#9baaa5',10);line(tube,'#3a575c',6);
  if(recover){
   // Fluid warms along the tube path, including each return bend.
   const colors=['#8db8c3','#94b7bd','#afbcaf','#c6c6ac','#d8ceac','#e3d5b2','#eadfc6'];
   for(let j=1;j<tube.length;j++)line([tube[j-1],tube[j]],colors[j-1],5);
   paths(tube,'#e9eee3aa',35);
   // Heat crosses the wall; the storage medium never mixes with the water.
   for(let j=0;j<3;j++)for(const xx of [300,375,425]){const yy=145+j*57,phase=(time*.6+j*.2)%1;const alpha=Math.sin(phase*Math.PI)*.6;line([[xx,yy+21],[xx,yy+8]],`rgba(237,182,107,${alpha})`,1.2);arrow(xx,yy+8,-Math.PI/2,`rgba(237,182,107,${alpha})`);}

   // Bubbles are constrained to horizontal tube sections.
   for(let row=0;row<2;row++)for(let i=0;i<7;i++){
    const yy=202+row*57,forward=row!==0,phase=(time*24+i*29)%192;
    const xx=forward?260+phase:453-phase;ellipse(xx,yy,2+row*.6,1.6,'#e2ddbfbb');
   }
  }else{ctx.shadowColor='#e89a50';ctx.shadowBlur=6;for(let i=0;i<4;i++){const yy=172+i*43;line([[268,yy],[434,yy]],`rgba(232,161,95,${hot*.55})`,1.7)}ctx.shadowBlur=0;}
  ctx.restore();line([[238,108],[238,344],[482,344],[482,108]],'#b7b19a66',1);
  line([[222,145],[238,145]],'#91a4a4',8);line([[482,316],[499,316]],'#91a4a4',8);
  ellipse(360,107,122,18,'#d8ae6d24','#b7aa8166');
  const electric=[[96,275],[168,275],[168,301],[241,301]],water=[[90,145],[222,145]],steam=[[499,316],[573,316],[573,145],[638,145]];
  line(water,'#789eaa',3);line(steam,'#b69b75',3);
  if(recover){paths(water,'#afccd4',29);paths(steam,'#e0c59d',31);}
  else{line(electric,'#b38c61',2);paths(electric,'#e7b78a',28);text(tr('전기 → 열'),124,245,15,'#d6b18a');}
  text(tr('급수'),119,120,15,'#a6c4cd');text(tr('증기 공급'),609,119,15,'#dfc09b');
  text(tr('모래 축열조'),360,403,17,'#d5cab9');
 }
 return elapsed=>{
  time=elapsed;narrativeProgress=.5-.5*Math.cos(elapsed*Math.PI*2/18);age=narrativeProgress*28;
  const u=clamp((narrativeProgress-.46)/.08),a=u*u*(3-2*u);
  if(a<1){ctx.save();ctx.globalAlpha=1-a;sand(false);ctx.restore()}
  if(a>0){ctx.save();ctx.globalAlpha=a;sand(true);ctx.restore()}
 };
})();
