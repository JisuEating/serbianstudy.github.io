let sentences = JSON.parse(localStorage.getItem("sentences")) || [];
let filteredSentences = sentences;
let mediaRecorder;
let recordedChunks = [];
let recordingTimeout;

// 定义汉字字典
const chineseDictionary = /[\u4e00-\u9fa5]/;

// 保存句子
function saveSentence() {
  const sentenceInput = document.getElementById("sentence-input").value.trim();
  const categoryInput = document.getElementById("category-input").value.trim() || "默认";

  if (!sentenceInput) {
    alert("请输入句子！");
    return;
  }

  // 提取汉语部分
  let chineseStart = -1;
  let chineseEnd = -1;
  for (let i = 0; i < sentenceInput.length; i++) {
    if (chineseDictionary.test(sentenceInput[i])) {
      if (chineseStart === -1) {
        chineseStart = i;
      }
      chineseEnd = i;
    }
  }

  if (chineseStart === -1 || chineseEnd === -1) {
    alert("请确保输入包含中文和塞尔维亚语！");
    return;
  }

  const chinese = sentenceInput.substring(chineseStart, chineseEnd + 1).replace(/\s+/g, ' ').trim();
  const serbian = (sentenceInput.substring(0, chineseStart) + " " + sentenceInput.substring(chineseEnd + 1)).replace(/\s+/g, ' ').trim();

  if (chinese.length === 0 || serbian.length === 0) {
    alert("请确保输入包含中文和塞尔维亚语！");
    return;
  }

  sentences.push({
    chinese: chinese,
    serbian: serbian,
    category: categoryInput,
  });
  localStorage.setItem("sentences", JSON.stringify(sentences));
  alert("句子保存成功！");
  updateCategoryOptions();
  displaySavedSentences();
}

// 查看/隐藏句子库
function toggleSentenceList() {
  const sentenceList = document.getElementById("sentence-list");
  sentenceList.style.display = sentenceList.style.display === "none" ? "block" : "none";
}

// 搜索句子（在句子库中）
function searchSentences() {
  const searchInput = document.getElementById("search-input").value.trim();
  const sentenceList = document.getElementById("sentence-list");

  if (!searchInput) {
    // 如果搜索框为空，显示所有句子
    filteredSentences = sentences;
    displaySavedSentences();
    return;
  }

  const results = sentences.filter(
    (s) => s.chinese.includes(searchInput) || s.serbian.includes(searchInput)
  );

  sentenceList.innerHTML = results.length
    ? results.map(
        (s, index) => `
          <div class="sentence-item">
            <span>${s.chinese} | ${s.serbian}</span>
            <button onclick="deleteSearchedSentence(${index})">删除</button>
          </div>
        `
      ).join("")
    : "<div class='output'>未找到匹配的句子</div>";

  sentenceList.style.display = "block";
}

// 复习中检索功能
function reviewSearch() {
  const searchInput = document.getElementById("review-search-input").value.trim();
  if (!searchInput) {
    // 如果搜索框为空，显示所有句子
    filteredSentences = sentences;
    return;
  }

  filteredSentences = sentences.filter(
    (sentence) =>
      sentence.chinese.includes(searchInput) || sentence.serbian.includes(searchInput)
  );

  if (filteredSentences.length === 0) {
    alert("未找到相关句子！");
  } else {
    alert(`找到 ${filteredSentences.length} 条句子，可开始复习！`);
  }
}

// 随机展示句子
function getRandomSentence() {
  const reviewSearchInput = document.getElementById("review-search-input").value.trim();
  
  // 如果搜索框为空，使用整个句子库
  if (!reviewSearchInput) {
    filteredSentences = sentences;
  }

  if (filteredSentences.length === 0) {
    alert("没有符合条件的句子！");
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredSentences.length);
  const randomSentence = filteredSentences[randomIndex];

  document.getElementById("random-chinese").textContent = randomSentence.chinese;
  document.getElementById("translation").textContent = randomSentence.serbian;
  document.getElementById("translation").classList.add("hidden");
}

// 显示已保存句子
function displaySavedSentences() {
  const sentenceList = document.getElementById("sentence-list");
  sentenceList.innerHTML = "";

  filteredSentences.forEach((sentence, index) => {
    const item = document.createElement("div");
    item.className = "sentence-item";
    item.innerHTML = `
      <span>${sentence.chinese} | ${sentence.serbian}</span>
      <button onclick="deleteSentence(${index})">删除</button>
    `;
    sentenceList.appendChild(item);
  });
}

// 删除句子
function deleteSentence(index) {
  sentences.splice(index, 1);
  localStorage.setItem("sentences", JSON.stringify(sentences));
  displaySavedSentences();
  updateCategoryOptions();
}

// 删除检索到的句子
function deleteSearchedSentence(index) {
  const sentenceToDelete = filteredSentences[index];
  const sentenceIndexInOriginal = sentences.findIndex(
    (s) => s.chinese === sentenceToDelete.chinese && s.serbian === sentenceToDelete.serbian
  );

  if (sentenceIndexInOriginal !== -1) {
    sentences.splice(sentenceIndexInOriginal, 1);
    localStorage.setItem("sentences", JSON.stringify(sentences));
    searchSentences();
    updateCategoryOptions();
  }
}

// 更新分类选项
function updateCategoryOptions() {
  const categories = Array.from(new Set(sentences.map((s) => s.category)));
  const categorySelect = document.getElementById("category-select");
  categorySelect.innerHTML = `<option value="">选择分类（所有）</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// 导出句子
function exportSentences() {
  const blob = new Blob([JSON.stringify(sentences, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sentences.json";
  document.body.appendChild(a); // 将<a>元素添加到DOM中
  a.click(); // 触发点击事件进行下载
  document.body.removeChild(a); // 下载完成后移除<a>元素
  URL.revokeObjectURL(url); // 释放URL对象
}

// 导入句子
function importSentences() {
  const fileInput = document.getElementById("import-file");
  const file = fileInput.files[0];

  if (!file) {
    alert("请选择一个文件！");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedSentences = JSON.parse(event.target.result);
      if (!Array.isArray(importedSentences)) {
        throw new Error("无效的文件格式！");
      }
      sentences = sentences.concat(importedSentences);
      localStorage.setItem("sentences", JSON.stringify(sentences));
      alert("句子导入成功！");
      updateCategoryOptions();
      displaySavedSentences();
    } catch (error) {
      alert("导入失败：" + error.message);
    }
  };
  reader.readAsText(file);
}

// 开始录音
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => recordedChunks.push(event.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      const audioPlayback = document.getElementById("audio-playback");
      audioPlayback.src = url;
      audioPlayback.classList.remove("hidden");
    };

    document.getElementById("recording-status").classList.remove("hidden");
    document.getElementById("stop-recording").classList.remove("hidden");
    mediaRecorder.start();

    recordingTimeout = setTimeout(() => stopRecording(), 10000); // 自动停止
  } catch (error) {
    alert("无法访问麦克风，请检查权限设置！");
  }
}

// 停止录音
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    clearTimeout(recordingTimeout);
    document.getElementById("recording-status").classList.add("hidden");
    document.getElementById("stop-recording").classList.add("hidden");
  }
}

// 显示翻译
function showTranslation() {
  document.getElementById("translation").classList.remove("hidden");
}

// 初始化页面
function initializePage() {
  filteredSentences = sentences;
  displaySavedSentences();
  updateCategoryOptions();
}

initializePage();