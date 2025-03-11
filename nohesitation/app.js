// 初始化应用程序
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initEmotionStation();
});

// 全局变量
let decisions = JSON.parse(localStorage.getItem('decisions')) || [];
let reflections = JSON.parse(localStorage.getItem('reflections')) || [];
let exercises = JSON.parse(localStorage.getItem('exercises')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    streak: 0,
    lastDecisionDate: null,
    maxStreak: 0,
    exerciseStreak: 0,
    lastExerciseDate: null,
    maxExerciseStreak: 0,
    quotes: [
        "行动可能带来失败，但不行动注定失败。",
        "做出决定的最佳时机是十年前，其次是现在。",
        "无需完美，只需行动。",
        "每一个决定都是进步的机会。",
        "犹豫不决，便是决定了放弃。",
        "在犹豫中前行，也比在等待中静止要好。",
        "不确定时，问自己：我五年后会为今天的犹豫感到骄傲吗？",
        "做最坏打算，尽最大努力。"
    ]
};

// 应用程序初始化
function initApp() {
    // 设置当前日期
    document.getElementById('current-date').textContent = formatDate(new Date());
    
    // 导航标签功能
    initTabs();
    
    // 加载仪表盘数据
    loadDashboard();
    
    // 初始化新决定表单
    initNewDecisionForm();
    
    // 初始化日记功能
    initJournalTab();
    
    // 初始化练习功能
    initExercisesTab();
    
    // 加载进度数据
    loadProgressData();

    // 添加新决定按钮
    document.getElementById('new-decision-btn').addEventListener('click', () => {
        switchToTab('new-decision');
    });
    
    // 检查并更新连续天数
    updateStreak();

    // 初始化练习日记
    if (document.getElementById('exercise-journal')) {
        displayExerciseJournal();
    }
}

// 初始化导航标签
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchToTab(tabId);
        });
    });
}

// 切换到指定标签
function switchToTab(tabId) {
    // 移除所有激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 添加激活状态到选中的标签
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// 加载仪表盘数据
function loadDashboard() {
    const dashboard = document.getElementById('dashboard');
    
    // 创建主页布局
    const dashboardHtml = `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div class="welcome-section">
                    <h1>今日状态</h1>
                    <p class="date-display">${formatDate(new Date())}</p>
                </div>
                <div class="quick-actions">
                    <button class="action-btn" id="new-decision-btn">
                        <i class="fas fa-plus"></i> 添加新决定
                    </button>
                </div>
            </div>

            <div class="stats-container">
                <div class="stat-box">
                    <i class="fas fa-check-circle stat-icon"></i>
                    <h3>本周决定</h3>
                    <div class="stat-value" id="decision-count">0</div>
                    <p class="stat-label">已完成的决定</p>
                </div>
                
                <div class="stat-box">
                    <i class="fas fa-fire stat-icon"></i>
                    <h3>连续天数</h3>
                    <div class="stat-value" id="streak-count">0</div>
                    <p class="stat-label">每天至少一个决定</p>
                </div>
                
                <div class="stat-box">
                    <i class="fas fa-tasks stat-icon"></i>
                    <h3>待处理</h3>
                    <div class="stat-value" id="pending-count">0</div>
                    <p class="stat-label">等待决定的事项</p>
                </div>
            </div>

            <div class="quote-box">
                <div id="daily-quote"></div>
            </div>

            <div class="pending-decisions-section">
                <div class="section-header">
                    <h2>等待决定的事项</h2>
                    <div class="section-actions">
                        <button class="filter-btn active" data-filter="all">全部</button>
                        <button class="filter-btn" data-filter="high">重要</button>
                        <button class="filter-btn" data-filter="urgent">紧急</button>
                    </div>
                </div>
                <div id="pending-decisions-list" class="animated-list"></div>
            </div>
        </div>
    `;
    
    dashboard.innerHTML = dashboardHtml;
    
    // 初始化仪表盘组件
    displayDailyQuote();
    displayPendingDecisions();
    updateStats();
    
    // 添加过滤器事件监听
    initializeFilters();
    
    // 添加新决定按钮事件
    document.getElementById('new-decision-btn').addEventListener('click', () => {
        switchToTab('new-decision');
    });
}

// 初始化过滤器功能
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 更新按钮状态
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 应用过滤器
            const filter = button.getAttribute('data-filter');
            filterPendingDecisions(filter);
        });
    });
}

// 过滤待决定事项
function filterPendingDecisions(filter) {
    const pendingDecisions = decisions.filter(d => !d.decided);
    let filteredDecisions = pendingDecisions;
    
    switch (filter) {
        case 'high':
            filteredDecisions = pendingDecisions.filter(d => d.importance === 'high');
            break;
        case 'urgent':
            filteredDecisions = pendingDecisions.filter(d => {
                if (!d.deadline) return false;
                const deadline = new Date(d.deadline);
                const now = new Date();
                const hoursLeft = (deadline - now) / (1000 * 60 * 60);
                return hoursLeft <= 24;
            });
            break;
    }
    
    displayFilteredDecisions(filteredDecisions);
}

// 显示过滤后的决定列表
function displayFilteredDecisions(filteredDecisions) {
    const pendingList = document.getElementById('pending-decisions-list');
    
    if (filteredDecisions.length === 0) {
        pendingList.innerHTML = '<p class="empty-state">没有符合条件的待决定事项</p>';
        return;
    }
    
    // 按照截止时间排序
    filteredDecisions.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });
    
    let html = '';
    const now = new Date();
    
    filteredDecisions.forEach((decision, index) => {
        // 添加动画延迟
        const animationDelay = index * 0.1;
        
        html += generateDecisionItemHtml(decision, now, animationDelay);
    });
    
    pendingList.innerHTML = html;
    
    // 添加事件监听器
    pendingList.querySelectorAll('.decision-btn').forEach(button => {
        button.addEventListener('click', handleDecisionAction);
    });
}

