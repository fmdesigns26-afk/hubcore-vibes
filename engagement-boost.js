(() => {
  const choices = ['Music','Movies','Gaming','Community','Travel','Shopping'];
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