/* One fixed immersion view. Heat load is illustrative, not measured data. */
window.drawCooling = (() => {
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
  const scale=1.03,cx=360,cy=240;
  let time=0,heat=65,spawnCredit=0,particles=[];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const stage=v=>v<22?0:v<89?1:v<=102?2:3;
  const project = (x, y, z = 0) => [cx + (x * .92 - y * .64) * scale, cy + (x * .32 + y * .53 - z) * scale];
  function path(points) { ctx.beginPath(); points.forEach((p, i) => { const [x, y] = project(...p); if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y); }); ctx.closePath(); }
  function poly(points, fill, stroke, lineWidth = 1) { path(points); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lineWidth * scale; ctx.strokeStyle = stroke; ctx.stroke(); } }
  function line(points, color, lineWidth = 1) { ctx.beginPath(); points.forEach((p, i) => { const [x, y] = project(...p); if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y); }); ctx.strokeStyle = color; ctx.lineWidth = lineWidth * scale; ctx.stroke(); }
  function box(x, y, w, d, z, h, top, front, side, stroke) {
    poly([[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]], side);
    poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]], side);
    poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]], front);
    poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]], top, stroke, .65);
  }
  const sites = [];
  let seed = 271828;
  function random() { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed / 4294967296; }
  for(let i=0;i<30;i++)sites.push({ x: -52 + random()*104, y: -44 + random()*88, r: 3 + random()*3.7, offset: random()*6.28 });
  function makeParticle(initial = false) {
    const site = sites[Math.floor(random()*sites.length)];
    return { x:site.x,y:site.y,r:site.r*(.72+heat/180),age:initial?random()*2.3:0,grow:.5+random()*.45,speed:26+random()*24,phase:random()*6.28 };
  }
  function reseed() { particles = heat < 22 ? [] : Array.from({length: 7+Math.floor(Math.min(heat,100)/4)}, () => makeParticle(true)); }
  function bubble(x,y,z,r,alpha=1) {
    const [sx,sy]=project(x,y,z),radius=r*scale;
    ctx.save();ctx.globalAlpha=alpha*.82;
    ctx.beginPath();ctx.ellipse(sx,sy,radius,radius*1.04,0,0,Math.PI*2);
    ctx.fillStyle='rgba(173,198,189,.055)';ctx.fill();
    ctx.strokeStyle='rgba(200,221,211,.56)';ctx.lineWidth=.65;ctx.stroke();
    ctx.beginPath();ctx.ellipse(sx-radius*.06,sy-radius*.04,radius*.86,radius*.91,0,3.5,5.2);
    ctx.strokeStyle='rgba(235,247,239,.5)';ctx.lineWidth=.8;ctx.stroke();ctx.restore();
  }
  function vaporPatch(x,y,r,z,amount) {
    ctx.save();ctx.globalAlpha=clamp(amount*10,0,1);
    const pts=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2,rr=r*(1+.09*Math.sin(i*.8+time*1.6));pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr*.82,z+Math.sin(a*2+time)*.65]);}
    poly(pts,`rgba(237,229,215,${.23+amount*.23})`,`rgba(242,233,216,${.42+amount*.28})`,.65);ctx.restore();
  }
  function paint(dt=0) {
    time+=dt;canvas.dataset.time=time.toFixed(3);

    const index=stage(heat), crisis=clamp((heat-99)/17,0,1);
    const mix=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;
    // The board and boiling interface are sufficient; no glass-wall overlay.
    const [shadowX,shadowY]=project(0,0,-26);
    ctx.save();ctx.translate(shadowX,shadowY);ctx.scale(1,.33);const shadow=ctx.createRadialGradient(0,0,15*scale,0,0,260*scale);shadow.addColorStop(0,'rgba(24,57,43,.16)');shadow.addColorStop(.6,'rgba(29,56,43,.06)');shadow.addColorStop(1,'rgba(29,56,43,0)');ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(0,0,260*scale,0,Math.PI*2);ctx.fill();ctx.restore();
    // PCB edge and grounded traces. These make the application legible.
    box(-188,-117,376,234,0,6,'#35434c','#23313c','#2b3c47','#667d89');
    const trace='#8ea7b34d';
    for(let i=0;i<7;i++){
      const y=-72+i*24;
      line([[-185,y,6.5],[-137,y,6.5],[-113,y*.72,6.5],[-73,y*.72,6.5]],trace,.7);
      line([[185,y,6.5],[141,y,6.5],[117,y*.7,6.5],[73,y*.7,6.5]],trace,.7);
    }
    for(let i=0;i<6;i++){
      const x=-65+i*26;
      line([[x,-115,6.5],[x,-90,6.5],[x*.65,-72,6.5]],trace,.6);
      line([[x,115,6.5],[x,88,6.5],[x*.75,70,6.5]],trace,.6);
    }
    for(const x of [-178,178])for(const y of [-107,107]){
      const [sx,sy]=project(x,y,7);ctx.beginPath();ctx.ellipse(sx,sy,4*scale,2.4*scale,.2,0,Math.PI*2);ctx.fillStyle='#bdc5a6';ctx.fill();ctx.beginPath();ctx.ellipse(sx,sy,2.2*scale,1.3*scale,.2,0,Math.PI*2);ctx.fillStyle='#243b30';ctx.fill();
    }
    for(let y=-80;y<=64;y+=48){
      box(-157,y,38,28,6,8,'#25343e','#1d2b34','#1c2b35','#586f7c');
      box(117,y,38,28,6,8,'#25343e','#1d2b34','#1c2b35','#586f7c');
      for(let k=0;k<3;k++){
        box(-161,y+5+k*8,4,1.5,6,2,'#b3b6a2','#909b89','#909b89');
        box(155,y+5+k*8,4,1.5,6,2,'#b3b6a2','#909b89','#909b89');
      }
    }
    for(let x=-97;x<=76;x+=29){box(x,-105,18,11,6,5,'#3b4f5b','#263742','#263742','#708590');box(x,92,18,11,6,5,'#3b4f5b','#263742','#263742','#708590');}
    for(let i=0;i<12;i++)box(-77+i*14,116,7,16,1,1.5,'#b7a874','#8e895f','#8e895f');

    // Package, contacts, metal heat-spreading face.
    box(-82,-75,164,150,6,6,'#293d49','#1b2933','#24333e','#8296a2');
    for(let i=0;i<10;i++){box(-72+i*16,-79,4,5,7,2,'#b5bd9b','#7c8c6c','#7c8c6c');box(-72+i*16,74,4,5,7,2,'#b5bd9b','#7c8c6c','#7c8c6c');}
    const left=project(-68,-61,25),right=project(68,61,25);
    const metal=ctx.createLinearGradient(left[0],left[1],right[0],right[1]);
    metal.addColorStop(0,mix([212,223,216],[218,187,158],crisis));metal.addColorStop(.4,mix([193,208,198],[215,168,139],crisis));metal.addColorStop(1,mix([147,173,163],[204,146,114],crisis));
    box(-69,-62,138,124,12,13,metal,'#9aa99d','#b2bfb2','#d5dfd4');
    // Clear chip identity remains readable through the boiling scene.

    // A subdued contact field makes rewetting visible at the heated surface.
    // The marks are conceptual contact regions, not measured dry-area data.
    if(index===1){for(const b of particles){const age=b.age-b.grow;if(age>0&&age<.7){const rr=3+age*17,pts=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2;pts.push([b.x+Math.cos(a)*rr,b.y+Math.sin(a)*rr,25.6]);}poly(pts,`rgba(70,113,110,${(.7-age)*.20})`,`rgba(132,189,178,${(.7-age)*.3})`,.6);}}}
    // Dry patches grow only near CHF; after CHF a broad vapor layer separates liquid.
    if(heat>77){const amount=clamp((heat-77)/43,0,1);const patches=[[-37,-28,10],[24,-23,13],[-12,25,10],[39,22,11],[0,-4,12]];for(const [x,y,r]of patches)vaporPatch(x,y,r*(.55+amount*1.3),26.5,amount);}
    if(crisis>0){
      const pts=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2;const x=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.35)*66;const y=Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.35)*58;pts.push([x,y,29+crisis*8+Math.sin(a*6+time*1.7)*2]);}
      poly(pts,`rgba(230,212,181,${(.15+crisis*.37)*clamp(crisis*10,0,1)})`,`rgba(250,237,211,${(.25+crisis*.45)*clamp(crisis*10,0,1)})`,1.2);
      const p=project(0,4,26);const warmth=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],70*scale);warmth.addColorStop(0,`rgba(197,70,30,${crisis*.25})`);warmth.addColorStop(1,'rgba(197,70,30,0)');ctx.fillStyle=warmth;ctx.beginPath();ctx.ellipse(p[0],p[1],85*scale,44*scale,.1,0,Math.PI*2);ctx.fill();
    }
    // Bubbles nucleate at the chip surface, grow, detach, and rise.
    if(heat>=22){
      if(dt){spawnCredit+=dt*(heat<=102?2+(heat-22)*.2:9);while(spawnCredit>=1){spawnCredit--;particles.push(makeParticle());}}
      particles=particles.filter(p=>p.age<4.8);
      const order=[...particles].sort((a,b)=>(a.x+a.y)-(b.x+b.y));
      for(const b of order){if(dt)b.age+=dt;const detached=b.age>b.grow;const r=b.r*Math.min(1,b.age/b.grow+.1);const lift=detached?(b.age-b.grow)*b.speed:0;const z=26+r*.4+lift;const alpha=clamp((176-z)/38,0,1)*(crisis?.68:1);const drift=detached?Math.sin(b.phase+b.age)*lift*.025:0;bubble(b.x+drift,b.y,z,r,alpha);}
      // Near the limit, attached neighboring bubbles visibly coalesce.
      if(heat>85)for(let i=0;i<7;i++){const site=sites[i*3];bubble(site.x,site.y,34+Math.sin(time*1.6+i)*2,8+Math.sin(time+i)*1.5,.67*clamp((heat-85)/10,0,1));}
    }

  }
  reseed();
  return (elapsed,dt) => {
    // A continuous, reversible load cycle: geometry and camera never change.
    time=elapsed-dt;
    heat=65+45*(.5-.5*Math.cos(elapsed*Math.PI*2/28));
    paint(dt);
  };
})();
