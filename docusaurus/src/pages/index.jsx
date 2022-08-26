import Layout from "@theme/Layout";
import BlogLayout from "@theme/BlogLayout";
import Admonition from "@theme/Admonition";
import Heading from "@theme/Heading";
import React from "react";

import meta from "../../../data/repos/meta.json";
import FrontPageItem from "./_components/FrontPageItem";

export default function Index(prop) {
  let [service, frontend, other] = ["service", "frontend", "other"]
    .map(g => Object.fromEntries(
      Object.entries(meta).filter(([k, v]) => v.group === g)
    ));


  let groupRowCounter = 0;
  let groupItemCounter = 0;
  function rows(group) {
    let groupItems = Object.values(group).map(v => FrontPageItem(v));
    let groupMatrix = [];
    for (let [i, item] of groupItems.entries()) {
      if (i % 3 === 0) groupMatrix.push([
        <div
          className="col col--4 margin-bottom--lg"
          key={"item" + groupItemCounter++}
        >
          {item}
        </div>
      ]);
      else groupMatrix[Math.floor(i / 3)].push(
        <div
          className="col col--4 margin-bottom--lg"
          key={"item" + groupItemCounter++}
        >
          {item}
        </div>
      );
    }
    let groupRows = [];
    for (let row of groupMatrix) {
      groupRows.push(
        <div
          className="row"
          key={"group" + groupRowCounter++}
        >{row}</div>
      );
    }
    return groupRows;
  }

  return (
    <Layout>
      <div className="container">
        <h1
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "3em"
          }}
          className="padding--lg"
        >WISdoM OSS Docs</h1>

        <div className="padding-bottom--xl">
          <h1>Services</h1>
          <hr/>
          {rows(service)}
        </div>

        <div className="padding-bottom--xl">
          <h1>Frontend</h1>
          <hr/>
          {rows(frontend)}
        </div>

        <div className="padding-bottom--xl">
          <h1>Other</h1>
          <hr/>
          {rows(other)}
        </div>
      </div>
    </Layout>
  )
}
