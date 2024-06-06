import React from "react";
import "./App.css";
import Sample from "./sample";

function App() {
  const da = [
    {
      id: 0,
      name: "fdsdfffg",
      email: "fdfd@gma.co",
      address: "dfghdfgjd",
    },
    {
      id: 1,
      name: "jhjhgjghj",
      email: "hjjhgj@gma.co",
      address: "riotuoriuejfdngbjfgi",
    },
    {
      id: 2,
      name: "etyutrtyt",
      email: "yuyt@gma.co",
      address: "kjhdjkvbmbjkghjhgjkfdf",
    },
  ];

  return (
    <>
      <div>sddgfghhrghegu</div>
      <Sample da={da} />
    </>
  );
}

export default App;