// 生成决定项的HTML
function generateDecisionItemHtml(decision, now, animationDelay) {
    let deadlineHtml = '';
    let urgentClass = '';
    
    if (decision.deadline) {
        const deadline = new Date(decision.deadline);
        const timeLeft = deadline - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        
        if (timeLeft < 0) {
            deadlineHtml = `<span class="deadline-text overdue">已过期</span>`;
            urgentClass = 'deadline-urgent';
        } else if (hoursLeft < 24) {
            deadlineHtml = `<span class="deadline-text urgent">还剩 ${hoursLeft} 小时</span>`;
            urgentClass = 'deadline-urgent';
        } else {
            const daysLeft = Math.floor(hoursLeft / 24);
            deadlineHtml = `<span class="deadline-text">还剩 ${daysLeft} 天</span>`;
        }
    }
    
    const importanceClass = `importance-${decision.importance || 'low'}`;
    
    return `
        <div class="decision-item ${urgentClass}" style="animation-delay: ${animationDelay}s">
            <div class="decision-info">
                <div class="decision-title">
                    <span class="importance-indicator ${importanceClass}"></span>
                    ${decision.title}
                </div>
                <div class="decision-meta">
                    <span class="decision-importance">
                        ${getImportanceText(decision.importance)}
                    </span>
                    <span class="decision-deadline ${urgentClass}">
                        <i class="fas fa-clock"></i>
                        ${deadlineHtml}
                    </span>
                </div>
                ${decision.hesitationReason ? `
                    <div class="hesitation-reason">
                        <i class="fas fa-question-circle"></i>
                        ${decision.hesitationReason}
                    </div>
                ` : ''}
            </div>
            <div class="decision-actions">
                <button class="decision-btn btn-decide" data-action="decide" data-id="${decision.id}">
                    <i class="fas fa-check-circle"></i> 决定
                </button>
                <button class="decision-btn btn-edit" data-action="edit" data-id="${decision.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="decision-btn btn-delete" data-action="delete" data-id="${decision.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// 显示每日激励语
function displayDailyQuote() {
    const quoteEl = document.getElementById('daily-quote');
    const quotes = settings.quotes;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    
    quoteEl.innerHTML = `<p class="quote-text">${quotes[randomIndex]}</p>`;
}

// 显示待决定的事项
function displayPendingDecisions() {
    const pendingList = document.getElementById('pending-decisions-list');
    const pendingDecisions = decisions.filter(d => !d.decided);
    
    if (pendingDecisions.length === 0) {
        pendingList.innerHTML = '<p class="empty-state">目前没有等待决定的事项。何不添加一个？</p>';
        return;
    }
    
    // 按照截止时间排序
    pendingDecisions.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });
    
    const now = new Date();
    let html = '';
    
    pendingDecisions.forEach(decision => {
        let deadlineHtml = '';
        let urgentClass = '';
        
        if (decision.deadline) {
            const deadline = new Date(decision.deadline);
            const timeLeft = deadline - now;
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            
            if (timeLeft < 0) {
                deadlineHtml = `<span class="deadline-text">已过期</span>`;
                urgentClass = 'deadline-urgent';
            } else if (hoursLeft < 24) {
                deadlineHtml = `<span class="deadline-text">还剩 ${hoursLeft} 小时</span>`;
                urgentClass = 'deadline-urgent';
            } else {
                const daysLeft = Math.floor(hoursLeft / 24);
                deadlineHtml = `<span class="deadline-text">还剩 ${daysLeft} 天</span>`;
            }
        }
        
        const importanceClass = `importance-${decision.importance || 'low'}`;
        
        html += `
            <div class="decision-item" data-id="${decision.id}">
                <div class="decision-info">
                    <div class="decision-title">${decision.title}</div>
                    <div class="decision-meta">
                        <span class="decision-importance">
                            <span class="importance-indicator ${importanceClass}"></span>
                            ${getImportanceText(decision.importance)}
                        </span>
                        <span class="decision-deadline ${urgentClass}">
                            <i class="fas fa-clock"></i>
                            ${deadlineHtml}
                        </span>
                    </div>
                </div>
                <div class="decision-actions">
                    <button class="decision-btn btn-decide" data-action="decide" data-id="${decision.id}">
                        <i class="fas fa-check-circle"></i> 决定
                    </button>
                    <button class="decision-btn btn-edit" data-action="edit" data-id="${decision.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="decision-btn btn-delete" data-action="delete" data-id="${decision.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    pendingList.innerHTML = html;
    
    // 添加事件监听器
    pendingList.querySelectorAll('.decision-btn').forEach(button => {
        button.addEventListener('click', handleDecisionAction);
    });
}

// 处理决定项的各种操作
function handleDecisionAction(e) {
    const action = e.target.closest('.decision-btn').getAttribute('data-action');
    const id = e.target.closest('.decision-btn').getAttribute('data-id');
    
    switch (action) {
        case 'decide':
            completeDecision(id);
            break;
        case 'edit':
            editDecision(id);
            break;
        case 'delete':
            deleteDecision(id);
            break;
    }
}

// 完成一个决定
function completeDecision(id) {
    const decision = decisions.find(d => d.id === id);
    if (!decision) return;
    
    decision.decided = true;
    decision.decidedAt = new Date().toISOString();
    
    saveDecisions();
    updateStreak();
    displayPendingDecisions();
    updateStats();
    
    switchToTab('journal');
    openReflectionForm(id);
    
    showNotification('恭喜！你已经做出了决定。记录一下你的反思吧！', 'success');
}

// 编辑一个决定
function editDecision(id) {
    const decision = decisions.find(d => d.id === id);
    if (!decision) return;
    
    // 填充表单数据
    document.getElementById('decision-title').value = decision.title;
    document.querySelector(`input[name="importance"][value="${decision.importance}"]`).checked = true;
    document.getElementById('hesitation-reason').value = decision.hesitationReason || '';
    
    if (decision.deadline) {
        document.getElementById('deadline').value = formatDateTimeForInput(new Date(decision.deadline));
    } else {
        document.getElementById('deadline').value = '';
    }
    
    // 保存编辑状态
    const form = document.getElementById('decision-form');
    form.setAttribute('data-edit-id', id);
    
    // 切换到新决定标签
    switchToTab('new-decision');
}

// 删除一个决定
function deleteDecision(id) {
    if (!confirm('确定要删除这个决定吗？此操作不可撤销。')) return;
    
    const index = decisions.findIndex(d => d.id === id);
    if (index !== -1) {
        decisions.splice(index, 1);
        saveDecisions();
        displayPendingDecisions();
        updateStats();
        showNotification('决定已删除', 'info');
    }
}

// 初始化新决定表单
function initNewDecisionForm() {
    const form = document.getElementById('decision-form');
    const suggestButton = document.getElementById('suggest-deadline');
    const resetButton = document.getElementById('reset-form');
    
    // 提交表单
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitDecisionForm();
    });
    
    // 建议截止时间
    suggestButton.addEventListener('click', suggestDeadline);
    
    // 重置表单
    resetButton.addEventListener('click', () => {
        form.reset();
        form.removeAttribute('data-edit-id');
        document.getElementById('suggested-time').innerHTML = '';
    });
}

