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
import {LinearProgress} from "@mui/material";

const ProfileImageUpload = ({
                              avatar = false,
                              addBtnColor = "primary",
                              addBtnClasses = "btn-round",
                              changeBtnColor = "primary",
                              changeBtnClasses = "btn-round",
                              removeBtnColor = "danger",
                              removeBtnClasses = "btn-round",
                              disable = false,
                              uuid, setAlert, getImageUrl, logoUrl, type
                            }) => {
  const [file, setFile] = React.useState(null);
  const [progressBar, setProgressBar] = React.useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState(
    avatar ? defaultAvatar : defaultImage
  );
  const fileInput = React.useRef(null);
  const storage = getStorage();
  
  React.useEffect(() => {
    if (logoUrl){
      setImagePreviewUrl(logoUrl);
    }
  }, [logoUrl])

  const handleImageChange = (e) => {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    reader.onloadend = () => {
      if (file.size < 110000 && (file.type).includes('image')) {
        setFile(file);
        // setImagePreviewUrl(reader.result);
        setProgressBar(true);
        const imageRef = ref(storage,`/admin/image-assets/${type}/${uuid}`);
        uploadBytes(imageRef, file).then(() => {
          getDownloadURL(imageRef).then((url) => {
            setProgressBar(false);
            setImagePreviewUrl(url);
            getImageUrl(url);
          }).catch((e) => {
            setProgressBar(false);
            setAlert({
              color: 'danger',
              message: e.message,
              autoDismiss: 7,
              place: 'tc',
              display: true,
              sweetAlert: false,
            });
          });
        }).catch((e) => {
          setProgressBar(false);
          setAlert({
            color: 'danger',
            message: e.message,
            autoDismiss: 7,
            place: 'tc',
            display: true,
            sweetAlert: false,
          });
        });
      } else {
        setProgressBar(false);
        setAlert({
          color: 'warning',
          message: `File is too large. Max file size is 100 KB\n Supported only image formats`,
          autoDismiss: 7,
          place: 'tc',
          display: true,
          sweetAlert: false,
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
  return (
    <div className="fileinput text-center">
      {progressBar && <LinearProgress />}
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
            {avatar ? "Add Logo" : "Select Logo"}
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
      </div>}
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
