import React, {Component} from "react";
import meta from "../../../../data/repos/meta.json";
import {useLocation} from "@docusaurus/router";
import getCurrentSelection from "./getCurrentSelection";
import Link from "@docusaurus/Link";

export default function OtherDocsOnBranchNavbarItem(props) {
  const location = useLocation();

  let match = getCurrentSelection(location.pathname);
  if (!match) return null;
  let {repo, branch: sanitizedBranch, group, rest} = match;
  let branch = meta[repo].sanitizedBranchNames[sanitizedBranch];

  let branchMeta = meta[repo].branches[branch];

  let classes = (path) => {
    let className = "navbar__item navbar__link";
    if (path === group) className += " navbar__link--active";
    return className;
  }

  let readmeTo = () => [
    "", repo, sanitizedBranch, "readme",
    branchMeta.hasReadMe.split(".md")[0]
  ].join("/");

  let docsTo = () => [
    "", repo, sanitizedBranch, "docs",
    branchMeta.hasDocs.split(".md")[0]
  ].join("/");

  let staticDocsTo = () => [
    "", repo, sanitizedBranch, "docs", ""
  ].join("/");

  let apiTo = () => [
    "", repo, sanitizedBranch, "api", ""
  ].join("/");

  let readmes = () => {
    if (!branchMeta?.hasReadMe) return null
    if (branchMeta?.readmes.length === 1) {
      return <Link to={readmeTo()} className={classes("readme")}>README</Link>
    }

    let showPath = (path) => {
      let pathSplit = path.split("/");
      let last = pathSplit.pop();
      pathSplit.push(last.toUpperCase());
      return pathSplit.join("/");
    }

    let readmes = [];
    for (let readme of branchMeta?.readmes) {
      let noExtName = readme.split(".md")[0];
      readmes.push(<li key={readme}>
        <Link className={[
          "dropdown__link",
          rest === noExtName ? "dropdown__link--active" : ""
        ].join(" ")} to={[
          "",
          repo,
          sanitizedBranch,
          group,
          noExtName
        ].join("/")}>{showPath(noExtName)}</Link>
      </li>)
    }

    return <div className="dropdown dropdown--hoverable">
      <span className="navbar__link">{showPath(rest)}</span>
      <ul className="dropdown__menu">{readmes}</ul>
    </div>;
  }


  return <div>
    {readmes()}
    {
      branchMeta?.hasDocs &&
      <Link to={docsTo()} className={classes("docs")}>Docs</Link>
    }
    {
      branchMeta?.hasStaticDocs &&
      <Link to={staticDocsTo()} className={classes("docs")}>Docs</Link>
    }
    {
      branchMeta?.hasApi &&
      <Link to={apiTo()} className={classes("api")}>API</Link>
    }
  </div>;
}