// 提交决定表单
function submitDecisionForm() {
    const form = document.getElementById('decision-form');
    const title = document.getElementById('decision-title').value.trim();
    const importance = document.querySelector('input[name="importance"]:checked').value;
    const hesitationReason = document.getElementById('hesitation-reason').value.trim();
    const deadline = document.getElementById('deadline').value;
    
    if (!title) {
        showNotification('请输入决定的标题', 'error');
        return;
    }
    
    const editId = form.getAttribute('data-edit-id');
    
    if (editId) {
        // 编辑现有决定
        const decision = decisions.find(d => d.id === editId);
        if (decision) {
            decision.title = title;
            decision.importance = importance;
            decision.hesitationReason = hesitationReason;
            decision.deadline = deadline ? new Date(deadline).toISOString() : null;
            decision.updatedAt = new Date().toISOString();
        }
        
        showNotification('决定已更新', 'success');
    } else {
        // 创建新决定
        const newDecision = {
            id: generateId(),
            title,
            importance,
            hesitationReason,
            deadline: deadline ? new Date(deadline).toISOString() : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            decided: false
        };
        
        decisions.unshift(newDecision);
        showNotification('新决定已添加', 'success');
    }
    
    saveDecisions();
    form.reset();
    form.removeAttribute('data-edit-id');
    document.getElementById('suggested-time').innerHTML = '';
    
    // 切换到仪表盘
    switchToTab('dashboard');
    loadDashboard();
}

// 建议截止时间
function suggestDeadline() {
    const importance = document.querySelector('input[name="importance"]:checked').value;
    const now = new Date();
    let suggested;
    
    switch (importance) {
        case 'low':
            suggested = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2小时
            break;
        case 'medium':
            suggested = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1天
            break;
        case 'high':
            suggested = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1周
            break;
    }
    
    document.getElementById('deadline').value = formatDateTimeForInput(suggested);
    
    const suggestedText = getImportanceText(importance) + '的决定建议在' + formatDate(suggested) + '前完成';
    document.getElementById('suggested-time').innerHTML = suggestedText;
}

// 初始化日记标签
function initJournalTab() {
    document.getElementById('journal').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-reflect')) {
            const id = e.target.getAttribute('data-id');
            openReflectionForm(id);
        }
    });
    
    const reflectionForm = document.getElementById('reflection-form');
    reflectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitReflection();
    });
    
    document.getElementById('cancel-reflection').addEventListener('click', () => {
        document.getElementById('reflection-form-container').classList.add('hidden');
    });
    
    displayCompletedDecisions();
}

// 显示已完成的决定
function displayCompletedDecisions() {
    const completedList = document.getElementById('completed-decisions-list');
    const completedDecisions = decisions.filter(d => d.decided);
    
    if (completedDecisions.length === 0) {
        completedList.innerHTML = '<p class="empty-state">还没有已完成的决定。</p>';
        return;
    }
    
    // 按照完成时间排序
    completedDecisions.sort((a, b) => {
        return new Date(b.decidedAt) - new Date(a.decidedAt);
    });
    
    let html = '';
    
    completedDecisions.forEach(decision => {
        const reflection = reflections.find(r => r.decisionId === decision.id);
        const reflectionClass = reflection ? 'has-reflection' : '';
        
        let reflectionContent = '';
        if (reflection) {
            reflectionContent = `
                <div class="reflection-content hidden" id="reflection-${decision.id}">
                    <div class="reflection-details">
                        <p><strong>最终决定：</strong> ${reflection.choice === 'yes' ? '做了' : '没做'}</p>
                        <p><strong>反思内容：</strong></p>
                        <p class="reflection-text">${reflection.text}</p>
                        <p class="reflection-date">记录于：${formatDate(new Date(reflection.createdAt))}</p>
                    </div>
                </div>
            `;
        }
        
        const reflectionBtn = reflection ? 
            `<div class="decision-actions-group">
                <button class="decision-btn btn-view-reflection" data-id="${decision.id}">
                    <i class="fas fa-book"></i> 查看反思
                </button>
                <button class="decision-btn btn-delete-reflection" data-id="${decision.id}">
                    <i class="fas fa-trash"></i> 删除反思
                </button>
            </div>` : 
            `<button class="decision-btn btn-reflect" data-id="${decision.id}">
                <i class="fas fa-pen"></i> 添加反思
            </button>`;
        
        const importanceClass = `importance-${decision.importance || 'low'}`;
        
        html += `
            <div class="decision-item ${reflectionClass}">
                <div class="decision-info">
                    <div class="decision-title">${decision.title}</div>
                    <div class="decision-meta">
                        <span class="decision-importance">
                            <span class="importance-indicator ${importanceClass}"></span>
                            ${getImportanceText(decision.importance)}
                        </span>
                        <span class="decision-date">
                            <i class="fas fa-calendar-check"></i>
                            完成于 ${formatDate(new Date(decision.decidedAt))}
                        </span>
                    </div>
                    ${reflectionContent}
                </div>
                <div class="decision-actions">
                    ${reflectionBtn}
                </div>
            </div>
        `;
    });
    
    completedList.innerHTML = html;
    
    // 添加查看反思的点击事件
    completedList.querySelectorAll('.btn-view-reflection').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.closest('.btn-view-reflection').getAttribute('data-id');
            const reflectionContent = document.getElementById(`reflection-${id}`);
            const allReflections = document.querySelectorAll('.reflection-content');
            
            // 关闭其他打开的反思
            allReflections.forEach(r => {
                if (r.id !== `reflection-${id}`) {
                    r.classList.add('hidden');
                    const btn = r.closest('.decision-item').querySelector('.btn-view-reflection');
                    if (btn) {
                        btn.innerHTML = '<i class="fas fa-book"></i> 查看反思';
                    }
                }
            });
            
            // 切换当前反思的显示状态
            if (reflectionContent.classList.contains('hidden')) {
                reflectionContent.classList.remove('hidden');
                e.target.closest('.btn-view-reflection').innerHTML = '<i class="fas fa-times"></i> 关闭反思';
            } else {
                reflectionContent.classList.add('hidden');
                e.target.closest('.btn-view-reflection').innerHTML = '<i class="fas fa-book"></i> 查看反思';
            }
        });
    });
    
    // 添加删除反思的点击事件
    completedList.querySelectorAll('.btn-delete-reflection').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.closest('.btn-delete-reflection').getAttribute('data-id');
            if (confirm('确定要删除这条反思吗？此操作不可撤销。')) {
                deleteReflection(id);
            }
        });
    });
    
    // 添加反思按钮的事件监听
    completedList.querySelectorAll('.btn-reflect').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            openReflectionForm(id);
        });
    });
}

