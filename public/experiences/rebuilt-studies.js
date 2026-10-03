/* Single-object studies using the approved chip scene's projection and palette.
   Fixed geometry; temperature and flow alone animate. All dimensions illustrative. */
window.drawRebuiltStudy=(()=>{
 const c=document.querySelector('canvas').getContext('2d'),T=Math.PI*2;
 const P=(x,y,z=0)=>[360+(x*.92-y*.64)*1.03,302+(x*.32+y*.53-z)*1.03];
 function path(a,close=true){c.beginPath();a.forEach((p,i)=>{const q=P(...p);i?c.lineTo(...q):c.moveTo(...q)});if(close)c.closePath()}
 function face(a,f,s='#9db0b366',w=.7){path(a);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=w;c.stroke()}}
 function line(a,col,w=1){path(a,false);c.strokeStyle=col;c.lineWidth=w;c.lineJoin='round';c.lineCap='round';c.stroke()}
 function box(x,y,w,d,z,h,top,front,side,edge='#8ba2ab88'){
  face([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],side,edge);
  face([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],front,edge);
  face([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],top,edge);
 }
 function ring(r,z,a=0,b=T){return Array.from({length:65},(_,i)=>[r*Math.cos(a+(b-a)*i/64),r*Math.sin(a+(b-a)*i/64),z])}
 function shadow(){const p=P(0,0,-7);c.save();c.translate(...p);c.scale(1,.3);const g=c.createRadialGradient(0,0,25,0,0,240);g.addColorStop(0,'#24453729');g.addColorStop(1,'#24453700');c.fillStyle=g;c.beginPath();c.arc(0,0,240,0,T);c.fill();c.restore()}
 function pipe(points,w=10){line(points,'#1c3039',w+2);line(points,'#a2b4b7',w);line(points,'#405f6e',w-3);line(points,'#d4e0d12b',1)}
 function round(points,r=13){const out=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],d=points[i+1],la=Math.hypot(...b.map((v,k)=>v-a[k])),lb=Math.hypot(...d.map((v,k)=>v-b[k])),rr=Math.min(r,la/3,lb/3),s=b.map((v,k)=>v+(a[k]-v)*rr/la),e=b.map((v,k)=>v+(d[k]-v)*rr/lb);out.push(s);for(let j=1;j<=12;j++){const u=j/12;out.push(b.map((v,k)=>(1-u)**2*s[k]+2*u*(1-u)*v+u*u*e[k]))}}out.push(points.at(-1));return out}
 function storage(t){
  shadow();
  // A single insulated thermal-store module. Cut faces expose material thickness.
  box(-169,-108,338,216,0,12,'#617782','#344953','#435b66');
  box(-169,-108,338,12,12,156,'#9baeb2','#566e79','#4b6370');
  box(-169,-96,12,204,12,156,'#aebcbc','#81959a','#5b727c');
  box(157,-96,12,204,12,156,'#b1beba','#8b9e9e','#3e5866');
  // Warm storage medium is a volume, not a detached slab or background panel.
  const heat=.5-.5*Math.cos(t*T/20);
  const top=c.createLinearGradient(...P(-145,-86,148),...P(145,82,148));
  top.addColorStop(0,'#a48b60');top.addColorStop(1,`rgb(${159+Math.round(heat*17)},${125+Math.round(heat*10)},76)`);
  const front=c.createLinearGradient(...P(-140,88,130),...P(140,88,22));
  front.addColorStop(0,'#b39a6c');front.addColorStop(.48,`rgb(${150+Math.round(heat*24)},${113+Math.round(heat*16)},67)`);front.addColorStop(1,'#80674a');
  box(-146,-86,292,174,17,130,top,front,'#806b4d','#c9b58b88');
  // Stable, restrained aggregate texture, confined to the cut material.
  for(let i=0;i<220;i++){
   const x=-141+(i*83%281),z=22+(i*47%120),q=P(x,88.2,z);
   c.fillStyle=i%3?'#ecd2a452':'#553e2855';c.fillRect(q[0],q[1],1.1,.8);
  }
  for(let i=0;i<110;i++){const q=P(-140+(i*73%279),-79+(i*53%161),147.3);c.fillStyle='#e6d3a13b';c.fillRect(q[0],q[1],1,.65)}
  // Three embedded electrical cartridges: visible top terminals and exposed ends.
  for(const x of [-104,0,104]){
   box(x-7,-61,14,19,147,5,'#b6c0b9','#7a8985','#8f9e98');
   line([[x,-52,152],[x,-52,161]],'#c3cdc5',4);
   line([[x,89,30],[x,89,126]],'#5c4b39',5);
   line([[x,89.3,30],[x,89.3,126]],`rgba(226,164,83,${.5+heat*.35})`,2.3);
  }
  // One continuous heat-recovery tube runs through the exposed section.
  const tube=round([[-208,96,31],[121,96,31],[121,96,79],[-119,96,79],[-119,96,125],[203,96,125]],19);
  pipe(tube,11);
  const lengths=tube.slice(1).map((p,i)=>Math.hypot(...p.map((v,k)=>v-tube[i][k]))),total=lengths.reduce((a,b)=>a+b,0);
  const at=d=>{let i=0;while(i<lengths.length-1&&d>lengths[i])d-=lengths[i++];const u=d/lengths[i];return tube[i].map((v,k)=>v+(tube[i+1][k]-v)*u)};
  // Inlet water develops vapor along the same continuous bore, without resets.
  for(let j=0;j<29;j++){
   const u=(t*.035+j/29)%1,p=P(...at(u*total)),q=P(...at(Math.min(total,(u+.003)*total))),v=Math.max(0,(u-.27)/.73);
   c.save();c.translate(...p);c.rotate(Math.atan2(q[1]-p[1],q[0]-p[0]));
   c.beginPath();c.ellipse(0,0,1+v*6.5,1+v*1.6,0,0,T);c.fillStyle=v?'#e1e4cf29':'#a7d1dc99';c.fill();if(v){c.strokeStyle='#e2eadaaa';c.lineWidth=.6;c.stroke()}c.restore();
  }
  // Metal front cut edges and fastening points belong to the enclosure.
  for(const x of [-162,163])for(const z of [24,152]){const q=P(x,109,z);c.beginPath();c.arc(...q,1.8,0,T);c.fillStyle='#d0dad4';c.fill()}
  line([[-169,108,12],[169,108,12]],'#b8c5bf99',1);
 }
 function wall(r,z0,z1,start,end){
  for(let i=0;i<48;i++){
   const a=start+(end-start)*i/48,b=start+(end-start)*(i+1)/48;
   const light=.5+.5*Math.cos((a+b)/2+1.0),v=Math.round(69+light*66);
   face([[r*Math.cos(a),r*Math.sin(a),z0],[r*Math.cos(b),r*Math.sin(b),z0],[r*Math.cos(b),r*Math.sin(b),z1],[r*Math.cos(a),r*Math.sin(a),z1]],`rgb(${v-6},${v+13},${v+21})`,null);
  }
 }
 function cap(r,z,h){
  for(let j=0;j<10;j++){
   const a=j/10*Math.PI/2,b=(j+1)/10*Math.PI/2;
   for(let i=0;i<48;i++){
    const u=i/48*T,v=(i+1)/48*T,rr=r*Math.cos(a),ss=r*Math.cos(b);
    const lum=Math.round(103+38*(.5+.5*Math.cos(u+.8))+j*2);
    face([[rr*Math.cos(u),rr*Math.sin(u),z+h*Math.sin(a)],[rr*Math.cos(v),rr*Math.sin(v),z+h*Math.sin(a)],[ss*Math.cos(v),ss*Math.sin(v),z+h*Math.sin(b)],[ss*Math.cos(u),ss*Math.sin(u),z+h*Math.sin(b)]],`rgb(${lum-13},${lum+5},${lum+8})`,null);
   }
  }
 }
 function reactor(t){
  shadow();
  // One integral reactor. The front half is cut away; all parts share the chip projection.
  const back=[Math.PI,T];
  face(ring(100,7),'#344d59','#879ea488');
  wall(100,7,24,0,T);face(ring(100,24),'#627983','#a5b8bc99');
  wall(94,24,247,...back);
  wall(68,36,223,...back);
  // Inner water region and core barrel. No primary-side boiling.
  face(ring(61,38),'#365b6b','#9fbfc066');
  wall(33,47,92,0,T);face(ring(33,92),'#829ba0','#c0ceca');
  for(let i=0;i<9;i++){
   const x=-25+i*6.2,y=12;
   line([[x,y,52],[x,y,89]],'#524b36',4.2);line([[x-.5,y,52],[x-.5,y,89]],'#d8b479',2.5);
  }
  // Rear coil arcs are behind the riser. Front arcs are drawn afterward.
  const helix=[];for(let i=0;i<=600;i++){const a=i/600*T*8;helix.push([43*Math.cos(a),43*Math.sin(a),107+i/600*91])}
  for(let i=1;i<helix.length;i++)if((helix[i][1]+helix[i-1][1])/2<0)line([helix[i-1],helix[i]],'#a18e72',2.5);
  wall(18,94,213,0,T);face(ring(18,213),'#a8c0c4','#c6d6d0');
  // A bright, narrow section of the riser reveals upward liquid motion.
  line([[0,18,98],[0,18,207]],'#477c90',7);
  for(let j=0;j<6;j++){const u=(t*.09+j/6)%1;line([[0,19,99+u*101],[0,19,103+u*101]],'#c7e3e1b3',1.6)}
  for(let i=1;i<helix.length;i++)if((helix[i][1]+helix[i-1][1])/2>=0){line([helix[i-1],helix[i]],'#cbb58e',2.8);line([helix[i-1],helix[i]],'#edddbb55',.6)}
  // Downcomer flow remains liquid and occupies the annulus outside the coil.
  for(const x of [-55,55])for(let j=0;j<5;j++){const u=(t*.075+j/5)%1;line([[x,7,204-u*151],[x,7,199-u*151]],'#8cc2d08c',1.2)}
  // Cut thicknesses attach the pressure boundary to its rear shell.
  for(const s of [-1,1]){
   face([[s*68,0,36],[s*61,0,36],[s*61,0,223],[s*68,0,223]],'#afc0bd','#d0d9ce99');
   face([[s*94,0,24],[s*85,0,24],[s*85,0,247],[s*94,0,247]],'#8fa6ae','#bdcccf99');
  }
  line(ring(68,36,0,Math.PI),'#9cb5bbaa',3);
  line(ring(94,24,0,Math.PI),'#a7bec2aa',3);
  // Rounded pressure head and containment head establish a nested vessel.
  cap(68,223,19);cap(94,247,29);
  line(ring(94,247),'#ced8d388',1.2);
  for(let j=0;j<14;j++){const a=j*T/14,p=P(90*Math.cos(a),90*Math.sin(a),248);c.beginPath();c.arc(...p,1.3,0,T);c.fillStyle='#dce3d8';c.fill()}
  // Short top drives are physically seated on the head, not detached symbols.
  for(const x of [-25,0,25])box(x-3,-3,6,6,274,18,'#d6dfd7','#93a9ae','#afbec0');
  // Secondary inlet and outlet attach directly to the helical generator.
  for(const [z,col]of [[108,'#8fbfce'],[199,'#d2b584']]){
   const p=round([[43,0,z],[118,0,z],[134,-20,z]],10);pipe(p,6);line(p,col,1.6);
  }
 }
 return (kind,time)=>kind==='tes'?storage(time):reactor(time);
})();
