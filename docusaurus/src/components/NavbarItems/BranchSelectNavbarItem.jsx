import React from "react";
import {useLocation} from "@docusaurus/router";
import meta from "../../../../data/repos/meta.json";
import Link from "@docusaurus/Link";
import getCurrentSelection from "./getCurrentSelection";

export default function BranchSelectNavbarItem(props) {
  const location = useLocation();

  let match = getCurrentSelection(location.pathname);
  if (!match) return null;
  let {repo, branch: sanitizedBranch, group, rest} = match;
  let branch = meta[repo].sanitizedBranchNames[sanitizedBranch];

  let validBranches = Object.entries(meta[repo].branches).filter(([k, b]) => {
    switch (group) {
      case "readme": return b.hasReadMe;
      case "docs": return b.hasDocs || b.hasStaticDocs;
      case "api": return b.hasApi;
      default: return false;
    }
  }).sort(([ka], [kb]) => ka.localeCompare(kb));

  function isDefault([k, b]) {
    return k === meta[repo].defaultBranch;
  }

  function isNotDefault([k, b]) {
    return k !== meta[repo].defaultBranch;
  }

  let defaultEntry = null;
  for (let [k, b] of validBranches.filter(isDefault)) defaultEntry = (
    <li key={k}>
      <Link className={[
        "dropdown__link",
        k === branch ? "dropdown__link--active" : ""
      ].join(" ")} to={[
        "",
        repo,
        b.sanitizedName,
        group,
        rest
      ].join("/")}>{k}</Link>
    </li>
  )

  let selectEntries = [];
  for (let [k, b] of validBranches.filter(isNotDefault)) selectEntries.push(
    <li key={k}>
      <Link className={[
        "dropdown__link",
        k === branch ? "dropdown__link--active" : ""
      ].join(" ")} to={[
        "",
        repo,
        b.sanitizedName,
        group,
        rest
        ].join("/")}>{k}</Link>
    </li>
  )


  return <div className="dropdown dropdown--hoverable dropdown--right">
    <span className="navbar__link"><b>📦 {repo}/{branch}</b></span>
    <ul className="dropdown__menu">
      {defaultEntry}
      {
        defaultEntry &&
        selectEntries.length &&
        <li><hr style={{margin: "0.3rem 0"}}/></li>
      }
      {selectEntries}
    </ul>
  </div>
}
