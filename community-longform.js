(() => {
  const EMOJIS=['😀','😁','😂','🤣','😊','😍','🥰','😎','🤩','🥳','😢','😭','😡','🤯','👍','👏','🙌','🙏','💜','❤️','🔥','✨','🚀','🎉','💯','👀','💡','🎮','🎵','🎬','🌍','⭐'];

  function autoGrow(textarea){
    if(!textarea) return;
    textarea.style.height='auto';
    textarea.style.height=Math.min(textarea.scrollHeight,520)+'px';
  }

  function insertEmoji(textarea,emoji){
    if(!textarea) return;
    const start=textarea.selectionStart??textarea.value.length;
    const end=textarea.selectionEnd??textarea.value.length;
    textarea.value=textarea.value.slice(0,start)+emoji+textarea.value.slice(end);
    const pos=start+emoji.length;
    textarea.setSelectionRange(pos,pos);
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
    textarea.focus();
  }

  function makePicker(textarea){
    const wrap=document.createElement('div');
    wrap.className='hubcore-emoji-wrap';
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='hubcore-emoji-toggle';
    toggle.setAttribute('aria-label','Add emoji');
    toggle.textContent='😊 Emoji';
    const panel=document.createElement('div');
    panel.className='hubcore-emoji-panel';
    panel.hidden=true;
    panel.innerHTML=EMOJIS.map(e=>`<button type="button" class="hubcore-emoji" data-emoji="${e}" aria-label="Insert ${e}">${e}</button>`).join('');
    toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;});
    panel.addEventListener('click',e=>{const btn=e.target.closest('.hubcore-emoji');if(!btn)return;insertEmoji(textarea,btn.dataset.emoji);});
    wrap.append(toggle,panel);
    return wrap;
  }

  function enhanceComposer(){
    const input=document.getElementById('composerInput');
    if(!input) return;
    input.removeAttribute('maxlength');
    input.setAttribute('data-longform','true');
    const count=document.getElementById('composerCount');
    if(count) count.style.display='none';
    if(!input.dataset.emojiEnhanced){
      input.dataset.emojiEnhanced='1';
      input.addEventListener('input',()=>autoGrow(input));
      autoGrow(input);
      const bottom=document.querySelector('#communityForm .composer-bottom');
      if(bottom) bottom.prepend(makePicker(input));
    }
  }

  function enhanceComments(){
    document.querySelectorAll('.comment-form textarea[name="comment"]').forEach(textarea=>{
      textarea.removeAttribute('maxlength');
      textarea.setAttribute('data-longform','true');
      if(textarea.dataset.emojiEnhanced) return;
      textarea.dataset.emojiEnhanced='1';
      textarea.addEventListener('input',()=>autoGrow(textarea));
      autoGrow(textarea);
      const row=textarea.closest('.comment-form')?.querySelector('.comment-submit-row');
      if(row) row.prepend(makePicker(textarea));
      else textarea.insertAdjacentElement('afterend',makePicker(textarea));
    });
  }

  function init(){
    enhanceComposer();
    enhanceComments();
    const target=document.getElementById('communityFeed');
    if(target){
      const observer=new MutationObserver(()=>enhanceComments());
      observer.observe(target,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
