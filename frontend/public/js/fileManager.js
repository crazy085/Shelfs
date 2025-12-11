document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const filesContainer = document.getElementById('filesContainer');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const previewModal = document.getElementById('previewModal');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    const closePreview = document.getElementById('closePreview');
    const downloadBtn = document.getElementById('downloadBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const storageUsed = document.getElementById('storageUsed');
    const storageBar = document.getElementById('storageBar');

    // State
    let files = [];
    let currentPreviewFile = null;

    // File upload
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // Search and sort
    searchInput.addEventListener('input', debounce(filterFiles, 300));
    sortSelect.addEventListener('change', sortFiles);

    // Preview modal
    closePreview.addEventListener('click', () => {
        previewModal.classList.add('hidden');
    });

    downloadBtn.addEventListener('click', () => {
        if (currentPreviewFile) {
            downloadFile(currentPreviewFile);
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (currentPreviewFile) {
            await deleteFile(currentPreviewFile);
            previewModal.classList.add('hidden');
        }
    });

    // Functions
    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    }

    async function handleFiles(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            await uploadFile(fileList[i]);
        }
    }

    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        uploadProgress.classList.remove('hidden');
        progressText.textContent = `Uploading ${file.name}...`;

        try {
            const xhr = new XMLHttpRequest();

            // Update progress bar
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    progressBar.style.width = `${percentComplete}%`;
                    progressText.textContent = `Uploading ${file.name}: ${Math.round(percentComplete)}%`;
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status === 201) {
                    showToast(`${file.name} uploaded successfully`, 'success');
                    fetchFiles();
                } else {
                    showToast(`Failed to upload ${file.name}`, 'error');
                }
                uploadProgress.classList.add('hidden');
                progressBar.style.width = '0%';
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                showToast(`Network error while uploading ${file.name}`, 'error');
                uploadProgress.classList.add('hidden');
                progressBar.style.width = '0%';
            });

            // Open and send request
            xhr.open('POST', '/files/upload');
            xhr.send(formData);
        } catch (error) {
            console.error('Upload error:', error);
            showToast(`Error uploading ${file.name}`, 'error');
            uploadProgress.classList.add('hidden');
            progressBar.style.width = '0%';
        }
    }

    async function fetchFiles() {
        try {
            const response = await fetch('/files/list');
            const data = await response.json();

            if (response.ok) {
                files = data.files;
                renderFiles();
                updateStorageInfo();
            } else {
                showToast('Failed to fetch files', 'error');
            }
        } catch (error) {
            console.error('Fetch files error:', error);
            showToast('Network error. Please try again.', 'error');
        }
    }

    function renderFiles() {
        if (files.length === 0) {
            filesContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        filesContainer.innerHTML = '';

        files.forEach(file => {
            const fileCard = createFileCard(file);
            filesContainer.appendChild(fileCard);
        });
    }

    function createFileCard(file) {
        const card = document.createElement('div');
        card.className = 'file-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer animate-fade-in';
        
        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);
        const fileDate = formatDate(file.modifiedAt);

        card.innerHTML = `
            <div class="file-icon ${fileIcon.class}">
                <i class="${fileIcon.icon} text-2xl"></i>
            </div>
            <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate" title="${file.name}">${file.name}</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${fileSize}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${fileDate}</p>
        `;

        card.addEventListener('click', () => {
            previewFile(file);
        });

        return card;
    }

    function getFileIcon(fileType) {
        const type = fileType.toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(type)) {
            return { class: 'image', icon: 'fas fa-image' };
        } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type)) {
            return { class: 'document', icon: 'fas fa-file-alt' };
        } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) {
            return { class: 'video', icon: 'fas fa-video' };
        } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(type)) {
            return { class: 'audio', icon: 'fas fa-music' };
        } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
            return { class: 'archive', icon: 'fas fa-file-archive' };
        } else {
            return { class: 'other', icon: 'fas fa-file' };
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    function updateStorageInfo() {
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        storageUsed.textContent = totalSizeMB;
        
        // Assuming 1GB storage limit
        const storagePercentage = Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100);
        storageBar.style.width = `${storagePercentage}%`;
    }

    function previewFile(file) {
        currentPreviewFile = file;
        previewTitle.textContent = file.name;
        
        const fileType = file.type.toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType)) {
            previewContent.innerHTML = `<img src="/files/preview/${encodeURIComponent(file.name)}" alt="${file.name}" class="max-w-full max-h-full mx-auto">`;
        } else if (fileType === 'pdf') {
            previewContent.innerHTML = `<iframe src="/files/preview/${encodeURIComponent(file.name)}" class="w-full h-96"></iframe>`;
        } else if (['txt', 'md', 'json', 'xml', 'csv'].includes(fileType)) {
            fetch(`/files/preview/${encodeURIComponent(file.name)}`)
                .then(response => response.text())
                .then(content => {
                    previewContent.innerHTML = `<pre class="whitespace-pre-wrap text-sm">${escapeHtml(content)}</pre>`;
                })
                .catch(error => {
                    console.error('Preview error:', error);
                    previewContent.innerHTML = '<p class="text-center text-gray-500">Preview not available</p>';
                });
        } else {
            previewContent.innerHTML = `
                <div class="text-center py-8">
                    <div class="file-icon ${getFileIcon(file.type).class} mx-auto mb-4">
                        <i class="${getFileIcon(file.type).icon} text-4xl"></i>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400">Preview not available for this file type</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">File size: ${formatFileSize(file.size)}</p>
                </div>
            `;
        }
        
        previewModal.classList.remove('hidden');
    }

    function downloadFile(file) {
        const link = document.createElement('a');
        link.href = `/files/download/${encodeURIComponent(file.name)}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function deleteFile(file) {
        if (!confirm(`Are you sure you want to delete ${file.name}?`)) {
            return;
        }

        try {
            const response = await fetch(`/files/${encodeURIComponent(file.name)}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`${file.name} deleted successfully`, 'success');
                fetchFiles();
            } else {
                showToast(data.message || 'Failed to delete file', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Network error. Please try again.', 'error');
        }
    }

    function filterFiles() {
        const searchTerm = searchInput.value.toLowerCase();
        
        if (!searchTerm) {
            renderFiles();
            return;
        }

        const filteredFiles = files.filter(file => 
            file.name.toLowerCase().includes(searchTerm)
        );
        
        files = filteredFiles;
        renderFiles();
        
        // Restore original files list for next filter
        fetchFiles();
    }

    function sortFiles() {
        const sortBy = sortSelect.value;
        
        switch (sortBy) {
            case 'name':
                files.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'size':
                files.sort((a, b) => a.size - b.size);
                break;
            case 'date':
                files.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
                break;
        }
        
        renderFiles();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Make fetchFiles available globally
    window.fetchFiles = fetchFiles;
});