// 删除反思
function deleteReflection(decisionId) {
    // 删除反思记录
    const reflectionIndex = reflections.findIndex(r => r.decisionId === decisionId);
    if (reflectionIndex !== -1) {
        reflections.splice(reflectionIndex, 1);
        saveReflections();
    }
    
    // 同时删除对应的决定记录
    const decisionIndex = decisions.findIndex(d => d.id === decisionId);
    if (decisionIndex !== -1) {
        decisions.splice(decisionIndex, 1);
        saveDecisions();
    }
    
    displayCompletedDecisions();
    updateStats();
    showNotification('记录已删除', 'success');
}

// 打开反思表单
function openReflectionForm(decisionId) {
    const decision = decisions.find(d => d.id === decisionId);
    if (!decision) return;
    
    document.getElementById('reflection-decision-id').value = decisionId;
    document.getElementById('reflection-text').value = '';
    
    const reflection = reflections.find(r => r.decisionId === decisionId);
    if (reflection) {
        document.querySelector(`input[name="final-choice"][value="${reflection.choice}"]`).checked = true;
        document.getElementById('reflection-text').value = reflection.text;
    } else {
        document.querySelector(`input[name="final-choice"][value="yes"]`).checked = true;
    }
    
    document.getElementById('reflection-form-container').classList.remove('hidden');
    document.getElementById('reflection-text').focus();
}

// 提交反思
function submitReflection() {
    const decisionId = document.getElementById('reflection-decision-id').value;
    const choice = document.querySelector('input[name="final-choice"]:checked').value;
    const text = document.getElementById('reflection-text').value.trim();
    
    if (!text) {
        showNotification('请输入你的反思', 'error');
        return;
    }
    
    const existingIndex = reflections.findIndex(r => r.decisionId === decisionId);
    
    if (existingIndex !== -1) {
        reflections[existingIndex].choice = choice;
        reflections[existingIndex].text = text;
        reflections[existingIndex].updatedAt = new Date().toISOString();
    } else {
        const newReflection = {
            id: generateId(),
            decisionId,
            choice,
            text,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        reflections.push(newReflection);
    }
    
    saveReflections();
    document.getElementById('reflection-form-container').classList.add('hidden');
    displayCompletedDecisions();
    showNotification('反思已保存', 'success');
}

// 初始化练习标签
function initExercisesTab() {
    const exerciseButtons = document.querySelectorAll('.start-exercise');
    const modal = document.getElementById('exercise-modal');
    const modalContent = document.getElementById('exercise-content');
    const closeModal = document.querySelector('.close-modal');
    
    // 打开练习模态框
    exerciseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const exerciseType = button.getAttribute('data-exercise');
            openExercise(exerciseType);
            modal.style.display = 'flex';
        });
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // 点击外部区域关闭模态框
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
}

