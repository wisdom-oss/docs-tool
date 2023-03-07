import React, {Component} from "react";
import docs from "../../../../data/repos/docs.json";
import meta from "../../../../data/repos/meta.json";
import {useLocation} from "@docusaurus/router";
import Link from "@docusaurus/Link";
import getCurrentSelection from "./getCurrentSelection";

export default function OtherGlobalDocsNavbarItem(props) {
  const location = useLocation();

  let match = getCurrentSelection(location.pathname);
  if (!match) return null;
  let {repo, rest} = match;
  if (repo !== "docs") return null;
  let currentCategory = rest.split("/")[0];

  let defaultBranch = meta.docs.defaultBranch;

  let classes = (category) => {
    let className = "navbar__item navbar__link";
    if (category === currentCategory) className += " navbar__link--active";
    return className;
  }

  let links = [];
  for (let {path, label} of docs) {
    links.push(
      <Link to={`/docs/${defaultBranch}/docs/${path}`} className={classes(path)}>
        {label}
      </Link>
    )
  }

  return <div>{links}</div>
}
