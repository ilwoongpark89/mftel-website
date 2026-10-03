/* Theme-specific artwork: matte transparent assets on home; original light artwork
   on research. Motion is spatially registered over
   the existing fluid regions; no camera movement or replacement geometry. */
window.referenceMotion=(()=>{
 const c=document.querySelector('canvas').getContext('2d'),T=Math.PI*2;
 const files={tes:['tes-sand-modern-v4.webp','tes-salt-modern-v4.webp'],cooling:['cooling-immersion-modern-v4.webp',null],smr:['smr-plant-modern-v4.webp','smr-channels-modern-v5.webp']};
 const images={};const jobs=[];
 const activeKind=document.body.dataset.scene,selected=new URLSearchParams(location.search).get("figure");
 for(const [kind,names]of Object.entries(files))names.forEach((name,i)=>{
  if(!name||kind!==activeKind||(selected!==null&&i!==Number(selected)))return;
  const img=new Image();
  jobs.push(new Promise((resolve,reject)=>{
   img.onload=()=>{
    // Cache theme toning once. Animated frames only composite a prepared surface.
    const layer=document.createElement('canvas');layer.width=1200;layer.height=800;
    const paint=layer.getContext('2d');paint.imageSmoothingEnabled=true;paint.imageSmoothingQuality='high';
    // Palette and material are authored in the asset, not approximated with a filter.
    paint.drawImage(img,0,0,1200,800);images[kind+i]=layer;resolve();
   };
   img.onerror=reject;
  }));
  img.src=(selected===null?'/images/research/matte/':'/images/research/')+name;
 });
 const ready=Promise.all(jobs);ready.then(()=>dispatchEvent(new Event('reference-ready')));
 function path(p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath()}
 function clip(p){path(p);c.clip()}
 function bubble(x,y,r,alpha=1){c.save();c.globalAlpha=alpha;c.beginPath();c.ellipse(x,y,r,r*1.05,0,0,T);c.fillStyle='#d4dfd84d';c.fill();c.strokeStyle='#93ada3aa';c.lineWidth=1.4;c.stroke();c.beginPath();c.arc(x-r*.18,y-r*.12,r*.66,3.6,5.1);c.strokeStyle='#e6eee6b3';c.lineWidth=1.3;c.stroke();c.restore()}
 function flow(points,time,col='#93ada3',speed=45,count=9){const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);const at=d=>{let k=0;while(k<lengths.length-1&&d>lengths[k])d-=lengths[k++];const u=d/lengths[k];return points[k].map((v,j)=>v+(points[k+1][j]-v)*u)};for(let i=0;i<count;i++){const d=(time*speed+i*total/count)%total,a=at(d),b=at(Math.min(total,d+9));c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';c.stroke()}}
 function sand(t){
  c.save();clip([[323,296],[943,234],[943,258],[323,323]]);
  for(let j=0;j<39;j++){const u=(t*.055+j/39)%1,x=325+u*615,y=309-u*63,v=Math.max(0,(u-.30)/.7);if(v)bubble(x,y+Math.sin(j*2.4)*6,1+v*5,.85);else flow([[x-3,y],[x+4,y]],0,'#b9cfc9',1,1)}c.restore();
  flow([[11,312],[115,302]],t,'#c1d0c6',40,3);flow([[1096,209],[1181,202]],t,'#d9cda7',50,3);
 }
 function salt(t){
  flow([[280,182],[280,168],[285,157],[299,154],[894,185],[907,192],[916,209],[916,337],[922,350],[940,357]],t,'#d9cda7',55,12);
  flow([[943,483],[897,480],[882,468],[877,450],[877,257],[873,240],[861,229],[683,223],[668,228],[662,240]],t,'#bdd0ca',55,9);
  flow([[1065,362],[1176,367]],t,'#d9cda7',60,3);flow([[1175,494],[1065,488]],t,'#bdd0ca',60,3);
 }
 function immersion(t){
  // Bubbles begin at the exposed chips and terminate at the original free surface.
  for(const [x,y,top]of [[363,480,335],[539,497,346],[718,506,358]]){
   c.save();clip([[x-22,top],[x+34,top],[x+34,y+37],[x-22,y+37]]);
   for(let j=0;j<15;j++){const u=(t*.19+j/15+x*.007)%1;const bx=x+Math.sin(j*2.39)*22+Math.sin(u*6+j)*2; bubble(bx,y+25-u*(y+25-top),1.6+u*2.8,.75)}c.restore();
  }
  for(const x of [361,560,748]){const u=(t*.37+x*.009)%1;const y=267+u*58;c.beginPath();c.ellipse(x,y,2.4,4,0,0,T);c.fillStyle='#b1c8c399';c.fill()}
  flow([[217,193],[878,207],[891,217],[886,226],[229,213]],t,'#d9cda7',50,12);
 }
 function plant(t){
  flow([[292,452],[292,304],[292,277]],t,'#bdd0ca99',29,6);
  flow([[258,292],[254,368],[257,484]],t,'#93ada399',27,6);
  flow([[325,266],[698,304],[716,313],[718,351]],t,'#d9cda7',65,9);
  flow([[914,585],[412,550],[398,538],[395,429],[385,419],[327,410]],t,'#bdd0ca',53,10);
 }
 function channels(t){
  // Original is 1536 x 1024, displayed in a common 1200 x 800 coordinate system.
  c.save();c.scale(1200/1536,800/1024);
  const lanes=[{x:603,top:197,bottom:751},{x:663,top:204,bottom:765},{x:725,top:214,bottom:778},{x:786,top:224,bottom:791},{x:848,top:235,bottom:805}];
  lanes.forEach((q,j)=>{c.save();clip([[q.x-17,q.top],[q.x+17,q.top+4],[q.x+17,q.bottom],[q.x-17,q.bottom-5]]);const phase=j*T/5,progress=t*.10-.032*Math.cos(t*.65+phase);for(let k=0;k<17;k++){const u=(progress+k/17+20)%1,r=1.1+u*4.8; bubble(q.x+Math.sin(k*2.3)*8,q.bottom-u*(q.bottom-q.top),r,.80)}c.restore()});
  flow([[721,130],[721,66]],t,'#bdd0ca',28,3);c.restore();
 }
 function draw(kind,index,time){
  const img=images[kind+index];if(!img)return;
  c.imageSmoothingQuality="high";c.drawImage(img,0,0,1200,800);
  if(kind==='tes')(index?salt:sand)(time);else if(kind==='cooling')immersion(time);else(index?channels:plant)(time);
 }
 return {draw,ready};
})();
