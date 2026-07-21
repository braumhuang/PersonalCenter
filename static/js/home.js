(() => {
  document.addEventListener('change', async (event) => {
    const checkbox = event.target.closest('[data-front-todo-id]');
    if (!checkbox || !checkbox.checked) return;

    const id = checkbox.dataset.frontTodoId;
    try {
      const response = await fetch('/admin/todoitem/toggle-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, checked: true }),
      });

      if (!response.ok) {
        alert('完成待办失败');
        checkbox.checked = false;
        return;
      }

      const row = document.getElementById(`todo-row-${id}`);
      if (row) row.remove();

      const remainingRows = document.querySelectorAll('#todo-section tbody tr');
      if (remainingRows.length === 0) {
        const section = document.getElementById('todo-section');
        if (section) section.remove();
      }
    } catch (error) {
      alert('操作网络异常');
      checkbox.checked = false;
    }
  });
})();