// 打开指定练习
function openExercise(type) {
    const modalContent = document.getElementById('exercise-content');
    
    switch (type) {
        case 'five-second':
            modalContent.innerHTML = `
                <h2>5秒法则练习</h2>
                <div class="exercise-description">
                    <p>5秒法则帮助你克服犹豫和拖延。当你想到应该做什么事情，马上数5,4,3,2,1，然后立即行动。</p>
                </div>
                
                <div class="exercise-step">
                    <h3>练习步骤</h3>
                    <ol>
                        <li>想一件你一直犹豫要做的小事（5分钟内能完成的）</li>
                        <li>在下面输入这件事</li>
                        <li>点击"开始倒数"按钮</li>
                        <li>倒数结束后，立即去完成这件事</li>
                    </ol>
                </div>
                
                <div class="exercise-action">
                    <input type="text" id="five-second-task" placeholder="输入你想做的事情..." class="exercise-input">
                    <button id="start-countdown" class="primary-btn">开始倒数</button>
                </div>
                
                <div id="countdown-display" class="countdown-display hidden">
                    <div class="countdown-number">5</div>
                </div>
                
                <div id="exercise-complete" class="exercise-complete hidden">
                    <h3>现在就去行动！</h3>
                    <p>不要思考，直接去做这件事！</p>
                    <button id="mark-complete" class="success-btn">标记为已完成</button>
                </div>
            `;
            
            setTimeout(() => {
                document.getElementById('start-countdown').addEventListener('click', startFiveSecondCountdown);
                document.getElementById('mark-complete').addEventListener('click', () => {
                    showNotification('太棒了！你成功克服了犹豫！', 'success');
                    document.getElementById('exercise-modal').style.display = 'none';
                });
            }, 100);
            break;
            
        case 'ten-rule':
            modalContent.innerHTML = `
                <h2>10/10/10规则练习</h2>
                <div class="exercise-description">
                    <p>这个练习帮助你以更长远的眼光看待决定，减少短期情绪的影响。思考这个决定在10分钟、10个月和10年后会如何影响你。</p>
                </div>
                
                <div class="exercise-action">
                    <textarea id="ten-rule-decision" placeholder="描述你正在考虑的决定..." class="exercise-textarea"></textarea>
                </div>
                
                <div class="ten-rule-questions">
                    <div class="form-group">
                        <label>10分钟后，这个决定会怎样影响我？</label>
                        <textarea id="ten-minutes" class="exercise-textarea" placeholder="考虑短期情绪和即时影响..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>10个月后，这个决定会怎样影响我？</label>
                        <textarea id="ten-months" class="exercise-textarea" placeholder="考虑中期后果和变化..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>10年后，这个决定会怎样影响我？</label>
                        <textarea id="ten-years" class="exercise-textarea" placeholder="考虑长期影响和人生轨迹..."></textarea>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button id="save-ten-rule" class="primary-btn">保存反思</button>
                </div>
            `;
            
            setTimeout(() => {
                document.getElementById('save-ten-rule').addEventListener('click', () => {
                    const decision = document.getElementById('ten-rule-decision').value.trim();
                    const tenMinutes = document.getElementById('ten-minutes').value.trim();
                    const tenMonths = document.getElementById('ten-months').value.trim();
                    const tenYears = document.getElementById('ten-years').value.trim();
                    
                    if (!decision || !tenMinutes || !tenMonths || !tenYears) {
                        showNotification('请填写所有内容', 'warning');
                        return;
                    }
                    
                    const content = `
                        决定：${decision}
                        10分钟后：${tenMinutes}
                        10个月后：${tenMonths}
                        10年后：${tenYears}
                    `;
                    
                    saveExercise('ten-rule', content);
                    document.getElementById('exercise-modal').style.display = 'none';
                });
            }, 100);
            break;
            
        case 'worst-case':
            modalContent.innerHTML = `
                <h2>最坏情况分析</h2>
                <div class="exercise-description">
                    <p>这个练习帮助你克服对未知的恐惧。分析最坏可能发生什么，以及你如何应对。通常我们会发现最坏的结果也是可以接受的。</p>
                </div>
                
                <div class="form-group">
                    <label>你在考虑的决定是什么？</label>
                    <textarea id="worst-case-decision" class="exercise-textarea" placeholder="描述你正犹豫的决定..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>如果选择行动，最坏会发生什么？</label>
                    <textarea id="worst-outcome" class="exercise-textarea" placeholder="尽可能具体地描述最坏结果..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>这个最坏结果发生的概率有多高？(0-100%)</label>
                    <input type="number" id="worst-probability" min="0" max="100" value="50" class="probability-input">
                </div>
                
                <div class="form-group">
                    <label>如果最坏结果真的发生，你会如何应对？</label>
                    <textarea id="worst-solution" class="exercise-textarea" placeholder="列出你的应对策略..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>现在你的恐惧程度是？(0-10)</label>
                    <input type="range" id="fear-level" min="0" max="10" value="5" class="fear-slider">
                </div>
                
                <div class="form-actions">
                    <button id="save-worst-case" class="primary-btn">保存分析</button>
                </div>
            `;
            
            setTimeout(() => {
                document.getElementById('save-worst-case').addEventListener('click', () => {
                    const decision = document.getElementById('worst-case-decision').value.trim();
                    const outcome = document.getElementById('worst-outcome').value.trim();
                    const probability = document.getElementById('worst-probability').value;
                    const solution = document.getElementById('worst-solution').value.trim();
                    const fearLevel = document.getElementById('fear-level').value;
                    
                    if (!decision || !outcome || !solution) {
                        showNotification('请填写所有内容', 'warning');
                        return;
                    }
                    
                    const content = `
                        决定：${decision}
                        最坏结果：${outcome}
                        发生概率：${probability}%
                        应对策略：${solution}
                        恐惧程度：${fearLevel}/10
                    `;
                    
                    saveExercise('worst-case', content);
                    document.getElementById('exercise-modal').style.display = 'none';
                });
            }, 100);
            break;
            
        case 'small-risk':
            modalContent.innerHTML = `
                <h2>每日微冒险</h2>
                <div class="exercise-description">
                    <p>这个练习通过日常生活中的小冒险来帮助你建立决策的肌肉记忆。每天做一件小小的、没有严重后果但让你略感不适的事。</p>
                </div>
                
                <div class="risk-suggestions">
                    <h3>今日微冒险建议</h3>
                    <ul class="risk-list">
                        <li>点一道从未尝试的菜</li>
                        <li>采用不同的路线去熟悉的地方</li>
                        <li>和陌生人搭话</li>
                        <li>尝试一项新活动（15分钟即可）</li>
                        <li>穿一件平时不敢穿的衣服</li>
                        <li>分享一个你平时不会分享的想法</li>
                    </ul>
                </div>
                
                <div class="form-group">
                    <label>你今天要尝试的微冒险是？</label>
                    <textarea id="small-risk-task" class="exercise-textarea" placeholder="描述你打算做的小冒险..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>为什么选择这个？它让你感到多少不适？(0-10)</label>
                    <input type="range" id="discomfort-level" min="0" max="10" value="5" class="discomfort-slider">
                    <textarea id="risk-reason" class="exercise-textarea" placeholder="描述你的感受..."></textarea>
                </div>
                
                <div class="form-actions">
                    <button id="commit-small-risk" class="primary-btn">承诺尝试</button>
                </div>
            `;
            
            setTimeout(() => {
                document.getElementById('commit-small-risk').addEventListener('click', () => {
                    const task = document.getElementById('small-risk-task').value.trim();
                    const discomfort = document.getElementById('discomfort-level').value;
                    const reason = document.getElementById('risk-reason').value.trim();
                    
                    if (!task || !reason) {
                        showNotification('请填写所有内容', 'warning');
                        return;
                    }
                    
                    const content = `
                        今日微冒险：${task}
                        不适程度：${discomfort}/10
                        选择原因：${reason}
                    `;
                    
                    saveExercise('small-risk', content);
                    document.getElementById('exercise-modal').style.display = 'none';
                });
            }, 100);
            break;
    }
}

// 5秒倒计时功能
function startFiveSecondCountdown() {
    const taskInput = document.getElementById('five-second-task');
    const task = taskInput.value.trim();
    
    if (!task) {
        showNotification('请输入你要做的事情', 'warning');
        return;
    }
    
    const countdownDisplay = document.getElementById('countdown-display');
    const countdownNumber = countdownDisplay.querySelector('.countdown-number');
    const actionSection = document.querySelector('.exercise-action');
    const completeSection = document.getElementById('exercise-complete');
    
    actionSection.classList.add('hidden');
    countdownDisplay.classList.remove('hidden');
    
    let count = 5;
    countdownNumber.textContent = count;
    
    const interval = setInterval(() => {
        count--;
        countdownNumber.textContent = count;
        
        if (count <= 0) {
            clearInterval(interval);
            countdownDisplay.classList.add('hidden');
            completeSection.classList.remove('hidden');
            
            // 保存练习记录
            saveExercise('five-second', `完成了"${task}"的5秒法则练习。`);
        }
    }, 1000);
}

