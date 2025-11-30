// $ npm install firebase (in the terminal) 

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWV7khkS68Iv077wjECFbHaUJ-EiVE-TM",
  authDomain: "pu-poornima.firebaseapp.com",
  projectId: "pu-poornima",
  storageBucket: "pu-poornima.firebasestorage.app",
  messagingSenderId: "745703036616",
  appId: "1:745703036616:web:79c1247eabf9b5fdf7f7fd",
  measurementId: "G-GDSQYFM79N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);