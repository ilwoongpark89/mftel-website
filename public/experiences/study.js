/* One lifecycle for all three illustrations. Only fluid/thermal processes animate. */
(() => {
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
  const kind=document.body.dataset.scene,pause=document.getElementById('pause');
  const params=new URLSearchParams(location.search),single=params.has('figure')?Number(params.get('figure')):null;
  if(single!==null){document.body.classList.add('single-figure');document.documentElement.classList.add('light-figure');}
  const en=params.get('lang')==='en';
  if(en){const copy=JSON.parse(document.getElementById('translation').textContent);document.documentElement.lang='en';document.title='MFTEL · '+copy.title;canvas.setAttribute('aria-label',copy.alt);document.getElementById('description').textContent=copy.description;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=parent===window,paused=false,raf=0,last=0,time=0,w=0,h=0,dpr=1;
  const draw=kind==='cooling'?window.drawCooling:window.drawThermal;
  function paint(dt=0){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.save();
    if(single!==null){
      ctx.scale(w/1200,h/800);
      if(kind==='cooling'&&single===1){ctx.translate(24,36);ctx.scale(1.6,1.6);window.drawCooling(time,dt)}
      else window.referenceMotion.draw(kind,single,time);
    }else{
      ctx.scale(w/1000,h/340);
      for(let i=0;i<2;i++){
        ctx.save();
        if(kind==='cooling'&&i===1){ctx.translate(445,0);ctx.scale(.8,.8);window.drawCooling(time,dt)}
        else{ctx.translate(i*506,6);ctx.scale(494/1200,494/1200);window.referenceMotion.draw(kind,i,time)}
        ctx.restore();
      }
    }
    ctx.restore();
    canvas.dataset.time=time.toFixed(3);canvas.dataset.zoom='1';canvas.dataset.stage='fixed';

  }
  function frame(now){const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;paint(dt);raf=requestAnimationFrame(frame);}
  function sync(){
    cancelAnimationFrame(raf);last=0;
    const active=visible&&!paused&&!reduced.matches&&!document.hidden;
    canvas.dataset.running=String(active);pause.textContent=paused||reduced.matches?'▷':'Ⅱ';pause.setAttribute('aria-pressed',String(paused));
    pause.setAttribute('aria-label',en?(paused?'Play animation':'Pause animation'):(paused?'움직임 재생':'움직임 멈추기'));
    pause.hidden=reduced.matches;paint();if(active)raf=requestAnimationFrame(frame);
  }
  function resize(){w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);paint();}
  pause.addEventListener('click',()=>{paused=!paused;sync();});
  addEventListener('reference-ready',()=>paint());
  addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='lab-visibility'){visible=!!e.data.visible;sync();}});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  new ResizeObserver(resize).observe(canvas);resize();sync();
  const report=()=>parent.postMessage({type:'lab-height',kind,height:document.querySelector('.study').getBoundingClientRect().height},location.origin);
  new ResizeObserver(report).observe(document.querySelector('.study'));document.fonts.ready.then(report);
})();