// 加载进度数据
function loadProgressData() {
    // 更新总体统计数据
    updateProgressStats();
    
    // 生成活动网格
    generateActivityGrid();
}

// 更新进度统计信息
function updateProgressStats() {
    document.getElementById('total-decisions').textContent = decisions.filter(d => d.decided).length || '0';
    
    const actionRate = calculateActionRate();
    document.getElementById('action-rate').textContent = actionRate + '%';
    
    document.getElementById('max-streak').textContent = settings.maxStreak || '0';
}

// 计算行动比率
function calculateActionRate() {
    const completedDecisions = decisions.filter(d => d.decided);
    const totalReflections = reflections.length;
    
    if (totalReflections === 0) return 0;
    
    const positiveActions = reflections.filter(r => r.choice === 'yes').length;
    return Math.round((positiveActions / totalReflections) * 100);
}

// 生成活动网格
function generateActivityGrid() {
    const activityGrid = document.getElementById('activity-grid');
    const days = 30;
    let html = '';
    
    const today = new Date();
    const decidedDates = decisions
        .filter(d => d.decided)
        .map(d => new Date(d.decidedAt).toISOString().split('T')[0]);
    
    const counts = {};
    decidedDates.forEach(date => {
        counts[date] = (counts[date] || 0) + 1;
    });
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = counts[dateStr] || 0;
        let activityClass = 'activity-none';
        
        if (count > 0) {
            if (count >= 3) {
                activityClass = 'activity-high';
            } else if (count >= 2) {
                activityClass = 'activity-medium';
            } else {
                activityClass = 'activity-low';
            }
        }
        
        html += `<div class="activity-day ${activityClass}" title="${formatDate(date)}: ${count}个决定"></div>`;
    }
    
    activityGrid.innerHTML = html;
}

// 更新统计数据
function updateStats() {
    // 本周决定计数
    const weekStart = getStartOfWeek();
    const weekDecisions = decisions.filter(d => {
        const decidedDate = d.decidedAt ? new Date(d.decidedAt) : null;
        return d.decided && decidedDate && decidedDate >= weekStart;
    });
    
    document.getElementById('decision-count').textContent = weekDecisions.length || '0';
    
    // 当前连续天数
    document.getElementById('streak-count').textContent = settings.streak || '0';
    
    // 待决定项目数
    document.getElementById('pending-count').textContent = decisions.filter(d => !d.decided).length || '0';
}

// 获取本周开始时间
function getStartOfWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 是周日，1 是周一，以此类推
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // 调整为以周一为起始
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// 更新连续天数
function updateStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDecision = decisions
        .filter(d => d.decided)
        .sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt))[0];
    
    if (!lastDecision) return;
    
    const lastDecisionDate = new Date(lastDecision.decidedAt);
    lastDecisionDate.setHours(0, 0, 0, 0);
    
    const lastSavedDate = settings.lastDecisionDate ? new Date(settings.lastDecisionDate) : null;
    
    // 判断是否是今天做的决定
    const isToday = lastDecisionDate.getTime() === today.getTime();
    
    // 判断是否是昨天做的决定
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = lastDecisionDate.getTime() === yesterday.getTime();
    
    if (isToday) {
        // 如果上次保存的日期不是今天，则增加连续天数
        if (!lastSavedDate || lastSavedDate.getTime() !== today.getTime()) {
            settings.streak++;
            settings.lastDecisionDate = today.toISOString();
            
            if (settings.streak > settings.maxStreak) {
                settings.maxStreak = settings.streak;
            }
            
            saveSettings();
        }
    } else if (isYesterday) {
        // 如果上次保存的日期是前天或更早，则重置连续天数为1
        if (!lastSavedDate || lastSavedDate.getTime() !== yesterday.getTime()) {
            settings.streak = 1;
            settings.lastDecisionDate = yesterday.toISOString();
            saveSettings();
        }
    } else {
        // 如果不是今天也不是昨天，则检查是否需要重置连续天数
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        if (lastDecisionDate < twoDaysAgo) {
            settings.streak = 0;
            settings.lastDecisionDate = null;
            saveSettings();
        }
    }
}

// 保存决定到本地存储
function saveDecisions() {
    localStorage.setItem('decisions', JSON.stringify(decisions));
}

// 保存反思到本地存储
function saveReflections() {
    localStorage.setItem('reflections', JSON.stringify(reflections));
}

// 保存设置到本地存储
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 格式化日期
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
}

// 为输入框格式化日期时间
function formatDateTimeForInput(date) {
    return date.toISOString().slice(0, 16);
}

// 获取重要性文本
function getImportanceText(importance) {
    switch (importance) {
        case 'low':
            return '小决定';
        case 'medium':
            return '中等决定';
        case 'high':
            return '重大决定';
        default:
            return '小决定';
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 保存练习记录
function saveExercise(type, content) {
    const now = new Date();
    
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                             now.getHours(), now.getMinutes(), now.getSeconds());
    
    const exercise = {
        id: generateId(),
        type,
        content,
        createdAt: localDate.toISOString()
    };
    
    
    exercises.unshift(exercise);
    localStorage.setItem('exercises', JSON.stringify(exercises));
    updateExerciseStreak();
    showNotification('练习记录已保存', 'success');
    
    // 如果在练习日记页面，更新显示
    if (document.querySelector('.tab-btn[data-tab="exercise-journal"]').classList.contains('active')) {
        displayExerciseJournal();
    }
}

// 更新练习连续天数
function updateExerciseStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (exercises.length === 0) {
        settings.exerciseStreak = 0;
        settings.lastExerciseDate = null;
        saveSettings();
        return;
    }
    
    const lastExercise = exercises[0];
    const lastExerciseDate = new Date(lastExercise.createdAt);
    lastExerciseDate.setHours(0, 0, 0, 0);
    
    if (lastExerciseDate.getTime() === today.getTime()) {
        if (!settings.lastExerciseDate || new Date(settings.lastExerciseDate).getTime() !== today.getTime()) {
            settings.exerciseStreak++;
            settings.lastExerciseDate = today.toISOString();
            
            if (settings.exerciseStreak > settings.maxExerciseStreak) {
                settings.maxExerciseStreak = settings.exerciseStreak;
            }
            
            saveSettings();
        }
    } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastExerciseDate.getTime() === yesterday.getTime()) {
            settings.exerciseStreak = 1;
            settings.lastExerciseDate = lastExerciseDate.toISOString();
            saveSettings();
        } else {
            settings.exerciseStreak = 0;
            settings.lastExerciseDate = null;
            saveSettings();
        }
    }
}

