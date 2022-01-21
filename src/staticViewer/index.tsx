import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import React from "react";
import {useLocation} from "react-router-dom";

export default function StaticViewer(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const iframeStyle = {
    width: "100%",
    height: "calc(100vh - 60px)"
  }
  let [match, currentRepo, currentBranch] = useLocation().pathname
    .match(/\/repos\/([^\/]+)\/([^\/]+)/);
  let frameSrc = `/static-repos/${currentRepo}/${currentBranch}/static_docs/`;
  return (
    <Layout
      title={`${currentRepo}/docs`}>
      <iframe id="viewerFrame" style={iframeStyle} src={frameSrc} frameBorder="0"/>
    </Layout>
  );
}
