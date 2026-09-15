(() => {
  const choices = [
    {value:'Vibes Chat', icon:'💬', label:'Vibes Chat'},
    {value:'VibeFeed', icon:'🌐', label:'VibeFeed'},
    {value:'HubBeats', icon:'🎵', label:'HubBeats'},
    {value:'VibeFlix', icon:'🎬', label:'VibeFlix'},
    {value:'VibeShop', icon:'🛍️', label:'VibeShop'},
    {value:'HubVentures', icon:'🌍', label:'HubVentures'},
    {value:'HubPlay', icon:'🎮', label:'HubPlay'},
    {value:'VibeGo', icon:'🚗', label:'VibeGo'},
    {value:'Reel Vibes', icon:'🎥', label:'Reel Vibes', isNew:true}
  ];

  const grid = document.querySelector('.quick-vote-grid');
  if (grid) {
    grid.setAttribute('aria-label', 'Choose from all eight HubCore experiences or the new Reel Vibes release');
    grid.innerHTML = choices.map(choice => `
      <button class="quick-vote${choice.isNew ? ' quick-vote-new-release' : ''}" type="button" data-quick-vote="${choice.value}">
        <span aria-hidden="true">${choice.icon}</span>
        <span>${choice.label}</span>
        ${choice.isNew ? '<small class="quick-vote-new-badge">NEW RELEASE</small>' : ''}
      </button>`).join('');

    if (!document.getElementById('hubcoreQuickVoteReleaseStyle')) {
      const style = document.createElement('style');
      style.id = 'hubcoreQuickVoteReleaseStyle';
      style.textContent = `
        .quick-vote{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;flex-wrap:wrap!important}
        .quick-vote-new-release{border-color:rgba(83,214,255,.68)!important;background:linear-gradient(135deg,rgba(135,76,255,.3),rgba(53,205,255,.18))!important;box-shadow:0 0 24px rgba(111,94,255,.16)!important}
        .quick-vote-new-badge{padding:3px 6px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#38bdf8);color:#fff;font-size:.48rem;font-weight:900;line-height:1;letter-spacing:.08em;white-space:nowrap}
        @media(max-width:520px){.quick-vote-new-badge{font-size:.44rem}.quick-vote{gap:5px!important}}
      `;
      document.head.appendChild(style);
    }
  }

  const input = document.getElementById('composerInput');
  document.querySelectorAll('[data-quick-vote]').forEach(button => {
    button.addEventListener('click', () => {
      if (!input) return;
      const choice = button.dataset.quickVote || button.textContent.trim();
      input.value = `My first choice would be ${choice} because `;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      input.scrollIntoView({behavior:'smooth',block:'center'});
    });
  });

  const shareButton = document.getElementById('shareHubcore');
  const status = document.getElementById('communityShareStatus');
  if (shareButton) shareButton.addEventListener('click', async () => {
    const data = {title:'HubCore Vibes',text:'Help shape HubCore Vibes — choose what you would try first and share your idea.',url:'https://hubcorevibes.com/#community'};
    try {
      if (navigator.share) await navigator.share(data);
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(data.url);
        if (status) status.textContent='Community link copied — ready to share.';
      } else window.prompt('Copy this community link:',data.url);
    } catch (error) {
      if (error?.name !== 'AbortError' && status) status.textContent='Sharing was not completed. Please try again.';
    }
  });
})();