// 显示练习日记
function displayExerciseJournal() {
    displayExerciseProgress();
    displayExerciseCalendar();
    displayExerciseEntries();
}

// 新增函数：显示练习进度
function displayExerciseProgress() {
    const container = document.querySelector('.exercise-journal-container');
    
    // 创建进度展示区域
    const progressSection = document.createElement('div');
    progressSection.className = 'exercise-progress-section';
    
    // 添加进度统计卡片
    const stats = calculateExerciseStats();
    const statsHtml = `
        <div class="progress-cards">
            <div class="progress-card">
                <div class="progress-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="progress-info">
                    <h4>本周练习</h4>
                    <div class="progress-value">${stats.weeklyCount || '0'}</div>
                    <div class="progress-trend ${stats.weeklyTrend >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${stats.weeklyTrend >= 0 ? 'up' : 'down'}"></i>
                        ${Math.abs(stats.weeklyTrend)}%
                    </div>
                </div>
            </div>
            
            <div class="progress-card">
                <div class="progress-icon">
                    <i class="fas fa-fire"></i>
                </div>
                <div class="progress-info">
                    <h4>连续练习</h4>
                    <div class="progress-value">${settings.exerciseStreak || '0'}天</div>
                    <div class="progress-subtitle">历史最长: ${settings.maxExerciseStreak || '0'}天</div>
                </div>
            </div>
            
            <div class="progress-card">
                <div class="progress-icon">
                    <i class="fas fa-award"></i>
                </div>
                <div class="progress-info">
                    <h4>练习总数</h4>
                    <div class="progress-value">${exercises.length || '0'}</div>
                    <div class="progress-badges">
                        ${generateAchievementBadges(exercises.length)}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="exercise-insights">
            <div class="weekly-trend-chart">
                <h4>每周练习趋势</h4>
                <div class="trend-bars">
                    ${generateWeeklyTrendBars()}
                </div>
            </div>
            
            <div class="exercise-type-distribution">
                <h4>练习类型分布</h4>
                <div class="type-bars">
                    ${generateTypeDistribution()}
                </div>
            </div>
        </div>
    `;
    
    progressSection.innerHTML = statsHtml;
    container.insertBefore(progressSection, container.firstChild);
}

// 计算练习统计数据
function calculateExerciseStats() {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    
    const weeklyExercises = exercises.filter(e => new Date(e.createdAt) >= weekStart);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekExercises = exercises.filter(e => {
        const date = new Date(e.createdAt);
        return date >= lastWeekStart && date < weekStart;
    });
    
    const weeklyCount = weeklyExercises.length;
    const lastWeekCount = lastWeekExercises.length;
    const weeklyTrend = lastWeekCount === 0 ? 100 : 
        Math.round((weeklyCount - lastWeekCount) / lastWeekCount * 100);
    
    return {
        weeklyCount,
        weeklyTrend
    };
}

// 生成成就徽章
function generateAchievementBadges(total) {
    const badges = [
        { count: 1, icon: '🌱', title: '初学者' },
        { count: 10, icon: '🌿', title: '成长中' },
        { count: 30, icon: '🌳', title: '稳定者' },
        { count: 50, icon: '🏆', title: '达人' },
        { count: 100, icon: '👑', title: '大师' }
    ];
    
    return badges
        .filter(badge => total >= badge.count)
        .map(badge => `
            <span class="achievement-badge" title="${badge.title}">
                ${badge.icon}
            </span>
        `).join('');
}

// 生成每周趋势柱状图
function generateWeeklyTrendBars() {
    const weeks = 4;
    const data = [];
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const count = exercises.filter(e => {
            const date = new Date(e.createdAt);
            return date >= weekStart && date < weekEnd;
        }).length;
        
        data.push({ week: `W${weeks - i}`, count });
    }
    
    const maxCount = Math.max(...data.map(d => d.count));
    
    return data.map(d => `
        <div class="trend-bar-container">
            <div class="trend-bar" style="height: ${(d.count / maxCount * 100) || 0}%">
                <span class="trend-value">${d.count}</span>
            </div>
            <div class="trend-label">${d.week}</div>
        </div>
    `).join('');
}

// 生成练习类型分布
function generateTypeDistribution() {
    const types = {
        'five-second': '5秒法则',
        'ten-rule': '10/10/10规则',
        'worst-case': '最坏情况分析',
        'small-risk': '每日微冒险'
    };
    
    const distribution = {};
    exercises.forEach(e => {
        distribution[e.type] = (distribution[e.type] || 0) + 1;
    });
    
    const total = exercises.length;
    
    return Object.entries(types).map(([type, label]) => {
        const count = distribution[type] || 0;
        const percentage = total === 0 ? 0 : Math.round(count / total * 100);
        
        return `
            <div class="type-bar-container">
                <div class="type-label">${label}</div>
                <div class="type-bar-wrapper">
                    <div class="type-bar ${type}" style="width: ${percentage}%">
                        <span class="type-value">${count}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 显示练习日历
function displayExerciseCalendar() {
    const calendarGrid = document.getElementById('exercise-calendar-grid');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 获取当月第一天
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDay.getDay(); // 0 = 周日, 1 = 周一, ...
    
    // 获取当月天数
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    
    let html = '';
    
    // 添加月份标题
    html += `<div class="calendar-header" style="grid-column: 1 / -1; text-align: center; margin-bottom: 10px;">
        ${currentYear}年${currentMonth + 1}月
    </div>`;
    
    // 添加星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });
    
    // 添加空白天数
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // 添加日期
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        date.setHours(0, 0, 0, 0);
        
        // 使用本地时间格式化日期字符串
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        // 检查是否有练习记录
        const hasExercise = exercises.some(e => {
            const exerciseDate = new Date(e.createdAt);
            exerciseDate.setHours(0, 0, 0, 0);
            
            
            return exerciseDate.getFullYear() === date.getFullYear() &&
                   exerciseDate.getMonth() === date.getMonth() &&
                   exerciseDate.getDate() === date.getDate();
        });
        
        const isToday = today.getFullYear() === date.getFullYear() &&
                       today.getMonth() === date.getMonth() &&
                       today.getDate() === date.getDate();
        
        const classes = [
            'calendar-day',
            hasExercise ? 'has-exercise' : '',
            isToday ? 'today' : ''
        ].filter(Boolean).join(' ');
        
        html += `<div class="${classes}" data-date="${dateString}">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
    
    // 添加点击事件
    calendarGrid.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.getAttribute('data-date');
            filterExercisesByDate(date);
        });
    });
}

