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

import { CustomInput } from "reactstrap";

const FixedPlugin = (props) => {
  const [classes, setClasses] = React.useState("dropdown");
  const [darkMode, setDarkMode] = React.useState(true);
  const handleClick = () => {
    if (classes === "dropdown") {
      setClasses("dropdown show");
    } else {
      setClasses("dropdown");
    }
  };
  const handleActiveMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("white-content");
  };
  return (
    <div className="fixed-plugin">
      <div className={classes}>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          <i className="fa fa-cog fa-2x" />
        </a>
        <ul className="dropdown-menu show">
          <li className="header-title">SIDEBAR BACKGROUND</li>
          <li className="adjustments-line">
            <div className="badge-colors text-center">
              {/* First Row - Primary Colors */}
              <span
                className={
                  props.activeColor === "primary"
                    ? "badge filter badge-primary active"
                    : "badge filter badge-primary"
                }
                data-color="primary"
                onClick={() => {
                  props.handleActiveClick("primary");
                }}
              />
              <span
                className={
                  props.activeColor === "blue"
                    ? "badge filter badge-info active"
                    : "badge filter badge-info"
                }
                data-color="info"
                onClick={() => {
                  props.handleActiveClick("blue");
                }}
              />
              <span
                className={
                  props.activeColor === "green"
                    ? "badge filter badge-success active"
                    : "badge filter badge-success"
                }
                data-color="success"
                onClick={() => {
                  props.handleActiveClick("green");
                }}
              />
              <span
                className={
                  props.activeColor === "orange"
                    ? "badge filter badge-warning active"
                    : "badge filter badge-warning"
                }
                data-color="warning"
                onClick={() => {
                  props.handleActiveClick("orange");
                }}
              />
              <span
                className={
                  props.activeColor === "red"
                    ? "badge filter badge-danger active"
                    : "badge filter badge-danger"
                }
                data-color="danger"
                onClick={() => {
                  props.handleActiveClick("red");
                }}
              />
              
              {/* Second Row - Additional Colors */}
              <br />
              <span
                className={
                  props.activeColor === "purple"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="purple"
                style={{ backgroundColor: "#8965e0" }}
                onClick={() => {
                  props.handleActiveClick("purple");
                }}
              />
              <span
                className={
                  props.activeColor === "teal"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="teal"
                style={{ backgroundColor: "#11cdef" }}
                onClick={() => {
                  props.handleActiveClick("teal");
                }}
              />
              <span
                className={
                  props.activeColor === "cyan"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="cyan"
                style={{ backgroundColor: "#2bffc6" }}
                onClick={() => {
                  props.handleActiveClick("cyan");
                }}
              />
              <span
                className={
                  props.activeColor === "dark"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="dark"
                style={{ backgroundColor: "#212529" }}
                onClick={() => {
                  props.handleActiveClick("dark");
                }}
              />
              <span
                className={
                  props.activeColor === "light-dark"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="light-dark"
                style={{ backgroundColor: "#32325d" }}
                onClick={() => {
                  props.handleActiveClick("light-dark");
                }}
              />
              
              {/* Third Row - More Color Options */}
              <br />
              <span
                className={
                  props.activeColor === "indigo"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="indigo"
                style={{ backgroundColor: "#5603ad" }}
                onClick={() => {
                  props.handleActiveClick("indigo");
                }}
              />
              <span
                className={
                  props.activeColor === "pink"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="pink"
                style={{ backgroundColor: "#f3a4b5" }}
                onClick={() => {
                  props.handleActiveClick("pink");
                }}
              />
              <span
                className={
                  props.activeColor === "yellow"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="yellow"
                style={{ backgroundColor: "#ffd600" }}
                onClick={() => {
                  props.handleActiveClick("yellow");
                }}
              />
              <span
                className={
                  props.activeColor === "gray"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="gray"
                style={{ backgroundColor: "#6c757d" }}
                onClick={() => {
                  props.handleActiveClick("gray");
                }}
              />
              <span
                className={
                  props.activeColor === "light"
                    ? "badge filter active"
                    : "badge filter"
                }
                data-color="light"
                style={{ backgroundColor: "#adb5bd" }}
                onClick={() => {
                  props.handleActiveClick("light");
                }}
              />
            </div>
          </li>
          <li className="header-title">SIDEBAR MINI</li>
          <li className="adjustments-line">
            <div className="togglebutton switch-sidebar-mini d-flex align-items-center justify-content-center">
              <span className="label-switch">OFF</span>
              <CustomInput
                type="switch"
                id="switch-1"
                onChange={props.handleMiniClick}
                value={props.sidebarMini}
                checked={props.sidebarMini}
                className="mt-n4"
              />
              <span className="label-switch ml-n3">ON</span>
            </div>
          </li>
          <li className="adjustments-line mb-2">
            <div className="togglebutton switch-change-color mt-3 d-flex align-items-center justify-content-center">
              <span className="label-switch">LIGHT MODE</span>
              <CustomInput
                type="switch"
                id="switch-2"
                onChange={handleActiveMode}
                value={darkMode}
                checked={darkMode}
                className="mt-n4"
              />
              <span className="label-switch ml-n3">DARK MODE</span>
            </div>
          </li>
          {/*<li className="button-container">*/}
          {/*  <Button*/}
          {/*    href="https://www.creative-tim.com/product/black-dashboard-pro-react"*/}
          {/*    color="primary"*/}
          {/*    block*/}
          {/*    className="btn-round"*/}
          {/*  >*/}
          {/*    Buy now*/}
          {/*  </Button>*/}
          {/*</li>*/}
          {/*<li className="button-container">*/}
          {/*  <Button*/}
          {/*    color="default"*/}
          {/*    block*/}
          {/*    className="btn-round"*/}
          {/*    outline*/}
          {/*    href="https://demos.creative-tim.com/black-dashboard-pro-react/#/documentation/tutorial"*/}
          {/*    target="_blank"*/}
          {/*  >*/}
          {/*    <i className="nc-icon nc-paper" /> Documentation*/}
          {/*  </Button>*/}
          {/*</li>*/}
          {/*<li className="button-container">*/}
          {/*  <Button*/}
          {/*    href="https://www.creative-tim.com/product/black-dashboard-react"*/}
          {/*    color="info"*/}
          {/*    block*/}
          {/*    className="btn-round"*/}
          {/*  >*/}
          {/*    Get free version*/}
          {/*  </Button>*/}
          {/*</li>*/}
        </ul>
      </div>
    </div>
  );
};

export default FixedPlugin;