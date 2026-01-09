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
import ReactDOM from "react-dom/client";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { Provider } from "react-redux";
import store from "./store";
import axios from "axios";

import "assets/css/nucleo-icons.css";
import "react-notification-alert/dist/animate.css";
import "assets/scss/black-dashboard-pro-react.scss?v=1.2.0";
import "assets/demo/demo.css";

import App from "./App";

if (process.env.REACT_APP_API_URL) {
    let apiUrl = process.env.REACT_APP_API_URL;
    if (!apiUrl.startsWith('http')) {
        apiUrl = `https://${apiUrl}`;
    }
    axios.defaults.baseURL = apiUrl;
    axios.defaults.withCredentials = true;
}



const root = ReactDOM.createRoot(document.getElementById("root"));

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

document.body.classList.add("white-content");
document.body.classList.add("sidebar-mini");

root.render(
    <Provider store={store}>
        <App />
    </Provider>
);
