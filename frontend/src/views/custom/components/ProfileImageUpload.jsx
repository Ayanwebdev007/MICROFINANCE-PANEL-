/*!

=========================================================
* Black Dashboard PRO React - v1.2.4
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
// used for making the prop types of this component
import PropTypes from "prop-types";

import {Button} from "reactstrap";

import defaultImage from "assets/img/image_placeholder.jpg";
import defaultAvatar from "assets/img/placeholder.jpg";
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";

const ProfileImageUpload = ({
                              avatar = false,
                              addBtnColor = "primary",
                              addBtnClasses = "btn-round",
                              changeBtnColor = "primary",
                              changeBtnClasses = "btn-round",
                              removeBtnColor = "danger",
                              removeBtnClasses = "btn-round",
                              disable = false,
                              id, uuid, bankId, setAlert,
                            }) => {
  const [file, setFile] = React.useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState(
    avatar ? defaultAvatar : defaultImage
  );
  const fileInput = React.useRef(null);
  const storage = getStorage();
  // Webcam state and refs
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [isPhotoTaken, setIsPhotoTaken] = React.useState(false);
  const [isVideoReady, setIsVideoReady] = React.useState(false); // NEW
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    if (uuid !== '' && uuid !== '#'){
      const imageRef = ref(storage, `/${bankId}/image-assets/${id}/${uuid}`);
      getDownloadURL(imageRef).then((url) => {
        setImagePreviewUrl(url);
      }).catch((e) => {
        setImagePreviewUrl(avatar ? defaultAvatar : defaultImage);
      });
    }else {
      setImagePreviewUrl(avatar ? defaultAvatar : defaultImage);
    }
  }, [uuid])

  const handleImageChange = (e) => {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    reader.onloadend = () => {
      if (file.size < 110000 && (file.type).includes('image')) {
        setFile(file);
        setImagePreviewUrl(reader.result);
        const imageRef = ref(storage,`/${bankId}/image-assets/${id}/${uuid}`);
        uploadBytes(imageRef, file).then(() => {});
      } else {
        setAlert({
          color: 'warning',
          message: `File is too large. Max file size is 100 KB\n Supported only image formats`,
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: Date.now().toLocaleString(),
        });
        fileInput.current.value = null;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInput.current.click();
  };
  const handleRemove = () => {
    setFile(null);
    setImagePreviewUrl(avatar ? defaultAvatar : defaultImage);
    fileInput.current.value = null;
  };

  // Webcam helpers
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const waitForVideoReady = (video) =>
    new Promise((resolve) => {
      const onReady = () => {
        setIsVideoReady(true);
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('canplay', onReady);
        resolve();
      };
      if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        onReady();
      } else {
        video.addEventListener('loadedmetadata', onReady, { once: true });
        video.addEventListener('canplay', onReady, { once: true });
      }
    });

  const openCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setAlert({
          color: 'warning',
          message: 'Camera is not supported in this browser/device.',
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: Date.now().toLocaleString(),
        });
        return;
      }
      setIsVideoReady(false); // reset ready state
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Allow DOM to render the <video> before assigning stream
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.playsInline = true;
          videoRef.current.muted = true; // avoids autoplay restrictions on some browsers
          await videoRef.current.play().catch(() => {});
          await waitForVideoReady(videoRef.current);
        }
      });
      setIsPhotoTaken(false);
    } catch (err) {
      setAlert({
        color: 'danger',
        message: `Unable to access camera: ${err.message}`,
        autoDismiss: 7,
        place: 'tc',
        display: true,
        sweetAlert: false,
        timestamp: Date.now().toLocaleString(),
      });
    }
  };

  const closeCamera = () => {
    stopStream();
    setIsCameraOpen(false);
    setIsPhotoTaken(false);
    setIsVideoReady(false);
  };

  // Create a JPEG Blob from canvas with the given quality
  const blobFromCanvas = (canvas, quality) =>
    new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          quality
        );
      } catch (e) {
        reject(e);
      }
    });

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    // Guard against capturing before video is ready
    if (!isVideoReady || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      await new Promise((r) => setTimeout(r, 50));
      if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
        setAlert({
          color: 'warning',
          message: 'Camera is still initializing. Please try again in a moment.',
          autoDismiss: 5,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: Date.now().toLocaleString(),
        });
        return;
      }
    }

    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, w, h);

    // Try compressing to keep under 100 KB
    let quality = 0.8;
    for (let i = 0; i < 4; i++) {
      let blob;
      try {
        blob = await blobFromCanvas(canvas, quality);
      } catch (e) {
        setAlert({
          color: 'danger',
          message: `Failed to process image: ${e.message}`,
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
          timestamp: Date.now().toLocaleString(),
        });
        return;
      }

      if (blob.size <= 110000) {
        // Preview using dataURL (no dataURLToBlob required)
        const dataURL = canvas.toDataURL('image/jpeg', quality);
        setImagePreviewUrl(dataURL);

        const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        setFile(capturedFile);
        try {
          const imageRef = ref(storage, `/${bankId}/image-assets/${id}/${uuid}`);
          await uploadBytes(imageRef, blob);
        } catch (e) {
          setAlert({
            color: 'danger',
            message: `Upload failed: ${e.message}`,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
            timestamp: Date.now().toLocaleString(),
          });
        }
        setIsPhotoTaken(true);
        stopStream(); // stop camera after capture
        return;
      }
      quality -= 0.2; // reduce quality and retry
    }

    setAlert({
      color: 'warning',
      message: 'Captured image is too large. Please move closer and try again, or upload a smaller image.',
      autoDismiss: 7,
      place: 'tc',
      display: true,
      sweetAlert: false,
      timestamp: Date.now().toLocaleString(),
    });
  };

  React.useEffect(() => {
    // Cleanup on unmount
    return () => stopStream();
  }, []);
  return (
    <div className="fileinput text-center">
      <input type="file" onChange={handleImageChange} ref={fileInput}/>
      <div className={"thumbnail" + (avatar ? " img-circle" : "")}>
        <img src={imagePreviewUrl} alt="..."/>
      </div>
      {!disable && <div>
        {file === null ? (
          <Button
            color={addBtnColor}
            className={addBtnClasses}
            onClick={() => handleClick()}
          >
            {avatar ? "Add Logo" : "Select image"}
          </Button>
        ) : (
          <span>
            <Button
              color={changeBtnColor}
              className={changeBtnClasses}
              onClick={() => handleClick()}
            >
              Change
            </Button>
            {avatar ? <br/> : null}
            <Button
              color={removeBtnColor}
              className={removeBtnClasses}
              onClick={() => handleRemove()}
            >
              <i className="fa fa-times"/> Remove
            </Button>
          </span>
        )}
        {/* Capture with webcam button */}
        <div style={{ marginTop: 10 }}>
          <Button color="info" className="btn-simple" onClick={openCamera}>
            Capture with webcam
          </Button>
        </div>
      </div>}
      {/* Inline camera panel */}
      {isCameraOpen && (
        <div style={{ marginTop: 15 }}>
          {/* Show video only after it's ready to avoid blank area */}
          <div style={{ display: !isPhotoTaken && isVideoReady ? 'block' : 'none' }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: '100%', maxWidth: 260, borderRadius: 6 }}
            />
          </div>
          {/* Optional tiny hint while initializing */}
          {!isPhotoTaken && !isVideoReady && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Initializing camera…</div>
          )}
          <canvas
            ref={canvasRef}
            style={{
              display: isPhotoTaken ? 'block' : 'none',
              width: '100%',
              maxWidth: 260,
              borderRadius: 6
            }}
          />
          <div style={{ marginTop: 10 }}>
            {!isPhotoTaken ? (
              <>
                <Button
                  color="success"
                  className="btn-simple"
                  onClick={capturePhoto}
                  disabled={!isVideoReady} // Disable capture until ready
                >
                  Take Photo
                </Button>
                <Button color="secondary" className="btn-simple" onClick={closeCamera}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button color="primary" className="btn-simple" onClick={openCamera}>
                  Retake
                </Button>
                <Button color="secondary" className="btn-simple" onClick={closeCamera}>
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

ProfileImageUpload.propTypes = {
  avatar: PropTypes.bool,
  removeBtnClasses: PropTypes.string,
  removeBtnColor: PropTypes.oneOf([
    "default",
    "primary",
    "secondary",
    "success",
    "info",
    "warning",
    "danger",
    "link",
  ]),
  addBtnClasses: PropTypes.string,
  addBtnColor: PropTypes.oneOf([
    "default",
    "primary",
    "secondary",
    "success",
    "info",
    "warning",
    "danger",
    "link",
  ]),
  changeBtnClasses: PropTypes.string,
  changeBtnColor: PropTypes.oneOf([
    "default",
    "primary",
    "secondary",
    "success",
    "info",
    "warning",
    "danger",
    "link",
  ]),
};

export default ProfileImageUpload;
