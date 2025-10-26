(function () {
  const SETUP_INTERVAL_MS = 2000;

  function setupGroup(group, uploadId) {
    const startBtn = document.querySelector(
      `[data-camera-group="${group}"][data-camera-role="start"]`
    );
    if (!startBtn || startBtn.dataset.cameraInitialized === 'true') {
      return;
    }

    const captureBtn = document.querySelector(
      `[data-camera-group="${group}"][data-camera-role="capture"]`
    );
    const cancelBtn = document.querySelector(
      `[data-camera-group="${group}"][data-camera-role="cancel"]`
    );
    const video = document.querySelector(
      `[data-camera-group="${group}"][data-camera-role="video"]`
    );
    const canvas = document.querySelector(
      `[data-camera-group="${group}"][data-camera-role="canvas"]`
    );
    const uploadInput = document.querySelector(
      `#${uploadId} input[type="file"]`
    );

    if (!captureBtn || !cancelBtn || !video || !canvas || !uploadInput) {
      return;
    }

    let stream = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('ビデオの自動再生に失敗しました:', err);
          });
        }

        startBtn.style.display = 'none';
        video.style.display = 'block';
        captureBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
      } catch (err) {
        console.error('カメラアクセスエラー:', err);
        alert('カメラへのアクセスに失敗しました。ブラウザの設定でカメラの使用を許可してください。');
      }
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      video.srcObject = null;
      video.style.display = 'none';
      video.removeAttribute('playsinline');
      video.removeAttribute('webkit-playsinline');
      captureBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      startBtn.style.display = 'flex';
    }

    function capturePhoto() {
      if (!video.videoWidth || !video.videoHeight) {
        console.warn('ビデオがまだ初期化されていません');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Blobの生成に失敗しました');
            return;
          }

          const file = new File([blob], `${group}_capture.jpg`, { type: 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          uploadInput.files = dataTransfer.files;

          const changeEvent = new Event('change', { bubbles: true });
          uploadInput.dispatchEvent(changeEvent);
          stopCamera();
        },
        'image/jpeg',
        0.95,
      );
    }

    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startCamera();
    });

    captureBtn.addEventListener('click', (e) => {
      e.preventDefault();
      capturePhoto();
    });

    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      stopCamera();
    });

    window.addEventListener('beforeunload', () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    startBtn.dataset.cameraInitialized = 'true';
  }

  function setupAllGroups() {
    const startButtons = document.querySelectorAll('[data-camera-role="start"]');
    startButtons.forEach((btn) => {
      const group = btn.dataset.cameraGroup;
      const uploadId = btn.dataset.cameraUploadId;
      if (group && uploadId) {
        setupGroup(group, uploadId);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupAllGroups, 500);
    });
  } else {
    setTimeout(setupAllGroups, 500);
  }

  const observer = new MutationObserver(() => {
    setupAllGroups();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setInterval(setupAllGroups, SETUP_INTERVAL_MS);
})();
