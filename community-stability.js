(() => {
  const waitForApi = () => {
    if (!window.HubCoreAPI?.getCommunityPosts) return setTimeout(waitForApi, 50);

    const originalGetCommunityPosts = window.HubCoreAPI.getCommunityPosts.bind(window.HubCoreAPI);
    let editing = false;

    const isCommunityEditor = (el) => !!el?.closest?.('#community') && (el.matches?.('input, textarea') || el.isContentEditable);

    document.addEventListener('focusin', e => {
      if (isCommunityEditor(e.target)) editing = true;
    }, true);

    document.addEventListener('focusout', e => {
      if (!isCommunityEditor(e.target)) return;
      setTimeout(() => {
        editing = isCommunityEditor(document.activeElement);
      }, 0);
    }, true);

    window.HubCoreAPI.getCommunityPosts = async function(...args) {
      const data = await originalGetCommunityPosts(...args);
      if (!editing) return data;

      return new Promise(resolve => {
        const finish = () => {
          if (!editing) resolve(data);
          else setTimeout(finish, 250);
        };
        finish();
      });
    };

    const enhanceFields = root => {
      root.querySelectorAll?.('#community textarea').forEach(el => {
        el.setAttribute('spellcheck', 'true');
        el.setAttribute('autocapitalize', 'sentences');
        el.setAttribute('autocomplete', 'off');
      });

      root.querySelectorAll?.('#community input[name="commentUsername"], #community input[name="username"]').forEach(el => {
        if (/^@?vistor$/i.test(el.value.trim())) el.value = '@visitor';
        el.addEventListener('blur', () => {
          if (/^@?vistor$/i.test(el.value.trim())) el.value = '@visitor';
        }, { once:false });
      });
    };

    enhanceFields(document);
    new MutationObserver(() => enhanceFields(document)).observe(document.documentElement, { childList:true, subtree:true });
  };

  waitForApi();
})();
