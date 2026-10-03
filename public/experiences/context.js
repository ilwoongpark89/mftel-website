/* Selection after the full retrospective: no newly drawn geometry. */
window.drawSystemContext=(kind,time)=>{
 if(kind==='tes')window.drawArchiveStorage(time);
 else if(kind==='smr')window.drawSelectedPlant(time);
 else window.drawArchiveSystem('cooling',time);
};