// 显示练习记录
function displayExerciseEntries(date = null) {
    const entriesList = document.getElementById('exercise-entries-list');
    let filteredExercises = exercises;
    
    if (date) {
        // 使用本地时间处理日期
        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        
        filteredExercises = exercises.filter(e => {
            const exerciseDate = new Date(e.createdAt);
            exerciseDate.setHours(0, 0, 0, 0);
                        
            return exerciseDate.getFullYear() === targetDate.getFullYear() &&
                   exerciseDate.getMonth() === targetDate.getMonth() &&
                   exerciseDate.getDate() === targetDate.getDate();
        });
        
    }
    
    if (filteredExercises.length === 0) {
        entriesList.innerHTML = '<p class="empty-state">还没有练习记录。</p>';
        return;
    }
    
    let html = '';
    
    if (settings.exerciseStreak > 0) {
        html += `
            <div class="exercise-streak">
                <i class="fas fa-fire streak-icon"></i>
                <span>连续练习 <span class="streak-count">${settings.exerciseStreak}</span> 天</span>
            </div>
        `;
    }
    
    // 按时间倒序排序
    filteredExercises.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    filteredExercises.forEach(exercise => {
        const date = new Date(exercise.createdAt);
        html += `
            <div class="exercise-entry">
                <div class="exercise-entry-header">
                    <span class="exercise-type">
                        <span class="exercise-tag ${exercise.type}">${getExerciseTypeText(exercise.type)}</span>
                    </span>
                    <span class="exercise-date">${formatDate(date)}</span>
                </div>
                <div class="exercise-content">${exercise.content}</div>
                <div class="exercise-actions">
                    <button class="decision-btn btn-delete-exercise" data-id="${exercise.id}">
                        <i class="fas fa-trash"></i> 删除记录
                    </button>
                </div>
            </div>
        `;
    });
    
    entriesList.innerHTML = html;
    
    // 添加删除事件监听
    entriesList.querySelectorAll('.btn-delete-exercise').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.closest('.btn-delete-exercise').getAttribute('data-id');
            if (confirm('确定要删除这条练习记录吗？此操作不可撤销。')) {
                deleteExercise(id);
            }
        });
    });
}

// 按日期筛选练习记录
function filterExercisesByDate(date) {
    displayExerciseEntries(date);
}

// 删除练习记录
function deleteExercise(id) {
    const index = exercises.findIndex(e => e.id === id);
    if (index !== -1) {
        exercises.splice(index, 1);
        localStorage.setItem('exercises', JSON.stringify(exercises));
        displayExerciseJournal();
        showNotification('练习记录已删除', 'success');
    }
}

// 获取练习类型文本
function getExerciseTypeText(type) {
    const types = {
        'five-second': '5秒法则',
        'ten-rule': '10/10/10规则',
        'worst-case': '最坏情况分析',
        'small-risk': '每日微冒险'
    };
    return types[type] || type;
}

// 情绪处理站功能
function initEmotionStation() {
    const emotionBtns = document.querySelectorAll('.emotion-btn');
    let selectedEmotion = null;

    emotionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const emotion = btn.dataset.emotion;
            emotionBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedEmotion = emotion;
            
            // 保存情绪记录
            const emotionHistory = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
            emotionHistory.push({
                date: new Date().toISOString(),
                emotion: emotion
            });
            localStorage.setItem('emotionHistory', JSON.stringify(emotionHistory));
            
            // 更新情绪图表
            updateEmotionChart();
            showNotification('情绪记录已保存', 'success');
        });
    });

    function updateEmotionChart() {
        const emotionHistory = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
        const chartContainer = document.querySelector('.emotion-chart');
        
        // 获取最近7天的数据
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const entry = emotionHistory.find(e => e.date.split('T')[0] === dateStr);
            last7Days.push({
                date: dateStr,
                emotion: entry ? entry.emotion : null
            });
        }
        
        // 为不同情绪定义颜色
        const emotionColors = {
            happy: '#4CAF50',    // 绿色
            calm: '#2196F3',     // 蓝色
            worried: '#FFC107',  // 黄色
            stressed: '#FF9800', // 橙色
            frustrated: '#F44336' // 红色
        };
        
        // 生成图表HTML
        const chartHtml = `
            <div class="emotion-chart-header">最近7天心情变化</div>
            <div class="emotion-chart-grid">
                ${last7Days.map(day => {
                    const date = new Date(day.date);
                    const dayOfMonth = date.getDate();
                    const month = date.getMonth() + 1;
                    return `
                        <div class="emotion-day">
                            <div class="emotion-date">${month}月${dayOfMonth}日</div>
                            <div class="emotion-indicator ${day.emotion || 'empty'}" 
                                 style="background: ${day.emotion ? emotionColors[day.emotion] : '#E0E0E0'}">
                                <i class="fas fa-${getEmotionIcon(day.emotion)}"></i>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="emotion-legend">
                <div class="legend-item">
                    <i class="fas fa-smile" style="color: ${emotionColors.happy}"></i>
                    <span>开心</span>
                </div>
                <div class="legend-item">
                    <i class="fas fa-peace" style="color: ${emotionColors.calm}"></i>
                    <span>平静</span>
                </div>
                <div class="legend-item">
                    <i class="fas fa-meh" style="color: ${emotionColors.worried}"></i>
                    <span>担忧</span>
                </div>
                <div class="legend-item">
                    <i class="fas fa-frown" style="color: ${emotionColors.stressed}"></i>
                    <span>压力</span>
                </div>
                <div class="legend-item">
                    <i class="fas fa-angry" style="color: ${emotionColors.frustrated}"></i>
                    <span>烦躁</span>
                </div>
            </div>
        `;
        
        chartContainer.innerHTML = chartHtml;
    }

    function getEmotionIcon(emotion) {
        const icons = {
            happy: 'smile',
            calm: 'peace',
            worried: 'meh',
            stressed: 'frown',
            frustrated: 'angry'
        };
        return emotion ? icons[emotion] : 'question';
    }

    // 初始化情绪图表
    updateEmotionChart();
}