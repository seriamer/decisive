// 冥想计时器功能
let meditationTimer;
let isTimerRunning = false;
let timeLeft = 300; // 5分钟冥想

document.addEventListener('DOMContentLoaded', () => {
    const startMeditationBtn = document.querySelector('.start-meditation');
    const timerDisplay = document.querySelector('.timer-display');
    const gratitudeInput = document.querySelector('.gratitude-input');
    const saveGratitudeBtn = document.querySelector('.save-gratitude');
    const emotionBtns = document.querySelectorAll('.emotion-btn');
    const notesList = document.querySelector('.notes-list');

    // 加载保存的心情笔记
    if (notesList) {
        loadSavedNotes();
    }

    // 添加情绪按钮点击事件
    if (emotionBtns) {
        emotionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const emotion = btn.dataset.emotion;
                // 移除其他按钮的选中状态
                emotionBtns.forEach(b => b.classList.remove('selected'));
                // 添加当前按钮的选中状态
                btn.classList.add('selected');
                
                // 保存情绪记录
                const emotionHistory = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
                const today = new Date().toISOString().split('T')[0];
                
                // 检查今天是否已经记录过情绪
                const todayIndex = emotionHistory.findIndex(e => e.date.split('T')[0] === today);
                if (todayIndex !== -1) {
                    // 更新今天的情绪记录
                    emotionHistory[todayIndex] = {
                        date: new Date().toISOString(),
                        emotion: emotion
                    };
                } else {
                    // 添加新的情绪记录
                    emotionHistory.push({
                        date: new Date().toISOString(),
                        emotion: emotion
                    });
                }
                
                localStorage.setItem('emotionHistory', JSON.stringify(emotionHistory));
                
                // 更新情绪图表
                updateEmotionChart();
                showNotification('情绪记录已更新', 'success');
            });
        });
    }

    if (startMeditationBtn && timerDisplay) {
        startMeditationBtn.addEventListener('click', () => {
            if (!isTimerRunning) {
                startMeditation();
            } else {
                stopMeditation();
            }
        });
    }

    if (saveGratitudeBtn && gratitudeInput) {
        saveGratitudeBtn.addEventListener('click', () => {
            saveGratitudeNote();
        });
    }

    // 初始化显示时间
    updateTimerDisplay();
});

function startMeditation() {
    const startMeditationBtn = document.querySelector('.start-meditation');
    isTimerRunning = true;
    startMeditationBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停冥想';
    startMeditationBtn.style.background = 'linear-gradient(135deg, #FF5722, #F44336)';

    meditationTimer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            completeMeditation();
        }
    }, 1000);
}

function stopMeditation() {
    const startMeditationBtn = document.querySelector('.start-meditation');
    isTimerRunning = false;
    clearInterval(meditationTimer);
    startMeditationBtn.innerHTML = '<i class="fas fa-play"></i> 开始冥想';
    startMeditationBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
}

function completeMeditation() {
    stopMeditation();
    timeLeft = 300; // 重置计时器
    updateTimerDisplay();
    alert('恭喜你完成了5分钟的冥想！');
}

function updateTimerDisplay() {
    const timerDisplay = document.querySelector('.timer-display');
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 保存心情笔记功能
function saveGratitudeNote() {
    const gratitudeInput = document.querySelector('.gratitude-input');
    const notesList = document.querySelector('.notes-list');
    
    if (gratitudeInput && gratitudeInput.value.trim() !== '') {
        const noteText = gratitudeInput.value.trim();
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;

        // 创建新笔记对象
        const newNote = {
            id: Date.now(),
            text: noteText,
            date: formattedDate
        };

        // 获取现有笔记
        let savedNotes = JSON.parse(localStorage.getItem('gratitudeNotes') || '[]');
        
        // 只保留最近7天的笔记
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        savedNotes = savedNotes.filter(note => new Date(note.date) > sevenDaysAgo);
        
        // 添加新笔记
        savedNotes.unshift(newNote);
        
        // 保存到localStorage
        localStorage.setItem('gratitudeNotes', JSON.stringify(savedNotes));

        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
            <div class="note-date">
                <i class="fas fa-calendar"></i>
                ${formattedDate}
            </div>
            <div class="note-text">${noteText}</div>
        `;

        if (notesList) {
            // 在列表开头插入新笔记
            notesList.insertBefore(noteItem, notesList.firstChild);
            
            // 清空输入框
            gratitudeInput.value = '';
            
            // 显示成功提示
            showNotification('笔记已保存', 'success');
        }
    } else {
        showNotification('请输入内容后再保存', 'warning');
    }
}

// 加载保存的心情笔记
function loadSavedNotes() {
    const notesList = document.querySelector('.notes-list');
    if (!notesList) return;

    const savedNotes = JSON.parse(localStorage.getItem('gratitudeNotes') || '[]');
    
    // 只显示最近7天的笔记
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentNotes = savedNotes.filter(note => new Date(note.date) > sevenDaysAgo);
    
    if (recentNotes.length > 0) {
        notesList.innerHTML = recentNotes.map(note => `
            <div class="note-item">
                <div class="note-date">
                    <i class="fas fa-calendar"></i>
                    ${note.date}
                </div>
                <div class="note-text">${note.text}</div>
            </div>
        `).join('');
    } else {
        notesList.innerHTML = '<div class="empty-notes">还没有记录心情呢...</div>';
    }
}

// 显示通知提示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 添加显示类
    setTimeout(() => notification.classList.add('show'), 100);

    // 3秒后移除通知
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateEmotionChart() {
    const emotionHistory = JSON.parse(localStorage.getItem('emotionHistory') || '[]');
    const chartContainer = document.querySelector('.emotion-chart');
    
    if (!chartContainer) return;

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