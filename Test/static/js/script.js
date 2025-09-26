// Lay's Detection Web App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const detectBtn = document.getElementById('detectBtn');
    const confidenceSlider = document.getElementById('confidence');
    const confidenceValue = document.getElementById('confidenceValue');
    const resultsSection = document.getElementById('resultsSection');
    const loading = document.getElementById('loading');

    // Confidence slider update
    confidenceSlider.addEventListener('input', function() {
        confidenceValue.textContent = this.value;
    });

    // File input change
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Detect button click
    detectBtn.addEventListener('click', function() {
        if (fileInput.files.length > 0) {
            detectLays();
        }
    });

    function handleFileSelect(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Validate file size (16MB max)
        if (file.size > 16 * 1024 * 1024) {
            alert('File size must be less than 16MB.');
            return;
        }

        // Update upload area with file info
        const uploadContent = uploadArea.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-check-circle upload-icon" style="color: #28a745;"></i>
            <h3>File Selected</h3>
            <p>${file.name}</p>
            <p style="font-size: 0.9rem; color: #666;">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
        `;

        // Enable detect button
        detectBtn.disabled = false;
    }

    function detectLays() {
        const file = fileInput.files[0];
        const confidence = confidenceSlider.value;

        // Show loading
        loading.style.display = 'block';
        resultsSection.style.display = 'none';

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('confidence', confidence);

        // Send request
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loading.style.display = 'none';
            displayResults(data);
        })
        .catch(error => {
            loading.style.display = 'none';
            console.error('Error:', error);
            alert('An error occurred while processing the image. Please try again.');
        });
    }

    function displayResults(data) {
        if (data.error) {
            alert('Error: ' + data.error);
            return;
        }

        // Show results section
        resultsSection.style.display = 'block';

        // Update status indicator
        const statusIndicator = document.getElementById('statusIndicator');
        if (data.detected) {
            statusIndicator.className = 'status-indicator success';
            statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i><span>Lay\'s detected!</span>';
        } else {
            statusIndicator.className = 'status-indicator error';
            statusIndicator.innerHTML = '<i class="fas fa-times-circle"></i><span>No Lay\'s detected</span>';
        }

        // Update stats
        document.getElementById('detectionCount').textContent = data.count;
        document.getElementById('avgConfidence').textContent = data.avg_confidence || '0.00';
        document.getElementById('uniqueLabels').textContent = data.unique_labels ? data.unique_labels.length : 0;

        // Display images
        const resultImage = document.getElementById('resultImage');
        resultImage.src = data.original_image;

        // Show annotated tab if available
        const annotatedTab = document.getElementById('annotatedTab');
        if (data.annotated_image) {
            annotatedTab.style.display = 'block';
            annotatedTab.onclick = () => showTab('annotated');
        } else {
            annotatedTab.style.display = 'none';
        }

        // Display detection list
        const detectionList = document.getElementById('detectionList');
        if (data.detections && data.detections.length > 0) {
            detectionList.innerHTML = data.detections.map((detection, index) => `
                <div class="detection-item">
                    <div class="detection-label">${index + 1}. ${detection.label}</div>
                    <div class="detection-confidence">Confidence: ${detection.score.toFixed(2)}</div>
                </div>
            `).join('');
        } else {
            detectionList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No detections found</p>';
        }

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Tab switching
    window.showTab = function(tabName) {
        const tabs = document.querySelectorAll('.tab-btn');
        const resultImage = document.getElementById('resultImage');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        
        if (tabName === 'original') {
            tabs[0].classList.add('active');
            // Keep original image
        } else if (tabName === 'annotated') {
            tabs[1].classList.add('active');
            // Fetch annotated image from the last result
            fetch('/upload', {
                method: 'POST',
                body: (() => {
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);
                    formData.append('confidence', confidenceSlider.value);
                    return formData;
                })()
            })
            .then(response => response.json())
            .then(data => {
                if (data.annotated_image) {
                    resultImage.src = data.annotated_image;
                }
            })
            .catch(error => console.error('Error loading annotated image:', error));
        }
    };

    // Reset functionality
    function resetUpload() {
        fileInput.value = '';
        detectBtn.disabled = true;
        resultsSection.style.display = 'none';
        
        const uploadContent = uploadArea.querySelector('.upload-content');
        uploadContent.innerHTML = `
            <i class="fas fa-cloud-upload-alt upload-icon"></i>
            <h3>Upload an Image</h3>
            <p>Drag and drop an image here or click to browse</p>
            <button class="upload-btn" onclick="document.getElementById('fileInput').click()">
                Choose File
            </button>
        `;
    }

    // Add reset button functionality (optional)
    // You can add a reset button to the UI if needed
});
