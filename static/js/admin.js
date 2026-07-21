(() => {
  const byId = (id) => document.getElementById(id);

  const initDataTransfer = () => {
    const toggle = byId('user-menu-toggle');
    const dropdown = byId('user-dropdown');
    const importTrigger = byId('data-import-trigger');
    const fileInput = byId('data-import-file');
    const modal = byId('data-modal');
    const modalTitle = byId('data-modal-title');
    const modalMessage = byId('data-modal-message');
    const modalClose = byId('data-modal-close');

    if (!toggle || !dropdown || !importTrigger || !fileInput || !modal || !modalTitle || !modalMessage || !modalClose) {
      return;
    }

    let reloadAfterClose = false;

    const closeDropdown = () => {
      dropdown.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    };

    const showModal = (title, message, isError = false, canClose = true) => {
      modalTitle.textContent = title;
      modalTitle.classList.toggle('error', isError);
      modalMessage.textContent = message;
      modalClose.hidden = !canClose;
      modal.hidden = false;
    };

    const closeModal = () => {
      modal.hidden = true;
      if (reloadAfterClose) window.location.reload();
    };

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
      toggle.setAttribute('aria-expanded', dropdown.hidden ? 'false' : 'true');
    });

    document.addEventListener('click', (event) => {
      if (!dropdown.hidden && !dropdown.contains(event.target) && event.target !== toggle) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
        if (!modal.hidden && !modalClose.hidden) closeModal();
      }
    });

    importTrigger.addEventListener('click', () => {
      closeDropdown();
      fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      showModal('正在导入', '正在校验备份文件并更新数据……', false, false);
      const formData = new FormData();
      formData.append('data_file', file);

      try {
        const response = await fetch('/admin/data/import', {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });
        const result = await response.json().catch(() => ({
          success: false,
          message: '服务器返回了无法识别的响应。',
        }));

        const errorDetails = Array.isArray(result.errors) && result.errors.length > 0
          ? '\n\n' + result.errors.map((item, index) => (index + 1) + '. ' + item).join('\n')
          : '';

        if (!response.ok || !result.success) {
          reloadAfterClose = false;
          showModal('导入失败', (result.message || '导入失败。') + errorDetails, true, true);
          return;
        }

        reloadAfterClose = true;
        showModal('导入成功', result.message || '数据已成功导入。', false, true);
      } catch (error) {
        reloadAfterClose = false;
        showModal('导入失败', '网络请求失败，请检查网络后重试。', true, true);
      } finally {
        fileInput.value = '';
      }
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal && !modalClose.hidden) closeModal();
    });
  };

  const initListActions = () => {
    const actionToggle = byId('action-toggle');
    if (actionToggle) {
      actionToggle.addEventListener('change', (event) => {
        const checked = event.currentTarget.checked;
        document.querySelectorAll('.action-select').forEach((checkbox) => {
          checkbox.checked = checked;
        });
      });
    }

    document.addEventListener('change', async (event) => {
      const checkbox = event.target.closest('[data-toggle-endpoint][data-record-id]');
      if (!checkbox) return;

      try {
        const response = await fetch(`/admin/${checkbox.dataset.toggleEndpoint}/toggle-field`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: checkbox.dataset.recordId,
            checked: checkbox.checked,
          }),
        });
        if (!response.ok) alert('状态更新失败，请刷新页面重试');
      } catch (error) {
        alert('请求网络异常');
      }
    });
  };

  const initFileImports = () => {
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-file-input]');
      if (!trigger) return;
      const input = byId(trigger.dataset.fileInput);
      if (input) input.click();
    });

    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-auto-submit-form]');
      if (!input || !input.files || input.files.length === 0) return;
      const form = byId(input.dataset.autoSubmitForm);
      if (form) form.submit();
    });
  };

  const initConfirmLinks = () => {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-confirm]');
      if (!link) return;
      if (!window.confirm(link.dataset.confirm || '确定继续吗？')) {
        event.preventDefault();
      }
    });
  };

  initDataTransfer();
  initListActions();
  initFileImports();
  initConfirmLinks();
})();
